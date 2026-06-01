"use client";

import { type FocusAreaOption } from "@/lib/onboarding";

export type InboxFilterValue = "matches" | string;

interface InboxFilterBarProps {
  activeFilter: InboxFilterValue;
  availableFocusAreas: FocusAreaOption[];
  onChange: (value: InboxFilterValue) => void;
  totalCount: number;
  visibleCount: number;
}

export default function InboxFilterBar({
  activeFilter,
  availableFocusAreas,
  onChange,
  totalCount,
  visibleCount,
}: InboxFilterBarProps) {
  const filterButtons: Array<{ label: string; value: InboxFilterValue }> = [
    { label: "Matches", value: "matches" },
    ...availableFocusAreas.map((option) => ({
      label: option.label,
      value: option.id,
    })),
  ];

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((button) => {
          const isActive = activeFilter === button.value;

          return (
            <button
              key={button.value}
              type="button"
              onClick={() => onChange(button.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? "border-emerald-600 bg-emerald-100 text-emerald-900"
                  : "border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-800"
              }`}
            >
              {button.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500">
        Showing {visibleCount} of {totalCount} emails
      </p>
    </div>
  );
}