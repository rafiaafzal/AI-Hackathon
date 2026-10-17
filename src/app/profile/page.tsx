import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { UserProfile } from "@/lib/profile";
import Rule from "@/components/Rule";
import SectionLabel from "@/components/SectionLabel";
import ProfileRefineSection from "./ProfileRefineSection";

export const instant = false;

interface SignalWithArticle {
  type: string;
  articles: { topics: string[] | null } | { topics: string[] | null }[] | null;
}

async function ProfileContent() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/onboarding");
  }

  // Reload user profile to ensure fresh data
  const { data: dbUser } = await supabaseAdmin
    .from("users")
    .select("id, name, profile_json")
    .eq("id", user.id)
    .single();

  const profile = (dbUser?.profile_json || user.profile_json || {}) as UserProfile;

  // 1. Fetch signal counts (likes, skips, clicks, PDF downloads)
  const { data: allSignals } = await supabaseAdmin
    .from("signals")
    .select("type")
    .eq("user_id", user.id);

  let likesCount = 0;
  let skipsCount = 0;
  let clicksCount = 0;
  let pdfCount = 0;

  for (const s of allSignals || []) {
    if (s.type === "like") likesCount++;
    else if (s.type === "skip" || s.type === "dislike") skipsCount++;
    else if (s.type === "click") clicksCount++;
    else if (s.type === "pdf") pdfCount++;
  }

  // 2. Fetch last 30 signals joined with articles(topics)
  const { data: recentSignalsData } = await supabaseAdmin
    .from("signals")
    .select("type, articles(topics)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  const likedTopicsSet = new Set<string>();
  const skippedTopicsSet = new Set<string>();

  for (const raw of recentSignalsData || []) {
    const row = raw as unknown as SignalWithArticle;
    let topics: string[] = [];
    if (row.articles) {
      if (Array.isArray(row.articles)) {
        topics = (row.articles[0]?.topics as string[]) || [];
      } else if (Array.isArray(row.articles.topics)) {
        topics = row.articles.topics;
      }
    }

    for (const t of topics) {
      if (row.type === "like") {
        likedTopicsSet.add(t);
      } else if (row.type === "skip" || row.type === "dislike") {
        skippedTopicsSet.add(t);
      }
    }
  }

  const recentlyLikedTopics = Array.from(likedTopicsSet);
  const recentlySkippedTopics = Array.from(skippedTopicsSet);

  // 3. Top 8 topic weights, highest first
  const sortedTopicWeights = Object.entries(profile?.topic_weights || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Top interests
  const topInterests = (profile?.interests || profile?.selectedTopics || []).slice(0, 8);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-8 py-8 space-y-8">
      {/* Profile Header Bar */}
      <div className="flex items-center justify-end border-b border-[#D9CFBF] pb-4">
        <span className="font-ui text-xs uppercase tracking-widest text-[#8A5A2B] font-semibold">
          Reader Profile
        </span>
      </div>

      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <SectionLabel>Reader Intelligence</SectionLabel>
          <span className="font-ui text-xs text-[#6B655C]">
            &bull; Curated for {profile?.name || user.name || "You"}
          </span>
        </div>
        <h1 className="font-headline text-3xl sm:text-5xl font-bold tracking-tight text-[#1B1A17]">
          What we&apos;ve learned about you
        </h1>
        <p className="font-body text-base text-[#6B655C] max-w-2xl pt-1">
          A transparent overview of how our editor models your reading tastes, tracks topic affinities, and incorporates your live signals into each morning edition.
        </p>
      </header>

      <Rule double />

      {/* Profile Summary & Key Attributes */}
      <section className="rounded-sm border border-[#D9CFBF] bg-[#FFFDF8] p-6 sm:p-8 space-y-5">
        <SectionLabel>Editorial Assessment</SectionLabel>
        {profile?.summary ? (
          <blockquote className="font-body text-lg sm:text-xl italic text-[#1B1A17] border-l-4 border-[#9B1C1C] pl-4 py-1 leading-relaxed">
            &ldquo;{profile.summary}&rdquo;
          </blockquote>
        ) : (
          <p className="font-body text-base text-[#6B655C] italic">
            Profile summary being assembled from your reading habits.
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#D9CFBF]/70 font-ui text-xs">
          <div className="space-y-1">
            <span className="text-[#6B655C] uppercase tracking-wider block font-semibold text-[10px]">
              Expertise Level
            </span>
            <span className="font-medium text-[#1B1A17] capitalize">
              {profile?.expertise || "Intermediate"}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[#6B655C] uppercase tracking-wider block font-semibold text-[10px]">
              Primary Language
            </span>
            <span className="font-medium text-[#1B1A17] capitalize">
              {profile?.language ? profile.language.replace("_", " ") : "English"}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[#6B655C] uppercase tracking-wider block font-semibold text-[10px]">
              Region Focus
            </span>
            <span className="font-medium text-[#1B1A17]">
              {profile?.region || "Global"}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[#6B655C] uppercase tracking-wider block font-semibold text-[10px]">
              Depth Style
            </span>
            <span className="font-medium text-[#1B1A17] capitalize">
              {profile?.depth || "Balanced"}
            </span>
          </div>
        </div>
      </section>

      {/* Top Interests Chips */}
      {topInterests.length > 0 && (
        <section className="space-y-3">
          <SectionLabel>Core Interest Clusters</SectionLabel>
          <div className="flex flex-wrap gap-2 pt-1">
            {topInterests.map((interest) => (
              <span
                key={interest}
                className="rounded border border-[#D9CFBF] bg-[#FFFDF8] px-3.5 py-1.5 font-ui text-xs font-semibold text-[#1B1A17] shadow-2xs hover:border-[#9B1C1C] transition"
              >
                {interest}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Topic Weights Horizontal Bar List */}
      <section className="rounded-sm border border-[#D9CFBF] bg-[#FFFDF8] p-6 sm:p-8 space-y-4">
        <div className="border-b border-[#D9CFBF] pb-2 flex justify-between items-end">
          <div>
            <SectionLabel>Topic Affinity Matrix</SectionLabel>
            <h3 className="font-headline text-xl font-bold text-[#1B1A17] mt-1">
              Top Ranked Topics &amp; Relative Weights
            </h3>
          </div>
          <span className="font-ui text-xs text-[#6B655C]">Top 8 by weight</span>
        </div>

        {sortedTopicWeights.length === 0 ? (
          <p className="font-ui text-xs text-[#6B655C] italic py-2">
            No topic weights computed yet.
          </p>
        ) : (
          <div className="space-y-3 pt-2">
            {sortedTopicWeights.map(([topic, weight]) => {
              const percent = Math.round(weight * 100);
              return (
                <div key={topic} className="space-y-1">
                  <div className="flex justify-between items-center font-ui text-xs">
                    <span className="font-medium capitalize text-[#1B1A17]">
                      {topic.replace("-", " ")}
                    </span>
                    <span className="font-semibold text-[#8A5A2B]">{percent}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-[#FAF5EC] rounded-full overflow-hidden border border-[#D9CFBF]/60">
                    <div
                      className="h-full bg-[#9B1C1C] rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, Math.min(100, percent))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Signals Counts & Recent Engagement */}
      <section className="space-y-4">
        <SectionLabel>Reader Engagement Signals</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-sm border border-[#D9CFBF] bg-[#FFFDF8] p-4 text-center space-y-1">
            <span className="font-ui text-[10px] uppercase font-semibold text-[#6B655C] tracking-wider block">
              Stories Liked
            </span>
            <span className="font-headline text-3xl font-bold text-[#1B1A17]">
              {likesCount}
            </span>
          </div>

          <div className="rounded-sm border border-[#D9CFBF] bg-[#FFFDF8] p-4 text-center space-y-1">
            <span className="font-ui text-[10px] uppercase font-semibold text-[#6B655C] tracking-wider block">
              Stories Skipped
            </span>
            <span className="font-headline text-3xl font-bold text-[#1B1A17]">
              {skipsCount}
            </span>
          </div>

          <div className="rounded-sm border border-[#D9CFBF] bg-[#FFFDF8] p-4 text-center space-y-1">
            <span className="font-ui text-[10px] uppercase font-semibold text-[#6B655C] tracking-wider block">
              Articles Read / Clicked
            </span>
            <span className="font-headline text-3xl font-bold text-[#1B1A17]">
              {clicksCount}
            </span>
          </div>

          <div className="rounded-sm border border-[#D9CFBF] bg-[#FFFDF8] p-4 text-center space-y-1">
            <span className="font-ui text-[10px] uppercase font-semibold text-[#6B655C] tracking-wider block">
              PDF Downloads
            </span>
            <span className="font-headline text-3xl font-bold text-[#9B1C1C]">
              {pdfCount}
            </span>
          </div>
        </div>

        {/* Recently Liked & Skipped Topics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="rounded-sm border border-[#D9CFBF] bg-[#FFFDF8] p-5 space-y-3">
            <span className="font-ui text-xs font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-600" />
              Recently Liked Topics
            </span>
            {recentlyLikedTopics.length === 0 ? (
              <p className="font-ui text-xs text-[#6B655C] italic">
                No liked topics recorded yet. Read and like articles in your morning paper to populate this.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {recentlyLikedTopics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-ui text-xs font-medium text-emerald-900"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-sm border border-[#D9CFBF] bg-[#FFFDF8] p-5 space-y-3">
            <span className="font-ui text-xs font-semibold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-600" />
              Recently Skipped Topics
            </span>
            {recentlySkippedTopics.length === 0 ? (
              <p className="font-ui text-xs text-[#6B655C] italic">
                No skipped topics recorded yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {recentlySkippedTopics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded border border-amber-200 bg-amber-50 px-2.5 py-1 font-ui text-xs font-medium text-amber-900"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Editable Refine Section */}
      <ProfileRefineSection />

      {/* Footer */}
      <footer className="text-center py-6 border-t border-[#D9CFBF] text-xs font-ui text-[#6B655C]">
        <p>Chai &amp; News &bull; Personalized Reading Profile</p>
      </footer>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-[var(--cn-bg,#FAF5EC)]">
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center font-headline text-xl text-[#8A5A2B]">
            Loading your reading profile...
          </div>
        }
      >
        <ProfileContent />
      </Suspense>
    </main>
  );
}
