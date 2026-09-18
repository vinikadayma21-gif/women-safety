/**
 * crypto.ts — Client-side AES-256-GCM encryption for SafeCity private pins.
 *
 * Zero-knowledge design:
 *   - The encryption key is NEVER sent to the server.
 *   - The server stores only opaque ciphertext + IV (base64).
 *   - Decryption requires the same Clerk userId that was used to derive the key.
 *
 * Key derivation:
 *   PBKDF2(password = clerkUserId, salt = "safecity-delhi-ncr", iterations = 100_000, hash = SHA-256)
 *   → 256-bit AES-GCM key
 *
 * All helpers are async and return base64-encoded strings for safe JSON transport.
 */

const PBKDF2_SALT = "safecity-delhi-ncr";
const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH_BITS = 256;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Encode a Uint8Array to a URL-safe base64 string. */
function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Decode a base64 string back to a Uint8Array. */
function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ---------------------------------------------------------------------------
// Key derivation
// ---------------------------------------------------------------------------

/**
 * Derive a deterministic AES-256-GCM CryptoKey from the Clerk userId.
 * The derived key is non-extractable and can only be used for encrypt/decrypt.
 *
 * @param clerkUserId  The authenticated user's Clerk ID (e.g. "user_2bX…")
 * @returns            A CryptoKey ready for AES-GCM operations
 */
export async function deriveKey(clerkUserId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();

  // 1. Import raw password material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(clerkUserId),
    { name: "PBKDF2" },
    false,       // not extractable
    ["deriveKey"]
  );

  // 2. Derive AES-256-GCM key
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(PBKDF2_SALT),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: KEY_LENGTH_BITS },
    false,       // non-extractable — key never leaves browser memory
    ["encrypt", "decrypt"]
  );
}

// ---------------------------------------------------------------------------
// Encryption
// ---------------------------------------------------------------------------

/**
 * Encrypt plaintext content for a private pin using AES-256-GCM.
 *
 * @param plaintext    The note content to encrypt (UTF-8 string)
 * @param clerkUserId  The author's Clerk ID (used to derive the key)
 * @returns            { ciphertext: base64, iv: base64 }
 */
export async function encryptNote(
  plaintext: string,
  clerkUserId: string
): Promise<{ ciphertext: string; iv: string }> {
  const key = await deriveKey(clerkUserId);
  const encoder = new TextEncoder();

  // Generate a random 96-bit (12-byte) IV — unique per note
  const ivBytes = crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: toBase64(new Uint8Array(encryptedBuffer)),
    iv: toBase64(ivBytes),
  };
}

// ---------------------------------------------------------------------------
// Decryption
// ---------------------------------------------------------------------------

/**
 * Decrypt an AES-256-GCM encrypted note (for the note author only).
 *
 * @param ciphertext   Base64-encoded encrypted content from server
 * @param iv           Base64-encoded 96-bit IV used during encryption
 * @param clerkUserId  The authenticated user's Clerk ID (must match the author)
 * @returns            Decrypted plaintext string
 * @throws             DOMException if key mismatch or data is corrupted
 */
export async function decryptNote(
  ciphertext: string,
  iv: string,
  clerkUserId: string
): Promise<string> {
  const key = await deriveKey(clerkUserId);
  const decoder = new TextDecoder();

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(iv) },
    key,
    fromBase64(ciphertext)
  );

  return decoder.decode(decryptedBuffer);
}

// ---------------------------------------------------------------------------
// Utility: check Web Crypto availability
// ---------------------------------------------------------------------------

/**
 * Returns true if the browser supports the Web Crypto API.
 * Private pin creation should be gated on this check.
 */
export function isWebCryptoAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.crypto !== "undefined" &&
    typeof window.crypto.subtle !== "undefined"
  );
}
