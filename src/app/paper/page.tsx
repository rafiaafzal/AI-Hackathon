// NOTE: This is a temporary preview page before the real edition engine is implemented.
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Masthead from "@/components/Masthead";
import Rule from "@/components/Rule";
import SectionLabel from "@/components/SectionLabel";
import { getRankedArticlesForUser } from "@/lib/rank-preview";
import SwitchReaderButton from "./SwitchReaderButton";

export const instant = false;

async function PaperContent() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("cn_user")?.value;

  if (!userId) {
    redirect("/onboarding");
  }

  const preview = await getRankedArticlesForUser(userId);

  if (!preview) {
    redirect("/onboarding");
  }

  const { user, articles } = preview;
  const leadArticle = articles[0] ?? null;
  const otherArticles = articles.slice(1);

  // Compute matched interest for lead story
  const topTopics = Object.entries(user.profile?.topic_weights ?? {})
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic);

  const matchedTopic =
    leadArticle?.topics?.find((t) => topTopics.includes(t)) ||
    topTopics[0] ||
    "your core reading profile";

  const topInterests = user.profile?.interests?.slice(0, 5) || [];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6">
      {/* Masthead with personalized name */}
      <Masthead name={user.name} />

      {articles.length === 0 ? (
        <div className="my-16 text-center text-[#6B655C] space-y-3">
          <p className="font-headline text-2xl font-semibold">No articles available yet.</p>
          <p className="font-body text-sm">Run the ingestion cron to populate your morning edition.</p>
        </div>
      ) : (
        <div className="space-y-10 mt-6">
          {/* Big Lead Story */}
          {leadArticle && (
            <article className="border-b border-[#D9CFBF] pb-8 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <SectionLabel>Lead Story &bull; Front Page</SectionLabel>
                <span className="font-ui text-xs text-[#8A5A2B] font-medium">
                  {leadArticle.source} &bull;{" "}
                  {leadArticle.published_at
                    ? new Date(leadArticle.published_at).toLocaleDateString()
                    : "Today"}
                </span>
              </div>

              <h2 className="font-headline text-3xl sm:text-5xl font-bold leading-tight text-[#1B1A17]">
                <a
                  href={leadArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#9B1C1C] transition-colors"
                >
                  {leadArticle.title}
                </a>
              </h2>

              <p className="font-ui text-xs italic text-[#8A5A2B] font-medium">
                Why this story: matches your interest in{" "}
                <span className="font-semibold capitalize text-[#9B1C1C]">{matchedTopic}</span>
              </p>

              {leadArticle.summary && (
                <p className="font-body text-lg sm:text-xl text-[#3A3834] leading-relaxed max-w-4xl pt-1">
                  {leadArticle.summary}
                </p>
              )}

              <div className="pt-2 flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {leadArticle.topics?.map((topic) => (
                    <span
                      key={topic}
                      className="rounded bg-[#FAF0E6] px-2 py-0.5 text-[11px] font-ui font-medium uppercase tracking-wider text-[#9B1C1C]"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
                <a
                  href={leadArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-ui text-xs font-semibold text-[#9B1C1C] hover:underline flex items-center gap-1"
                >
                  Read original &rarr;
                </a>
              </div>
            </article>
          )}

          {/* Other 11 Stories in 2 to 3 column grid */}
          {otherArticles.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#D9CFBF] pb-2">
                <SectionLabel>Curated Dispatch &bull; Deep Reads &amp; Highlights</SectionLabel>
                <span className="font-ui text-xs text-[#6B655C]">
                  {otherArticles.length} additional stories
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {otherArticles.map((article, idx) => (
                  <article
                    key={article.id || idx}
                    className="flex flex-col justify-between border-b border-[#D9CFBF] pb-6 sm:border-b-0 space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-ui text-[#6B655C]">
                        <span className="font-semibold text-[#8A5A2B]">{article.source}</span>
                        <time dateTime={article.published_at || ""}>
                          {article.published_at
                            ? new Date(article.published_at).toLocaleDateString()
                            : ""}
                        </time>
                      </div>

                      <h3 className="font-headline text-xl font-bold leading-snug text-[#1B1A17]">
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#9B1C1C] transition-colors"
                        >
                          {article.title}
                        </a>
                      </h3>

                      {article.summary && (
                        <p className="font-body text-sm text-[#3A3834] leading-relaxed line-clamp-4">
                          {article.summary}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {article.topics?.slice(0, 2).map((topic) => (
                          <span
                            key={topic}
                            className="rounded bg-[#FAF0E6] px-1.5 py-0.5 text-[10px] font-ui uppercase tracking-wider text-[#9B1C1C]"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-ui text-[11px] font-semibold text-[#9B1C1C] hover:underline"
                      >
                        Read &rarr;
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </section>
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

            {user.profile?.summary && (
              <p className="font-body text-base text-[#3A3834] leading-relaxed italic border-l-2 border-[#8A5A2B] pl-4 py-1">
                &ldquo;{user.profile.summary}&rdquo;
              </p>
            )}

            {topInterests.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="font-ui text-xs uppercase tracking-wider text-[#6B655C] font-semibold">
                  Top Key Interests:
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
      )}
    </div>
  );
}

export default function PaperPage() {
  return (
    <main className="min-h-screen bg-[var(--cn-bg,#FAF5EC)]">
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center font-headline text-xl text-[#8A5A2B]">
            Brewing your paper...
          </div>
        }
      >
        <PaperContent />
      </Suspense>
    </main>
  );
}
