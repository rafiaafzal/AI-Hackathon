"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface PaperTopBarProps {
  editionId: string;
}

export default function PaperTopBar({ editionId }: PaperTopBarProps) {
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
    <nav
      aria-label="Newspaper navigation"
      className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D9CFBF] pb-4 pt-2 font-ui text-xs"
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold uppercase tracking-wider text-[#8A5A2B]">
          Morning Edition
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`/api/edition/${editionId}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded border border-[#D9CFBF] bg-[#FFFDF8] px-3 py-1.5 font-medium text-[#1B1A17] hover:border-[#9B1C1C] hover:text-[#9B1C1C] focus:outline-none focus:ring-2 focus:ring-[#9B1C1C] focus:ring-offset-1 transition"
          aria-label="Download PDF edition"
        >
          <span>Download PDF</span>
        </a>

        <Link
          href="/archive"
          className="inline-flex items-center gap-1.5 rounded border border-[#D9CFBF] bg-[#FFFDF8] px-3 py-1.5 font-medium text-[#1B1A17] hover:border-[#9B1C1C] hover:text-[#9B1C1C] focus:outline-none focus:ring-2 focus:ring-[#9B1C1C] focus:ring-offset-1 transition"
          aria-label="View past editions in archive"
        >
          <span>Archive</span>
        </Link>

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
    </nav>
  );
}
