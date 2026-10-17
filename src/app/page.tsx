import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import Masthead from "@/components/Masthead";
import Rule from "@/components/Rule";
import SectionLabel from "@/components/SectionLabel";

export const instant = false;

async function LandingAction() {
  const cookieStore = await cookies();
  const hasUser = cookieStore.has("cn_user");

  if (hasUser) {
    return (
      <Link
        href="/paper"
        className="font-ui inline-flex items-center justify-center rounded-sm bg-[var(--cn-accent,#9B1C1C)] px-8 py-3.5 text-sm font-semibold tracking-wide text-white transition hover:bg-[#801616] focus:outline-none focus:ring-2 focus:ring-[#9B1C1C] focus:ring-offset-2"
      >
        Open today&apos;s paper &rarr;
      </Link>
    );
  }

  return (
    <Link
      href="/onboarding"
      className="font-ui inline-flex items-center justify-center rounded-sm bg-[var(--cn-accent,#9B1C1C)] px-8 py-3.5 text-sm font-semibold tracking-wide text-white transition hover:bg-[#801616] focus:outline-none focus:ring-2 focus:ring-[#9B1C1C] focus:ring-offset-2"
    >
      Brew my paper &rarr;
    </Link>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--cn-bg,#FAF5EC)] text-[var(--cn-ink,#1B1A17)] px-4 sm:px-8 py-6">
      <div className="mx-auto max-w-4xl">
        <Masthead />

        <section className="mt-8 sm:mt-14 mb-16 text-center space-y-8">
          <SectionLabel>Edition Preview &bull; Curated Daily</SectionLabel>

          <div className="mx-auto max-w-2xl space-y-4">
            <h2 className="font-headline text-3xl sm:text-5xl font-bold leading-tight">
              One paper. Only the stories you care about. Every morning.
            </h2>
            <p className="font-body text-lg sm:text-xl text-[var(--cn-muted,#6B655C)] leading-relaxed italic">
              Tailored to your curiosity, distilled from global and regional feeds, and curated cleanly without noise or algorithm traps.
            </p>
          </div>

          <div className="pt-4">
            <Suspense
              fallback={
                <Link
                  href="/onboarding"
                  className="font-ui inline-flex items-center justify-center rounded-sm bg-[var(--cn-accent,#9B1C1C)] px-8 py-3.5 text-sm font-semibold tracking-wide text-white"
                >
                  Brew my paper &rarr;
                </Link>
              }
            >
              <LandingAction />
            </Suspense>
          </div>
        </section>

        <Rule />

        <footer className="py-6 text-center text-xs font-ui text-[var(--cn-muted,#6B655C)] space-y-1">
          <p>Chai &amp; News &bull; Printed Fresh Every Morning</p>
          <p className="text-[11px] opacity-75">Curated with Gemini &bull; Powered by RSS &amp; pgvector</p>
        </footer>
      </div>
    </main>
  );
}
