"use client";

import React from "react";

export default function EditionSkeleton() {
  return (
    <div
      aria-label="Loading edition"
      role="status"
      className="mx-auto max-w-5xl px-4 sm:px-8 py-6 space-y-8 animate-pulse"
    >
      {/* Top masthead & status bar skeleton */}
      <div className="flex items-center justify-between border-b border-[#D9CFBF] pb-4">
        <div className="h-6 w-32 bg-[#D9CFBF]/50 rounded skeleton-shimmer" />
        <div className="h-6 w-48 bg-[#D9CFBF]/40 rounded skeleton-shimmer" />
        <div className="h-8 w-24 bg-[#D9CFBF]/40 rounded skeleton-shimmer" />
      </div>

      {/* Masthead center title skeleton */}
      <div className="text-center py-6 space-y-3">
        <div className="mx-auto h-12 sm:h-16 w-3/4 max-w-md bg-[#D9CFBF]/60 rounded skeleton-shimmer" />
        <div className="mx-auto h-4 w-64 bg-[#D9CFBF]/40 rounded skeleton-shimmer" />
      </div>

      {/* Time budget bar skeleton */}
      <div className="h-12 w-full rounded border border-[#D9CFBF] bg-[#FFFDF8] p-2 flex items-center justify-between skeleton-shimmer">
        <div className="h-6 w-44 bg-[#D9CFBF]/40 rounded" />
        <div className="h-6 w-32 bg-[#D9CFBF]/30 rounded" />
      </div>

      {/* What changed banner skeleton */}
      <div className="rounded-sm border border-[#D9CFBF] border-l-4 border-l-[#8A5A2B] bg-[#FAF5EC] p-4 space-y-2 skeleton-shimmer">
        <div className="h-4 w-48 bg-[#D9CFBF]/50 rounded" />
        <div className="h-3 w-3/4 bg-[#D9CFBF]/30 rounded" />
      </div>

      {/* Lead story skeleton */}
      <div className="rounded-r-sm border-y border-r border-[#D9CFBF] border-l-[6px] border-l-[#9B1C1C] bg-[#FFFDF8] p-6 sm:p-8 space-y-5 skeleton-shimmer">
        <div className="flex justify-between items-center">
          <div className="h-5 w-20 bg-[#9B1C1C]/30 rounded" />
          <div className="h-4 w-32 bg-[#D9CFBF]/40 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-8 sm:h-10 w-5/6 bg-[#1B1A17]/20 rounded" />
          <div className="h-8 sm:h-10 w-2/3 bg-[#1B1A17]/20 rounded" />
        </div>
        <div className="space-y-2 border-l-4 border-[#9B1C1C]/40 pl-4 py-1">
          <div className="h-4 w-full max-w-2xl bg-[#8A5A2B]/20 rounded" />
          <div className="h-4 w-4/5 max-w-xl bg-[#8A5A2B]/20 rounded" />
        </div>
        <div className="flex gap-2 pt-2">
          <div className="h-6 w-20 bg-[#D9CFBF]/40 rounded" />
          <div className="h-6 w-20 bg-[#D9CFBF]/40 rounded" />
        </div>
      </div>

      {/* 2-3 Column Section stories skeleton */}
      <div className="space-y-4 pt-6">
        <div className="h-6 w-40 bg-[#D9CFBF]/60 rounded skeleton-shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="rounded-r-sm border-y border-r border-[#D9CFBF] border-l-4 border-l-[#D9CFBF] bg-[#FFFDF8] p-5 space-y-3 skeleton-shimmer"
            >
              <div className="flex justify-between">
                <div className="h-4 w-16 bg-[#D9CFBF]/40 rounded" />
                <div className="h-4 w-12 bg-[#D9CFBF]/30 rounded" />
              </div>
              <div className="h-6 w-full bg-[#1B1A17]/15 rounded" />
              <div className="h-6 w-3/4 bg-[#1B1A17]/15 rounded" />
              <div className="space-y-1.5 pt-2">
                <div className="h-3.5 w-full bg-[#6B655C]/15 rounded" />
                <div className="h-3.5 w-5/6 bg-[#6B655C]/15 rounded" />
                <div className="h-3.5 w-2/3 bg-[#6B655C]/15 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Takeaways skeleton */}
      <div className="rounded-sm border border-[#D9CFBF] border-l-4 border-l-[#9B1C1C] bg-[#FAF5EC] p-6 space-y-4 skeleton-shimmer">
        <div className="h-5 w-48 bg-[#9B1C1C]/25 rounded" />
        <div className="space-y-2">
          <div className="h-4 w-3/4 bg-[#1B1A17]/15 rounded" />
          <div className="h-4 w-2/3 bg-[#1B1A17]/15 rounded" />
          <div className="h-4 w-4/5 bg-[#1B1A17]/15 rounded" />
        </div>
      </div>
    </div>
  );
}
