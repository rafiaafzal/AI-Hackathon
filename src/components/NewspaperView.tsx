import Masthead from "@/components/Masthead";
import Rule from "@/components/Rule";
import SectionLabel from "@/components/SectionLabel";
import PaperTopBar from "@/components/PaperTopBar";
import StoryCard from "@/components/StoryCard";
import SwitchReaderButton from "@/app/paper/SwitchReaderButton";
import { Edition } from "@/lib/edition/types";
import { UserProfile } from "@/lib/profile";

interface NewspaperViewProps {
  edition: Edition;
  profile?: UserProfile | null;
  interactive?: boolean;
}

export default function NewspaperView({
  edition,
  profile,
  interactive = true,
}: NewspaperViewProps) {
  const topInterests = (profile?.interests || []).slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6">
      {/* Navigation Top Bar */}
      <PaperTopBar editionId={edition.id} />

      {/* Masthead */}
      <Masthead name={edition.readerName} editionNumber={edition.editionNumber} />

      {/* Theme line */}
      {edition.theme && (
        <div className="my-6 text-center border-b border-[#D9CFBF] pb-4">
          <p className="font-headline italic text-xl sm:text-2xl text-[#1B1A17] font-medium max-w-3xl mx-auto">
            &ldquo;{edition.theme}&rdquo;
          </p>
        </div>
      )}

      <div className="space-y-10 mt-6">
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
          />
        )}

        {/* Sections in responsive 2 to 3 column grid */}
        {edition.sections.map((section) => (
          <section key={section.key} className="space-y-6 pt-2">
            <div className="flex items-center justify-between border-b border-[#D9CFBF] pb-2">
              <SectionLabel>{section.label}</SectionLabel>
              <span className="font-ui text-xs text-[#6B655C]">
                {section.items.length} {section.items.length === 1 ? "story" : "stories"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {section.items.map((item) => (
                <StoryCard
                  key={item.articleId}
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
                />
              ))}
            </div>
          </section>
        ))}

        {/* In Brief Section */}
        {edition.inBrief && edition.inBrief.length > 0 && (
          <section className="space-y-4 pt-6 border-t border-[#D9CFBF]">
            <div className="flex items-center justify-between border-b border-[#D9CFBF] pb-2">
              <SectionLabel>In Brief &bull; Rapid Scan</SectionLabel>
              <span className="font-ui text-xs text-[#6B655C]">
                {edition.inBrief.length} highlights
              </span>
            </div>
            <div className="divide-y divide-[#D9CFBF]/60">
              {edition.inBrief.map((item) => (
                <StoryCard
                  key={item.articleId}
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
                />
              ))}
            </div>
          </section>
        )}

        {/* Three things you learned today */}
        {edition.takeaways && edition.takeaways.length > 0 && (
          <section className="rounded-sm border-2 border-[#1B1A17] bg-[#FFFDF8] p-6 sm:p-8 space-y-4 my-8">
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
              {edition.takeaways.slice(0, 3).map((takeaway, idx) => (
                <li key={idx} className="pl-1">
                  <span className="font-medium text-[#1B1A17]">{takeaway}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Rabbit Hole of the Day (Discovery Story) */}
        {edition.discovery && (
          <StoryCard
            variant="discovery"
            articleId={edition.discovery.articleId}
            url={edition.discovery.url}
            title={edition.discovery.title}
            source={edition.discovery.source}
            publishedAt={edition.discovery.publishedAt}
            summary={edition.discovery.summary}
            topics={edition.discovery.topics}
            reason={edition.discovery.reason}
            readMinutes={edition.discovery.readMinutes}
            whyNew={edition.discovery.whyNew}
            interactive={interactive}
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
