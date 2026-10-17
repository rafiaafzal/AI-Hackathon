"use client";

import { useMemo, useSyncExternalStore } from "react";
import Masthead from "@/components/Masthead";
import Rule from "@/components/Rule";
import SectionLabel from "@/components/SectionLabel";
import PaperTopBar from "@/components/PaperTopBar";
import StoryCard from "@/components/StoryCard";
import SwitchReaderButton from "@/app/paper/SwitchReaderButton";
import TimeBudgetControl, { TimeBudget } from "@/components/TimeBudgetControl";
import { Edition, EditionItem, EditionSection } from "@/lib/edition/types";
import { UserProfile } from "@/lib/profile";

interface NewspaperViewProps {
  edition: Edition;
  profile?: UserProfile | null;
  interactive?: boolean;
}

function filterEditionByBudget(
  edition: Edition,
  budget: TimeBudget
): {
  filteredEdition: Edition;
  storyCount: number;
  totalMinutes: number;
} {
  const leadMinutes = Math.max(1, edition.lead?.readMinutes || 1);
  if (budget === "full") {
    let count = edition.lead ? 1 : 0;
    let mins = edition.lead ? leadMinutes : 0;
    for (const sec of edition.sections || []) {
      for (const item of sec.items || []) {
        count++;
        mins += Math.max(1, item.readMinutes || 1);
      }
    }
    for (const item of edition.inBrief || []) {
      count++;
      mins += Math.max(1, item.readMinutes || 1);
    }
    if (edition.discovery) {
      count++;
      mins += Math.max(1, edition.discovery.readMinutes || 1);
    }
    return {
      filteredEdition: edition,
      storyCount: count,
      totalMinutes: mins,
    };
  }

  const budgetMins = parseInt(budget, 10);
  let currentMins = leadMinutes;
  let count = edition.lead ? 1 : 0;

  const newSections: EditionSection[] = [];

  for (const sec of edition.sections || []) {
    const includedItems: EditionItem[] = [];
    for (const item of sec.items || []) {
      const itemMins = Math.max(1, item.readMinutes || 1);
      if (currentMins + itemMins <= budgetMins) {
        includedItems.push(item);
        currentMins += itemMins;
        count++;
      }
    }
    if (includedItems.length > 0) {
      newSections.push({
        ...sec,
        items: includedItems,
      });
    }
  }

  const newInBrief: EditionItem[] = [];
  for (const item of edition.inBrief || []) {
    const itemMins = Math.max(1, item.readMinutes || 1);
    if (currentMins + itemMins <= budgetMins) {
      newInBrief.push(item);
      currentMins += itemMins;
      count++;
    }
  }

  let newDiscovery = undefined;
  if (edition.discovery) {
    const discMins = Math.max(1, edition.discovery.readMinutes || 1);
    if (currentMins + discMins <= budgetMins) {
      newDiscovery = edition.discovery;
      currentMins += discMins;
      count++;
    }
  }

  return {
    filteredEdition: {
      ...edition,
      sections: newSections,
      inBrief: newInBrief,
      discovery: newDiscovery,
    },
    storyCount: count,
    totalMinutes: currentMins,
  };
}

function subscribeToBudget(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("cn_time_budget_change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("cn_time_budget_change", callback);
  };
}

function getBudgetSnapshot(): TimeBudget {
  if (typeof window === "undefined") return "full";
  try {
    const saved = localStorage.getItem("cn_time_budget") as TimeBudget | null;
    if (saved === "5" || saved === "10" || saved === "20" || saved === "full") {
      return saved;
    }
  } catch {}
  return "full";
}

function getBudgetServerSnapshot(): TimeBudget {
  return "full";
}

