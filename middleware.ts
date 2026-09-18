import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// =======================================================================
// SafeCity Delhi NCR — Clerk Route Guard (Phase 3)
// Public:  /, /directory, /api/places/*, /api/safety-score/*, /sign-in, /sign-up
// Protected: /notes/new, POST /api/notes (enforced at the API route level)
// =======================================================================

const isPublicRoute = createRouteMatcher([
  "/",
  "/directory(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/places(.*)",
  "/api/safety-score(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Only protect routes that are NOT in the public list
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
