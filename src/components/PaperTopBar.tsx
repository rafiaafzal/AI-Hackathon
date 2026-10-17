"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw, FileDown, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaperTopBarProps {
  editionId?: string;
}

export default function PaperTopBar({ editionId }: PaperTopBarProps = {}) {
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
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        alert(`Failed to refresh paper: ${err.error || "Unknown error"}`);
      }
    } catch (err: unknown) {
      console.error("[PaperTopBar] Refresh error:", err);
      alert("Network error refreshing paper. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div
      aria-label="Newspaper bar"
      className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D9CFBF] pb-4 pt-2 font-ui text-xs"
    >
      <div className="flex items-center gap-2">
        <span className="font-bold uppercase tracking-wider text-[#8A5A2B]">
          Morning Edition
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/archive"
          className="min-h-[44px] inline-flex items-center gap-1.5 rounded-sm border border-[#D9CFBF] bg-[#FFFDF8] px-3.5 py-1.5 font-ui text-xs font-semibold text-[#1B1A17] hover:border-[#9B1C1C] hover:text-[#9B1C1C] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B1C1C]"
          aria-label="View edition archive"
        >
          <Archive className="h-4 w-4 text-[#8A5A2B]" />
          <span>Archive</span>
        </Link>

        {editionId && (
          <a
            href={`/api/edition/${editionId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] inline-flex items-center gap-1.5 rounded-sm border border-[#D9CFBF] bg-[#FFFDF8] px-3.5 py-1.5 font-ui text-xs font-semibold text-[#1B1A17] hover:border-[#9B1C1C] hover:text-[#9B1C1C] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B1C1C]"
            aria-label="Download printable newspaper PDF"
          >
            <FileDown className="h-4 w-4 text-[#9B1C1C]" />
            <span>PDF Edition</span>
          </a>
        )}

        <Button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="min-h-[44px] h-auto bg-[#9B1C1C] px-3.5 py-1.5 font-ui text-xs font-semibold text-white hover:bg-[#7D1616] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B1C1C] focus-visible:ring-offset-1 disabled:opacity-50 transition inline-flex items-center gap-1.5"
          aria-label="Refresh my paper"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? "Brewing..." : "Refresh my paper"}</span>
        </Button>
      </div>
    </div>
  );
}
