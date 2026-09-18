"use client";

/**
 * Emergency Directory Page (/directory)
 * Displays all Delhi NCR helpline numbers in a click-to-call format.
 * Seeded into IndexedDB on first load so it works with zero network coverage.
 */

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  DELHI_HELPLINES,
  HelplineGroup,
  Helpline,
  HelplineCategory,
} from "@/lib/delhiHelplines";
import { useOfflineSync } from "@/hooks/useOfflineSync";

export default function DirectoryPage() {
  const { isOnline, isCached } = useOfflineSync();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<HelplineCategory | "ALL">("ALL");
  const [calledNumber, setCalledNumber] = useState<string | null>(null);

  // Persist that we have opened this page so the service worker can cache it
  useEffect(() => {
    document.title = "Emergency Directory — SafeCity Delhi NCR";
  }, []);

  // Filter helplines by search and category
  const filteredGroups = useMemo<HelplineGroup[]>(() => {
    return DELHI_HELPLINES.map((group) => ({
      ...group,
      helplines: group.helplines.filter((h) => {
        const matchesCategory =
          activeCategory === "ALL" || h.category === activeCategory;
        const q = search.toLowerCase();
        const matchesSearch =
          !q ||
          h.name.toLowerCase().includes(q) ||
          h.number.includes(q) ||
          h.description.toLowerCase().includes(q);
        return matchesCategory && matchesSearch;
      }),
    })).filter((g) => g.helplines.length > 0);
  }, [search, activeCategory]);

  const allCategories: { key: HelplineCategory | "ALL"; label: string; icon: string }[] = [
    { key: "ALL", label: "All", icon: "📋" },
    ...DELHI_HELPLINES.map((g) => ({ key: g.category, label: g.label, icon: g.icon })),
  ];

  function handleCall(number: string) {
    setCalledNumber(number);
    setTimeout(() => setCalledNumber(null), 3000);
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        backgroundColor: "#0a0d14",
        color: "#f1f5f9",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: "rgba(10, 13, 20, 0.96)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0 16px",
        }}
      >
        <div
          style={{
            maxWidth: "680px",
            margin: "0 auto",
            padding: "14px 0 0",
          }}
        >
          {/* Back + Title row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "14px",
            }}
          >
            <Link
              href="/"
              id="safecity-directory-back-btn"
              aria-label="Back to SafeCity Map"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                backgroundColor: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px",
                color: "#94a3b8",
                textDecoration: "none",
                fontSize: "16px",
                flexShrink: 0,
              }}
            >
              ←
            </Link>

            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontSize: "18px",
                  fontWeight: "800",
                  color: "#f1f5f9",
                  margin: 0,
                  letterSpacing: "-0.3px",
                  lineHeight: 1.2,
                }}
              >
                Emergency Directory
              </h1>
              <p style={{ fontSize: "11px", color: "#475569", margin: "2px 0 0" }}>
                Delhi NCR · Click any number to call
              </p>
            </div>

            {/* Online / Offline badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 10px",
                borderRadius: "20px",
                backgroundColor: isOnline
                  ? "rgba(16, 185, 129, 0.1)"
                  : "rgba(239, 68, 68, 0.1)",
                border: `1px solid ${isOnline ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                fontSize: "11px",
                fontWeight: "700",
                color: isOnline ? "#10b981" : "#ef4444",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: isOnline ? "#10b981" : "#ef4444",
                  boxShadow: `0 0 6px ${isOnline ? "#10b981" : "#ef4444"}`,
                }}
              />
              {isOnline ? "Online" : "Offline"}
            </div>
          </div>

          {/* Offline cached notice */}
          {isCached && (
            <div
              style={{
                fontSize: "11px",
                color: "#475569",
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span>✅</span> Directory cached offline — available without internet
            </div>
          )}

          {/* Search */}
          <div style={{ position: "relative", marginBottom: "14px" }}>
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "15px",
                pointerEvents: "none",
              }}
            >
              🔍
            </span>
            <input
              id="safecity-directory-search"
              type="search"
              inputMode="search"
              placeholder="Search helplines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search Delhi NCR helplines"
              style={{
                width: "100%",
                padding: "11px 14px 11px 42px",
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                color: "#f1f5f9",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor =
                  "rgba(16,185,129,0.4)";
                (e.currentTarget as HTMLInputElement).style.boxShadow =
                  "0 0 0 3px rgba(16,185,129,0.1)";
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor =
                  "rgba(255,255,255,0.1)";
                (e.currentTarget as HTMLInputElement).style.boxShadow = "none";
              }}
            />
          </div>

          {/* Category filter chips */}
          <div
            role="tablist"
            aria-label="Filter helplines by category"
            style={{
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              paddingBottom: "12px",
              scrollbarWidth: "none",
            }}
          >
            {allCategories.map(({ key, label, icon }) => {
              const isActive = activeCategory === key;
              const group = DELHI_HELPLINES.find((g) => g.category === key);
              const color = group?.color ?? "#10b981";
              return (
                <button
                  key={key}
                  role="tab"
                  id={`safecity-dir-cat-${key}`}
                  aria-selected={isActive}
                  onClick={() => setActiveCategory(key)}
                  style={{
                    flexShrink: 0,
                    padding: "6px 13px",
                    borderRadius: "20px",
                    border: isActive
                      ? `1px solid ${color}80`
                      : "1px solid rgba(255,255,255,0.08)",
                    backgroundColor: isActive ? `${color}20` : "rgba(255,255,255,0.04)",
                    color: isActive ? color : "#64748b",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    transition: "all 0.15s ease",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <span aria-hidden="true">{icon}</span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main
        id="safecity-directory-main"
        role="main"
        aria-label="Emergency Helplines"
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          padding: "20px 16px 80px",
        }}
      >
        {filteredGroups.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              color: "#475569",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔍</div>
            <p style={{ fontWeight: "600" }}>No results for &quot;{search}&quot;</p>
            <p style={{ fontSize: "13px", marginTop: "4px" }}>
              Try a different keyword or category.
            </p>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <section
              key={group.category}
              aria-labelledby={`group-heading-${group.category}`}
              style={{ marginBottom: "32px" }}
            >
              {/* Group heading */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "14px",
                }}
              >
                <span
                  style={{
                    width: "3px",
                    height: "20px",
                    backgroundColor: group.color,
                    borderRadius: "2px",
                    flexShrink: 0,
                    boxShadow: `0 0 8px ${group.color}60`,
                  }}
                  aria-hidden="true"
                />
                <h2
                  id={`group-heading-${group.category}`}
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: group.color,
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    margin: 0,
                  }}
                >
                  {group.icon} {group.label}
                </h2>
              </div>

              {/* Helpline cards */}
              <div
                role="list"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {group.helplines.map((helpline: Helpline) => (
                  <HelplineCard
                    key={helpline.id}
                    helpline={helpline}
                    accentColor={group.color}
                    isRecentlyDialed={calledNumber === helpline.number}
                    onCall={handleCall}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* ── Fixed SOS bar at bottom ── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "12px 16px max(16px, env(safe-area-inset-bottom))",
          backgroundColor: "rgba(10, 13, 20, 0.95)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          gap: "10px",
          zIndex: 50,
        }}
      >
        <a
          href="tel:112"
          id="safecity-directory-sos-btn"
          aria-label="Call Emergency 112 immediately"
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "14px",
            backgroundColor: "#ff2d55",
            borderRadius: "14px",
            color: "#fff",
            fontWeight: "900",
            fontSize: "15px",
            textDecoration: "none",
            boxShadow: "0 4px 20px rgba(255,45,85,0.45)",
          }}
        >
          🆘 SOS — Call 112
        </a>
        <a
          href="tel:1091"
          id="safecity-directory-women-btn"
          aria-label="Call Women Safety Helpline 1091"
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "14px",
            backgroundColor: "rgba(236,72,153,0.15)",
            border: "1px solid rgba(236,72,153,0.35)",
            borderRadius: "14px",
            color: "#ec4899",
            fontWeight: "800",
            fontSize: "15px",
            textDecoration: "none",
          }}
        >
          🛡️ Women — 1091
        </a>
      </div>
    </div>
  );
}

