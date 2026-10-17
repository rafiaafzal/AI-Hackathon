import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import Masthead from "@/components/Masthead";
import SectionLabel from "@/components/SectionLabel";
import Rule from "@/components/Rule";
import { Edition } from "@/lib/edition/types";

export const instant = false;

interface ArchiveEditionItem {
  id: string;
  edition_date: string;
  layout_json: Edition | null;
  created_at: string;
}

async function ArchiveContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/onboarding");
  }

  // Query this user's editions ordered newest first
  const { data: rawEditions, error } = await supabaseAdmin
    .from("editions")
    .select("id, edition_date, layout_json, created_at")
    .eq("user_id", user.id)
    .order("edition_date", { ascending: false });

  if (error) {
    console.error("[ArchivePage] Failed to fetch editions:", error);
  }

  const editions = (rawEditions || []) as ArchiveEditionItem[];

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-8 py-8 space-y-8">
      {/* Archive meta header */}
      <div className="flex items-center justify-end border-b border-[#D9CFBF] pb-3 text-xs font-ui">
        <span className="text-[#6B655C]">
          {editions.length} {editions.length === 1 ? "Edition" : "Editions"} in Archive
        </span>
      </div>

      <Masthead name={user.name ?? undefined} />

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#D9CFBF] pb-2">
          <SectionLabel>Editions Archive &bull; Chronological Dispatches</SectionLabel>
          <span className="font-ui text-xs text-[#6B655C]">Newest First</span>
        </div>

        {editions.length === 0 ? (
          <div className="rounded-sm border border-[#D9CFBF] bg-[#FFFDF8] p-12 text-center space-y-3">
            <h3 className="font-headline text-2xl font-semibold text-[#1B1A17]">
              No Past Editions Yet
            </h3>
            <p className="font-body text-sm text-[#6B655C] max-w-md mx-auto">
              Your personalized daily editions will be preserved here each morning. Visit today&apos;s paper to view your first fresh dispatch.
            </p>
            <div className="pt-2">
              <Link
                href="/paper"
                className="inline-block rounded bg-[#9B1C1C] px-4 py-2 font-ui text-xs font-semibold text-white hover:bg-[#7D1616]"
              >
                Go to Today&apos;s Paper
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#D9CFBF] border-y border-[#D9CFBF] bg-[#FFFDF8]">
            {editions.map((item) => {
              const layout = item.layout_json;
              const editionNumber = layout?.editionNumber;
              const theme = layout?.theme || "Daily Dispatch";
              const leadTitle = layout?.lead?.title || "Daily Highlights";
              const formattedDate = new Date(item.edition_date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              });

              return (
                <article
                  key={item.id}
                  className="p-6 transition hover:bg-[#FAF5EC]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-ui text-[#6B655C]">
                      <time dateTime={item.edition_date} className="font-semibold text-[#8A5A2B]">
                        {formattedDate}
                      </time>
                      {editionNumber && (
                        <>
                          <span>&bull;</span>
                          <span className="rounded bg-[#FAF0E6] px-1.5 py-0.2 text-[10px] font-semibold text-[#8A5A2B]">
                            Edition No. {editionNumber}
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="font-headline text-xl sm:text-2xl font-bold text-[#1B1A17] leading-snug">
                      <Link
                        href={`/paper/${item.edition_date}`}
                        className="hover:text-[#9B1C1C] transition-colors"
                      >
                        {leadTitle}
                      </Link>
                    </h3>

                    <p className="font-headline italic text-sm text-[#6B655C]">
                      &ldquo;{theme}&rdquo;
                    </p>
                  </div>

                  <div className="shrink-0 self-start sm:self-center">
                    <Link
                      href={`/paper/${item.edition_date}`}
                      className="inline-flex items-center gap-1 rounded border border-[#D9CFBF] bg-white px-3.5 py-1.5 font-ui text-xs font-semibold text-[#9B1C1C] hover:border-[#9B1C1C] hover:bg-[#FAF0E6] transition"
                    >
                      Read Edition &rarr;
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <Rule double className="my-8" />

      <footer className="text-center py-4 text-xs font-ui text-[#6B655C]">
        <p>Chai &amp; News &bull; Archived Editions</p>
      </footer>
    </div>
  );
}

export default function ArchivePage() {
  return (
    <main className="min-h-screen bg-[var(--cn-bg,#FAF5EC)]">
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center font-headline text-xl text-[#8A5A2B]">
            Opening your archive...
          </div>
        }
      >
        <ArchiveContent />
      </Suspense>
    </main>
  );
}
