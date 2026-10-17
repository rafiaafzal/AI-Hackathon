"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface PaperTopBarProps {
  editionId?: string;
}

export default function PaperTopBar({}: PaperTopBarProps = {}) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/edition/generate", {
        method: "POST",
      });
      if (res.ok) {
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Failed to refresh paper: ${err.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("[PaperTopBar] Refresh error:", err);
      alert("Network error refreshing paper. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div
      aria-label="Newspaper bar"
      className="flex items-center justify-between border-b border-[#D9CFBF] pb-4 pt-2 font-ui text-xs"
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold uppercase tracking-wider text-[#8A5A2B]">
          Morning Edition
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-auto bg-[#9B1C1C] px-3.5 py-1.5 font-ui text-xs font-semibold text-white hover:bg-[#7D1616] focus:outline-none focus:ring-2 focus:ring-[#9B1C1C] focus:ring-offset-1 disabled:opacity-50 transition"
          aria-label="Refresh my paper"
        >
          {isRefreshing ? "Brewing Fresh Paper..." : "Refresh my paper"}
        </Button>
      </div>
    </div>
  );
}