// ── Sub-component: HelplineCard ──────────────────────────────────────────────

interface HelplineCardProps {
  helpline: Helpline;
  accentColor: string;
  isRecentlyDialed: boolean;
  onCall: (number: string) => void;
}

function HelplineCard({
  helpline,
  accentColor,
  isRecentlyDialed,
  onCall,
}: HelplineCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      role="listitem"
      id={`helpline-card-${helpline.id}`}
      style={{
        backgroundColor: isRecentlyDialed
          ? `${accentColor}18`
          : "rgba(20, 25, 35, 0.8)",
        border: `1px solid ${isRecentlyDialed ? `${accentColor}50` : "rgba(255,255,255,0.07)"}`,
        borderRadius: "16px",
        padding: "14px 16px",
        transition: "all 0.2s ease",
      }}
    >
      {/* Main row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        {/* Icon circle */}
        <div
          aria-hidden="true"
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            backgroundColor: `${accentColor}18`,
            border: `1px solid ${accentColor}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            flexShrink: 0,
          }}
        >
          {helpline.icon}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: "#e2e8f0",
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {helpline.name}
            </h3>
            <a
              href={`tel:${helpline.number.replace(/-/g, "")}`}
              id={`helpline-call-${helpline.id}`}
              aria-label={`Call ${helpline.name} at ${helpline.number}`}
              onClick={() => onCall(helpline.number)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 14px",
                backgroundColor: accentColor,
                borderRadius: "10px",
                color: "#fff",
                fontWeight: "800",
                fontSize: "14px",
                textDecoration: "none",
                flexShrink: 0,
                boxShadow: `0 2px 10px ${accentColor}40`,
                letterSpacing: "0.2px",
              }}
            >
              📞 {helpline.number}
            </a>
          </div>

          {/* Availability */}
          <p
            style={{
              fontSize: "11px",
              color: "#475569",
              margin: "4px 0 0",
              fontWeight: "600",
            }}
          >
            ⏰ {helpline.availability}
          </p>

          {/* Expand toggle for description */}
          <button
            aria-expanded={expanded}
            aria-controls={`helpline-desc-${helpline.id}`}
            onClick={() => setExpanded((e) => !e)}
            style={{
              background: "none",
              border: "none",
              padding: "4px 0 0",
              cursor: "pointer",
              color: "#475569",
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              gap: "3px",
              fontWeight: "600",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#64748b";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#475569";
            }}
          >
            {expanded ? "▲ Less info" : "▼ More info"}
          </button>

          {/* Description (expanded) */}
          {expanded && (
            <p
              id={`helpline-desc-${helpline.id}`}
              style={{
                fontSize: "12px",
                color: "#94a3b8",
                lineHeight: 1.5,
                margin: "8px 0 0",
              }}
            >
              {helpline.description}
              {helpline.alternateNumbers && (
                <span style={{ display: "block", marginTop: "6px", color: "#64748b" }}>
                  Alt:{" "}
                  {helpline.alternateNumbers.map((n) => (
                    <a
                      key={n}
                      href={`tel:${n.replace(/-/g, "")}`}
                      style={{ color: accentColor, fontWeight: "700", textDecoration: "none" }}
                    >
                      {n}
                    </a>
                  )).reduce((acc: React.ReactNode[], el, i) => {
                    if (i === 0) return [el];
                    return [...acc, ", ", el];
                  }, [])}
                </span>
              )}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