export default function NewspaperView({
  edition,
  profile,
  interactive = true,
}: NewspaperViewProps) {
  const topInterests = (profile?.interests || []).slice(0, 5);
  const budget = useSyncExternalStore(
    subscribeToBudget,
    getBudgetSnapshot,
    getBudgetServerSnapshot
  );

  const handleBudgetChange = (newBudget: TimeBudget) => {
    try {
      localStorage.setItem("cn_time_budget", newBudget);
      window.dispatchEvent(new Event("cn_time_budget_change"));
    } catch {
      // LocalStorage unavailable
    }
  };

  const { filteredEdition, storyCount, totalMinutes } = useMemo(
    () => filterEditionByBudget(edition, budget),
    [edition, budget]
  );

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6 animate-fade-up">
      {/* Navigation Top Bar */}
      <PaperTopBar editionId={edition.id} />

      {/* Reading Time Budget Control */}
      <TimeBudgetControl
        budget={budget}
        onBudgetChange={handleBudgetChange}
        storyCount={storyCount}
        totalMinutes={totalMinutes}
      />

      {/* Masthead */}
      <Masthead
        name={edition.readerName}
        editionNumber={edition.editionNumber}
        layoutStyle={filteredEdition.layoutStyle}
      />

      {/* Theme line */}
      {edition.theme && (
        <div className="my-6 text-center border-b border-[#D9CFBF] pb-4">
          <p className="font-headline italic text-xl sm:text-2xl text-[#1B1A17] font-medium max-w-3xl mx-auto">
            &ldquo;{edition.theme}&rdquo;
          </p>
        </div>
      )}

      <div className="space-y-10 mt-6">
        {/* What changed since yesterday banner */}
        {edition.changes && edition.changes.length > 0 && (
          <aside
            aria-label="What changed since yesterday"
            className="rounded-sm border border-[#D9CFBF] border-l-4 border-l-[#8A5A2B] bg-[#8A5A2B]/10 p-5 shadow-xs"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="font-ui text-xs font-bold uppercase tracking-wider text-[#8A5A2B]">
                What changed since yesterday
              </span>
            </div>
            <ul className="space-y-1.5 font-ui text-sm text-[#3A3834]">
              {edition.changes.map((change, idx) => (
                <li key={idx} className="flex items-baseline gap-2">
                  <span className="text-[#8A5A2B] font-bold select-none">&bull;</span>
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {/* Lead Story */}
        {edition.lead && (
          <StoryCard
            variant="lead"
            articleId={edition.lead.articleId}
            url={edition.lead.url}
            title={edition.lead.title}
            source={edition.lead.source}
            publishedAt={edition.lead.publishedAt}
            summary={edition.lead.summary}
            topics={edition.lead.topics}
            reason={edition.lead.reason}
            readMinutes={edition.lead.readMinutes}
            blurb={edition.lead.blurb}
            interactive={interactive}
            layoutStyle={filteredEdition.layoutStyle}
          />
        )}

        {/* Sections in responsive 2 to 3 column grid */}
        {filteredEdition.sections.map((section) => (
          <section key={section.key} className="space-y-6 pt-2">
            <div className="flex items-center justify-between border-b border-[#D9CFBF] pb-2">
              <SectionLabel>{section.label}</SectionLabel>
              <span className="font-ui text-xs text-[#6B655C]">
                {section.items.length} {section.items.length === 1 ? "story" : "stories"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {section.items.map((item) => (
                <div key={item.articleId} className="stagger-card">
                  <StoryCard
                    variant="section"
                    articleId={item.articleId}
                    url={item.url}
                    title={item.title}
                    source={item.source}
                    publishedAt={item.publishedAt}
                    summary={item.summary}
                    topics={item.topics}
                    reason={item.reason}
                    readMinutes={item.readMinutes}
                    interactive={interactive}
                    layoutStyle={filteredEdition.layoutStyle}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* In Brief Section */}
        {filteredEdition.inBrief && filteredEdition.inBrief.length > 0 && (
          <section className="space-y-4 pt-6 border-t border-[#D9CFBF]">
            <div className="flex items-center justify-between border-b border-[#D9CFBF] pb-2">
              <SectionLabel>In Brief &bull; Rapid Scan</SectionLabel>
              <span className="font-ui text-xs text-[#6B655C]">
                {filteredEdition.inBrief.length} highlights
              </span>
            </div>
            <div className="divide-y divide-[#D9CFBF]/60">
              {filteredEdition.inBrief.map((item) => (
                <div key={item.articleId} className="stagger-card">
                  <StoryCard
                    variant="inBrief"
                    articleId={item.articleId}
                    url={item.url}
                    title={item.title}
                    source={item.source}
                    publishedAt={item.publishedAt}
                    summary={item.summary}
                    topics={item.topics}
                    reason={item.reason}
                    readMinutes={item.readMinutes}
                    interactive={interactive}
                    layoutStyle={filteredEdition.layoutStyle}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty budget limit state if sections and inBrief are filtered out */}
        {filteredEdition.sections.length === 0 && filteredEdition.inBrief.length === 0 && (
          <div className="rounded-sm border border-[#D9CFBF] bg-[#FFFDF8] p-8 text-center space-y-3 my-8 shadow-xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FAF5EC] border border-[#D9CFBF] text-[#8A5A2B] text-xl">
              ⏱️
            </div>
            <h4 className="font-headline text-xl text-[#1B1A17] font-bold">
              You&apos;ve reached your {budget} minute reading limit
            </h4>
            <p className="font-ui text-sm text-[#6B655C] max-w-md mx-auto">
              Want to dive into more stories? Expand your time budget above to uncover the rest of today&apos;s curated sections.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleBudgetChange("full")}
                className="btn-press min-h-[44px] inline-flex items-center justify-center rounded bg-[#9B1C1C] px-5 py-2 font-ui text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#801616] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B1C1C] focus-visible:ring-offset-2 transition"
              >
                Show Full Paper &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Three things you learned today */}
        {filteredEdition.takeaways && filteredEdition.takeaways.length > 0 && (
          <section className="rounded-sm border border-[#D9CFBF] border-l-4 border-l-[#9B1C1C] bg-[#9B1C1C]/5 p-6 sm:p-8 space-y-4 my-8">
            <div className="flex items-center gap-2">
              <SectionLabel>Daily Digest</SectionLabel>
              <span className="font-ui text-xs font-semibold uppercase tracking-wider text-[#8A5A2B]">
                &bull; Three Things You Learned Today
              </span>
            </div>
            <h3 className="font-headline text-2xl sm:text-3xl font-bold text-[#1B1A17]">
              Three Things You Learned Today
            </h3>
            <ol className="list-decimal list-inside space-y-3 font-body text-base sm:text-lg text-[#3A3834] leading-relaxed pt-2">
              {filteredEdition.takeaways.slice(0, 3).map((takeaway, idx) => (
                <li key={idx} className="pl-1">
                  <span className="font-medium text-[#1B1A17]">{takeaway}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Rabbit Hole of the Day (Discovery Story) */}
        {filteredEdition.discovery && (
          <StoryCard
            variant="discovery"
            articleId={filteredEdition.discovery.articleId}
            url={filteredEdition.discovery.url}
            title={filteredEdition.discovery.title}
            source={filteredEdition.discovery.source}
            publishedAt={filteredEdition.discovery.publishedAt}
            summary={filteredEdition.discovery.summary}
            topics={filteredEdition.discovery.topics}
            reason={filteredEdition.discovery.reason}
            readMinutes={filteredEdition.discovery.readMinutes}
            whyNew={filteredEdition.discovery.whyNew}
            interactive={interactive}
            layoutStyle={filteredEdition.layoutStyle}
          />
        )}

        <Rule double className="my-10" />

        {/* Reader Profile Insight Box */}
        <section className="rounded-sm border border-[#D9CFBF] bg-[#FFFDF8] p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <SectionLabel>Reader Profile</SectionLabel>
              <h3 className="font-headline text-xl font-bold text-[#1B1A17]">
                What we understood about you
              </h3>
            </div>
            <SwitchReaderButton />
          </div>

          {profile?.summary && (
            <p className="font-body text-base text-[#3A3834] leading-relaxed italic border-l-2 border-[#8A5A2B] pl-4 py-1">
              &ldquo;{profile.summary}&rdquo;
            </p>
          )}

          {topInterests.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="font-ui text-xs uppercase tracking-wider text-[#6B655C] font-semibold">
                Top 5 Interests:
              </span>
              <div className="flex flex-wrap gap-2">
                {topInterests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded border border-[#D9CFBF] bg-[#FAF5EC] px-3 py-1 font-ui text-xs font-medium text-[#1B1A17]"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <footer className="text-center py-6 text-xs font-ui text-[#6B655C]">
          <p>End of Today&apos;s Edition &bull; Chai &amp; News</p>
        </footer>
      </div>
    </div>
  );
}
