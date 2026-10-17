"use client";

import { useEffect, useRef, useState } from "react";
import SectionLabel from "@/components/SectionLabel";
import { toOneSentence } from "@/lib/utils";
import { getTopicStyle } from "@/lib/topic-style";

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
  layoutStyle?: "brief" | "balanced" | "deep";
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
  layoutStyle,
}: StoryCardProps) {
  const [hidden, setHidden] = useState<boolean>(false);
  const [liked, setLiked] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const readSentRef = useRef<boolean>(false);
  const displaySummary = layoutStyle === "brief" ? toOneSentence(summary) : summary;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const primaryTopic = topics && topics.length > 0 ? topics[0] : "general";
  const primaryStyle = getTopicStyle(primaryTopic);

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
                  const payload = JSON.stringify({ articleId, type: "read_time", value: 3 });
                  fetch("/api/signals", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: payload,
                    keepalive: true,
                  }).catch(() => {});
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
        aria-label={liked ? "Liked this story" : "Like this story"}
        title={liked ? "Liked" : "Like this story"}
        className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded px-3 py-2 text-xs transition border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B1C1C] focus-visible:ring-offset-1 ${
          liked
            ? "border-emerald-600 bg-emerald-100 text-emerald-900 font-semibold shadow-xs"
            : "border-[#D9CFBF] bg-[#FFFDF8] text-[#6B655C] hover:border-[#9B1C1C] hover:text-[#9B1C1C]"
        }`}
      >
        <span aria-hidden="true" className="mr-1.5 text-sm">{liked ? "👍" : "👍"}</span>
        <span className="text-[11px] font-ui">{liked ? "Liked" : "Like"}</span>
      </button>

      <button
        type="button"
        onClick={handleDislike}
        aria-label="Dislike this story"
        title="Not for me"
        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded border border-[#D9CFBF] bg-[#FFFDF8] px-3 py-2 text-xs text-[#6B655C] hover:border-red-600 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B1C1C] focus-visible:ring-offset-1 transition"
      >
        <span aria-hidden="true" className="mr-1.5 text-sm">👎</span>
        <span className="text-[11px] font-ui">Not for me</span>
      </button>

      <button
        type="button"
        onClick={handleSkip}
        aria-label="Skip this story"
        title="Skip this story"
        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded border border-[#D9CFBF] bg-[#FFFDF8] px-3 py-2 text-xs text-[#6B655C] hover:border-[#9B1C1C] hover:text-[#9B1C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B1C1C] focus-visible:ring-offset-1 transition"
      >
        <span aria-hidden="true" className="mr-1.5 text-sm">✕</span>
        <span className="text-[11px] font-ui">Skip</span>
      </button>
    </div>
  );

  // Variant: Lead Story
  if (variant === "lead") {
    return (
      <article
        ref={cardRef}
        style={{ borderLeft: "6px solid #9B1C1C" }}
        className={`rounded-r-sm border-y border-r border-[#D9CFBF] p-6 sm:p-8 space-y-5 transition-all duration-200 ${
          liked ? "bg-emerald-50/40 border-emerald-500/40" : "bg-[#FFFDF8]"
        }`}
        aria-labelledby={`lead-heading-${articleId}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#9B1C1C] text-white px-2.5 py-0.5 text-[11px] font-ui font-bold uppercase tracking-wider">
              Lead
            </span>
            <SectionLabel>Front Page</SectionLabel>
          </div>
          <div className="flex flex-wrap items-center gap-2 font-ui text-xs">
            <span className="font-semibold uppercase tracking-wider text-[#1B1A17] [font-variant:small-caps]">
              {source || "Chai & News"}
            </span>
            {publishedAt && (
              <span className="text-[#6B655C]">
                &bull; {new Date(publishedAt).toLocaleDateString()}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded bg-[#FAF5EC] border border-[#D9CFBF] px-2 py-0.5 text-[11px] font-ui text-[#6B655C]">
              ⏱️ {readMinutes} min
            </span>
          </div>
        </div>

        <h2
          id={`lead-heading-${articleId}`}
          className="font-headline text-3xl sm:text-[40px] font-bold leading-tight text-[#1B1A17]"
        >
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOriginalClick}
            className="hover:text-[#9B1C1C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B1C1C] rounded"
          >
            {title}
          </a>
        </h2>

        {blurb && (
          <p className="font-body text-lg sm:text-xl text-[#1B1A17] font-semibold leading-relaxed max-w-[65ch] border-l-4 border-[#9B1C1C] pl-4 py-1 italic bg-[#FAF0E6]/30">
            {blurb}
          </p>
        )}

        {reason && (
          <p className="font-ui text-xs italic text-[#8A5A2B] font-medium flex items-center gap-1.5">
            <span aria-hidden="true">💡</span>
            <span>
              Why this story: <span className="font-semibold text-[#1B1A17]">{reason}</span>
            </span>
          </p>
        )}

        {displaySummary && (
          <p className="font-body text-[16.5px] leading-[1.6] text-[#3A3834] max-w-[65ch]">
            {displaySummary}
          </p>
        )}

        <div className="pt-3 flex flex-wrap items-center justify-between gap-4 border-t border-[#D9CFBF]/60">
          <div className="flex flex-wrap items-center gap-2">
            {topics.slice(0, 3).map((topic) => {
              const tStyle = getTopicStyle(topic);
              return (
                <span
                  key={topic}
                  className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-ui font-semibold uppercase tracking-wider border"
                  style={{
                    color: tStyle.color,
                    backgroundColor: tStyle.bg,
                    borderColor: `${tStyle.color}40`,
                  }}
                >
                  <span aria-hidden="true">{tStyle.emoji}</span>
                  <span>{tStyle.label}</span>
                </span>
              );
            })}
            {feedbackControls}
          </div>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOriginalClick}
            className="min-h-[44px] inline-flex items-center font-ui text-xs font-semibold text-[#9B1C1C] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B1C1C] rounded px-2"
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
        style={{ borderLeft: `4px solid ${primaryStyle.color}` }}
        className={`rounded-r-sm border-y border-r border-[#D9CFBF]/60 p-3.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 transition-all duration-200 ${
          liked ? "bg-emerald-50/40 border-emerald-500/40" : "bg-[#FFFDF8]"
        }`}
      >
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 text-xs font-ui text-[#6B655C]">
            <span
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-ui font-semibold uppercase tracking-wider border"
              style={{
                color: primaryStyle.color,
                backgroundColor: primaryStyle.bg,
                borderColor: `${primaryStyle.color}40`,
              }}
            >
              <span aria-hidden="true">{primaryStyle.emoji}</span>
              <span>{primaryStyle.label}</span>
            </span>
            <span className="font-semibold uppercase tracking-wider text-[#1B1A17] [font-variant:small-caps]">
              {source || "Source"}
            </span>
            <span>&bull;</span>
            <span className="inline-flex items-center gap-1 rounded bg-[#FAF5EC] border border-[#D9CFBF] px-1.5 py-0.5 text-[10px] font-ui text-[#6B655C]">
              ⏱️ {readMinutes} min
            </span>
          </div>
          <h4 className="font-headline text-base font-semibold text-[#1B1A17] leading-snug">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOriginalClick}
              className="hover:text-[#9B1C1C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B1C1C] rounded"
            >
              {title}
            </a>
          </h4>
          {displaySummary && (
            <p className="font-body text-xs text-[#3A3834] line-clamp-2">{displaySummary}</p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
          {feedbackControls}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOriginalClick}
            className="min-h-[44px] inline-flex items-center font-ui text-xs font-semibold text-[#9B1C1C] hover:underline whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B1C1C] rounded px-2"
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
        style={{ borderLeft: "4px solid #3B6E8F" }}
        className={`rounded-r-sm border-y border-r border-[#3B6E8F]/40 p-6 sm:p-8 space-y-4 transition-all duration-200 ${
          liked ? "bg-emerald-50/40 border-emerald-500/40" : "bg-[#3B6E8F]/5"
        }`}
        aria-label="Rabbit hole of the day"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#3B6E8F] text-white px-2.5 py-0.5 text-[11px] font-ui font-bold uppercase tracking-wider">
              New for you
            </span>
            <SectionLabel ruleColor="#3B6E8F" className="text-[#3B6E8F]">
              Rabbit hole of the day
            </SectionLabel>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-ui text-xs font-semibold uppercase tracking-wider text-[#1B1A17] [font-variant:small-caps]">
              {source || "Dispatch"}
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-[#FAF5EC] border border-[#D9CFBF] px-2 py-0.5 text-[11px] font-ui text-[#6B655C]">
              ⏱️ {readMinutes} min
            </span>
          </div>
        </div>

        <h3 className="font-headline text-2xl sm:text-3xl font-bold text-[#1B1A17] leading-snug">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOriginalClick}
            className="hover:text-[#9B1C1C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B1C1C] rounded"
          >
            {title}
          </a>
        </h3>

        {whyNew && (
          <div className="font-body text-sm text-[#3A3834] italic border-l-2 border-[#3B6E8F] pl-3 py-1 flex items-center gap-2 bg-[#FFFDF8]/70">
            <span aria-hidden="true">💡</span>
            <span>{whyNew}</span>
          </div>
        )}

        {displaySummary && (
          <p className="font-body text-[16px] leading-[1.6] text-[#3A3834]">
            {displaySummary}
          </p>
        )}

        <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#D9CFBF]">
          <div className="flex flex-wrap items-center gap-2">
            {topics.slice(0, 3).map((topic) => {
              const tStyle = getTopicStyle(topic);
              return (
                <span
                  key={topic}
                  className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-ui font-semibold uppercase tracking-wider border"
                  style={{
                    color: tStyle.color,
                    backgroundColor: tStyle.bg,
                    borderColor: `${tStyle.color}40`,
                  }}
                >
                  <span aria-hidden="true">{tStyle.emoji}</span>
                  <span>{tStyle.label}</span>
                </span>
              );
            })}
            {feedbackControls}
          </div>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOriginalClick}
            className="min-h-[44px] inline-flex items-center font-ui text-xs font-semibold text-[#9B1C1C] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B1C1C] rounded px-2"
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
      style={{ borderLeft: `4px solid ${primaryStyle.color}` }}
      className={`rounded-r-sm border-y border-r border-[#D9CFBF] p-5 space-y-3.5 flex flex-col justify-between transition-all duration-200 ${
        liked ? "bg-emerald-50/40 border-emerald-500/40" : "bg-[#FFFDF8]"
      }`}
      aria-label={title}
    >
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-ui text-[#6B655C]">
          <span className="font-semibold uppercase tracking-wider text-[#1B1A17] [font-variant:small-caps]">
            {source || "Source"}
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-[#FAF5EC] border border-[#D9CFBF] px-2 py-0.5 text-[11px] font-ui text-[#6B655C]">
            ⏱️ {readMinutes} min
          </span>
        </div>

        <h3 className="font-headline text-[19px] font-bold leading-snug text-[#1B1A17]">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOriginalClick}
            className="hover:text-[#9B1C1C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B1C1C] rounded"
          >
            {title}
          </a>
        </h3>

        {reason && layoutStyle === "deep" && (
          <p className="font-ui text-[11px] italic text-[#8A5A2B] flex items-center gap-1.5">
            <span aria-hidden="true">💡</span>
            <span>
              Why this story: <span className="font-medium text-[#3A3834]">{reason}</span>
            </span>
          </p>
        )}

        {displaySummary && (
          <p className="font-body text-[16px] leading-[1.6] text-[#3A3834] line-clamp-4">
            {displaySummary}
          </p>
        )}
      </div>

      <div className="pt-3 space-y-2.5 border-t border-[#D9CFBF]/60">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {topics.slice(0, 2).map((topic) => {
              const tStyle = getTopicStyle(topic);
              return (
                <span
                  key={topic}
                  className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-ui uppercase font-semibold tracking-wider border"
                  style={{
                    color: tStyle.color,
                    backgroundColor: tStyle.bg,
                    borderColor: `${tStyle.color}40`,
                  }}
                >
                  <span aria-hidden="true">{tStyle.emoji}</span>
                  <span>{tStyle.label}</span>
                </span>
              );
            })}
          </div>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOriginalClick}
            className="min-h-[44px] inline-flex items-center font-ui text-xs font-semibold text-[#9B1C1C] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B1C1C] rounded px-2"
          >
            Read &rarr;
          </a>
        </div>

        {feedbackControls}
      </div>
    </article>
  );
}
