"use client";

import { useEffect, useRef, useState } from "react";
import SectionLabel from "@/components/SectionLabel";

export interface StoryCardProps {
  articleId: string;
  url: string;
  title: string;
  source: string | null;
  publishedAt: string | null;
  summary: string | null;
  topics: string[];
  reason: string;
  readMinutes?: number;
  blurb?: string;
  whyNew?: string;
  variant?: "lead" | "section" | "inBrief" | "discovery";
  interactive?: boolean;
}

export default function StoryCard({
  articleId,
  url,
  title,
  source,
  publishedAt,
  summary,
  topics,
  reason,
  readMinutes = 2,
  blurb,
  whyNew,
  variant = "section",
  interactive = true,
}: StoryCardProps) {
  const [hidden, setHidden] = useState<boolean>(false);
  const [liked, setLiked] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const readSentRef = useRef<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Send signals helper
  const sendSignal = (type: "like" | "dislike" | "skip" | "click" | "read_time", value = 1) => {
    if (!interactive || !articleId || articleId === "placeholder") return;
    const payload = JSON.stringify({ articleId, type, value });

    if (type === "click" && typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/signals", blob);
      return;
    }

    fetch("/api/signals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch((err) => {
      console.warn("[StoryCard] Signal error:", err);
    });
  };

  // IntersectionObserver for 3s read time signal
  useEffect(() => {
    if (!interactive || readSentRef.current || !articleId || articleId === "placeholder") return;
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!timerRef.current && !readSentRef.current) {
              timerRef.current = setTimeout(() => {
                if (!readSentRef.current) {
                  readSentRef.current = true;
                  sendSignal("read_time", 3);
                }
              }, 3000);
            }
          } else {
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
          }
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      observer.disconnect();
    };
  }, [articleId, interactive]);

  const handleLike = () => {
    setLiked(!liked);
    sendSignal("like");
  };

  const handleDislike = () => {
    setHidden(true);
    sendSignal("dislike");
  };

  const handleSkip = () => {
    setHidden(true);
    sendSignal("skip");
  };

  const handleOriginalClick = () => {
    sendSignal("click");
  };

  if (hidden) {
    return null;
  }

  const feedbackControls = interactive && (
    <div className="flex items-center gap-1.5 pt-1">
      <button
        type="button"
        onClick={handleLike}
        aria-label="Like this story"
        title="Like this story"
        className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-xs transition border focus:outline-none focus:ring-2 focus:ring-[#9B1C1C] focus:ring-offset-1 ${
          liked
            ? "border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold"
            : "border-[#D9CFBF] bg-[#FFFDF8] text-[#6B655C] hover:border-[#9B1C1C] hover:text-[#9B1C1C]"
        }`}
      >
        <span aria-hidden="true" className="mr-1">👍</span>
        <span className="text-[11px] font-ui">{liked ? "Liked" : "Like"}</span>
      </button>

      <button
        type="button"
        onClick={handleDislike}
        aria-label="Not for me"
        title="Not for me"
        className="inline-flex items-center justify-center rounded border border-[#D9CFBF] bg-[#FFFDF8] px-2 py-0.5 text-xs text-[#6B655C] hover:border-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-[#9B1C1C] focus:ring-offset-1 transition"
      >
        <span aria-hidden="true" className="mr-1">👎</span>
        <span className="text-[11px] font-ui">Not for me</span>
      </button>

      <button
        type="button"
        onClick={handleSkip}
        aria-label="Skip this story"
        title="Skip this story"
        className="inline-flex items-center justify-center rounded border border-[#D9CFBF] bg-[#FFFDF8] px-2 py-0.5 text-xs text-[#6B655C] hover:border-[#9B1C1C] hover:text-[#9B1C1C] focus:outline-none focus:ring-2 focus:ring-[#9B1C1C] focus:ring-offset-1 transition"
      >
        <span aria-hidden="true" className="mr-1">✕</span>
        <span className="text-[11px] font-ui">Skip</span>
      </button>
    </div>
  );

  // Variant: Lead Story
  if (variant === "lead") {
    return (
      <article
        ref={cardRef}
        className="border-b border-[#D9CFBF] pb-8 space-y-4"
        aria-labelledby={`lead-heading-${articleId}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionLabel>Lead Story &bull; Front Page</SectionLabel>
          <span className="font-ui text-xs text-[#8A5A2B] font-medium">
            {source || "Chai & News"} &bull; {readMinutes} min read
          </span>
        </div>

        <h2
          id={`lead-heading-${articleId}`}
          className="font-headline text-3xl sm:text-5xl font-bold leading-tight text-[#1B1A17]"
        >
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOriginalClick}
            className="hover:text-[#9B1C1C] transition-colors"
          >
            {title}
          </a>
        </h2>

        {blurb && (
          <p className="font-body text-lg sm:text-xl text-[#1B1A17] font-semibold leading-relaxed max-w-4xl border-l-4 border-[#9B1C1C] pl-4 py-1 italic bg-[#FAF0E6]/30">
            {blurb}
          </p>
        )}

        {reason && (
          <p className="font-ui text-xs italic text-[#8A5A2B] font-medium">
            Why this story: <span className="font-semibold text-[#1B1A17]">{reason}</span>
          </p>
        )}

        {summary && (
          <p className="font-body text-base sm:text-lg text-[#3A3834] leading-relaxed max-w-4xl">
            {summary}
          </p>
        )}

        <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-[#D9CFBF]/60">
          <div className="flex flex-wrap items-center gap-2">
            {topics.slice(0, 3).map((topic) => (
              <span
                key={topic}
                className="rounded bg-[#FAF0E6] px-2 py-0.5 text-[11px] font-ui font-medium uppercase tracking-wider text-[#9B1C1C]"
              >
                {topic}
              </span>
            ))}
            {feedbackControls}
          </div>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOriginalClick}
            className="font-ui text-xs font-semibold text-[#9B1C1C] hover:underline flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#9B1C1C] focus:ring-offset-1 rounded px-1"
          >
            Read original &rarr;
          </a>
        </div>
      </article>
    );
  }

  // Variant: In Brief
  if (variant === "inBrief") {
    return (
      <div
        ref={cardRef}
        className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#D9CFBF]/60 py-3 text-sm"
      >
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2 text-xs font-ui text-[#6B655C]">
            <span className="font-semibold text-[#8A5A2B]">{source || "Source"}</span>
            <span>&bull;</span>
            <span>{readMinutes} min read</span>
          </div>
          <h4 className="font-headline text-base font-semibold text-[#1B1A17] leading-snug">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOriginalClick}
              className="hover:text-[#9B1C1C] transition-colors"
            >
              {title}
            </a>
          </h4>
          {summary && (
            <p className="font-body text-xs text-[#3A3834] line-clamp-2">{summary}</p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
          {feedbackControls}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOriginalClick}
            className="font-ui text-xs font-semibold text-[#9B1C1C] hover:underline whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#9B1C1C] rounded"
          >
            Read &rarr;
          </a>
        </div>
      </div>
    );
  }

  // Variant: Discovery (Rabbit hole)
  if (variant === "discovery") {
    return (
      <aside
        ref={cardRef}
        className="rounded-sm border-2 border-[#8A5A2B] bg-[#FFFDF8] p-6 sm:p-8 space-y-4"
        aria-label="Rabbit hole of the day"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionLabel className="text-[#8A5A2B]">Rabbit hole of the day</SectionLabel>
          <span className="font-ui text-xs text-[#8A5A2B] font-semibold bg-[#FAF0E6] px-2.5 py-1 rounded">
            Expand Your Horizon &bull; {readMinutes} min read
          </span>
        </div>

        <h3 className="font-headline text-2xl sm:text-3xl font-bold text-[#1B1A17] leading-snug">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOriginalClick}
            className="hover:text-[#9B1C1C] transition-colors"
          >
            {title}
          </a>
        </h3>

        {whyNew && (
          <div className="rounded border-l-4 border-[#8A5A2B] bg-[#FAF5EC] p-3 text-sm font-ui text-[#3A3834]">
            <span className="font-bold text-[#8A5A2B] uppercase tracking-wider text-[11px] block">
              Why this story:
            </span>
            {whyNew}
          </div>
        )}

        {summary && (
          <p className="font-body text-base text-[#3A3834] leading-relaxed">
            {summary}
          </p>
        )}

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#D9CFBF]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-ui text-[#8A5A2B] font-semibold">{source}</span>
            {feedbackControls}
          </div>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOriginalClick}
            className="font-ui text-xs font-semibold text-[#9B1C1C] hover:underline focus:outline-none focus:ring-2 focus:ring-[#9B1C1C] rounded"
          >
            Read original &rarr;
          </a>
        </div>
      </aside>
    );
  }

  // Variant: Standard Section Story Card (2 to 3 column grid)
  return (
    <article
      ref={cardRef}
      className="flex flex-col justify-between border-b md:border-b-0 border-[#D9CFBF] pb-6 space-y-3"
      aria-label={title}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-ui text-[#6B655C]">
          <span className="font-semibold text-[#8A5A2B]">{source || "Source"}</span>
          <span>{readMinutes} min read</span>
        </div>

        <h3 className="font-headline text-xl font-bold leading-snug text-[#1B1A17]">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOriginalClick}
            className="hover:text-[#9B1C1C] transition-colors"
          >
            {title}
          </a>
        </h3>

        {reason && (
          <p className="font-ui text-[11px] italic text-[#8A5A2B]">
            Why this story: <span className="font-medium text-[#3A3834]">{reason}</span>
          </p>
        )}

        {summary && (
          <p className="font-body text-sm text-[#3A3834] leading-relaxed line-clamp-4">
            {summary}
          </p>
        )}
      </div>

      <div className="pt-2 space-y-2 border-t border-[#D9CFBF]/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {topics.slice(0, 2).map((topic) => (
              <span
                key={topic}
                className="rounded bg-[#FAF0E6] px-1.5 py-0.5 text-[10px] font-ui uppercase tracking-wider text-[#9B1C1C]"
              >
                {topic}
              </span>
            ))}
          </div>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOriginalClick}
            className="font-ui text-xs font-semibold text-[#9B1C1C] hover:underline focus:outline-none focus:ring-2 focus:ring-[#9B1C1C] rounded"
          >
            Read &rarr;
          </a>
        </div>

        {feedbackControls}
      </div>
    </article>
  );
}
