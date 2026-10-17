"use client";

import React from "react";

export type TimeBudget = "5" | "10" | "20" | "full";

export interface TimeBudgetControlProps {
  budget: TimeBudget;
  onBudgetChange: (budget: TimeBudget) => void;
  storyCount: number;
  totalMinutes: number;
}

const BUDGET_OPTIONS: { id: TimeBudget; label: string }[] = [
  { id: "5", label: "5 min" },
  { id: "10", label: "10 min" },
  { id: "20", label: "20 min" },
  { id: "full", label: "Full paper" },
];

export default function TimeBudgetControl({
  budget,
  onBudgetChange,
  storyCount,
  totalMinutes,
}: TimeBudgetControlProps) {
  return (
    <div
      aria-label="Reading time budget control"
      className="my-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-[#D9CFBF] bg-[#FFFDF8] p-3 sm:px-4 sm:py-2.5"
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="font-ui text-xs font-bold uppercase tracking-wider text-[#1B1A17]">
          I have:
        </span>
        <div
          role="radiogroup"
          aria-label="Select your reading time"
          className="inline-flex rounded-sm border border-[#D9CFBF] bg-[#FAF5EC] p-0.5"
        >
          {BUDGET_OPTIONS.map((opt) => {
            const isActive = budget === opt.id;
            return (
              <button
                key={opt.id}
                role="radio"
                aria-checked={isActive}
                type="button"
                onClick={() => onBudgetChange(opt.id)}
                className={`min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-sm font-ui text-xs font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B1C1C] focus-visible:ring-offset-1 ${
                  isActive
                    ? "bg-[#9B1C1C] text-white shadow-xs"
                    : "text-[#6B655C] hover:text-[#1B1A17] hover:bg-[#D9CFBF]/30"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
        className="font-ui text-xs font-medium text-[#6B655C]"
      >
        Showing{" "}
        <span className="font-bold text-[#1B1A17]">{storyCount}</span>{" "}
        {storyCount === 1 ? "story" : "stories"} &bull; about{" "}
        <span className="font-bold text-[#1B1A17]">{totalMinutes}</span> min
      </div>
    </div>
  );
}
