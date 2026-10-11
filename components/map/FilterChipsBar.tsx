"use client";

import { useMemo } from "react";
import {
  Shield,
  HeartHandshake,
  Siren,
  TrainFront,
  Hospital,
  Store,
  type LucideIcon,
} from "lucide-react";
import { SafetyPlace } from "@/types/place";

export type FilterCategory =
  | "ALL"
  | "PINK_BOOTH"
  | "POLICE_STATION"
  | "METRO_STATION"
  | "HOSPITAL_247"
  | "SAFE_HAVEN_STORE";

interface FilterChipsBarProps {
  activeCategory: FilterCategory;
  onSelectCategory: (category: FilterCategory) => void;
  places?: SafetyPlace[];
}

interface ChipItem {
  id: FilterCategory;
  label: string;
  icon: LucideIcon;
  color: string;
}

const CHIPS: ChipItem[] = [
  { id: "ALL", label: "All Spots", icon: Shield, color: "#10b981" },
  { id: "PINK_BOOTH", label: "Pink Booths", icon: HeartHandshake, color: "#ec4899" },
  { id: "POLICE_STATION", label: "Police", icon: Siren, color: "#6366f1" },
  { id: "METRO_STATION", label: "Metro", icon: TrainFront, color: "#10b981" },
  { id: "HOSPITAL_247", label: "Hospitals", icon: Hospital, color: "#ef4444" },
  { id: "SAFE_HAVEN_STORE", label: "Safe Havens", icon: Store, color: "#f59e0b" },
];

export default function FilterChipsBar({
  activeCategory,
  onSelectCategory,
  places = [],
}: FilterChipsBarProps) {
  // Compute counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: places.length,
    };
    for (const place of places) {
      counts[place.category] = (counts[place.category] || 0) + 1;
    }
    return counts;
  }, [places]);

  return (
    <div
      id="safecity-filter-chips"
      role="toolbar"
      aria-label="Filter safety places by category"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        overflowX: "auto",
        padding: "8px 16px",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {CHIPS.map((chip) => {
        const isActive = activeCategory === chip.id;
        const count = categoryCounts[chip.id] || 0;
        const Icon = chip.icon;

        return (
          <button
            key={chip.id}
            onClick={() => onSelectCategory(chip.id)}
            aria-pressed={isActive}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: isActive ? 700 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
              backgroundColor: isActive
                ? `${chip.color}25`
                : "rgba(20, 25, 35, 0.85)",
              color: isActive ? "#ffffff" : "#94a3b8",
              border: isActive
                ? `1.5px solid ${chip.color}`
                : "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: isActive ? `0 0 14px ${chip.color}35` : "none",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              flexShrink: 0,
            }}
          >
            <Icon size={14} color={isActive ? chip.color : "#94a3b8"} />
            <span>{chip.label}</span>
            {count > 0 && (
              <span
                style={{
                  fontSize: "10px",
                  padding: "1px 5px",
                  borderRadius: "9999px",
                  backgroundColor: isActive
                    ? chip.color
                    : "rgba(255, 255, 255, 0.1)",
                  color: isActive ? "#ffffff" : "#cbd5e1",
                  fontWeight: 700,
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
