import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Masthead from "@/components/Masthead";
import OnboardingWizard from "./OnboardingWizard";

export const instant = false;

interface OnboardingPageProps {
  searchParams: Promise<{
    new?: string;
  }>;
}

async function OnboardingContent({ searchParams }: OnboardingPageProps) {
  const { new: isNew } = await searchParams;

  // Unless new=1 is passed explicitly, redirect already signed-in users to /paper
  if (isNew !== "1") {
    const cookieStore = await cookies();
    if (cookieStore.has("cn_user")) {
      redirect("/paper");
    }
  }

  return <OnboardingWizard />;
}

export default function OnboardingPage(props: OnboardingPageProps) {
  return (
    <main className="min-h-screen bg-[var(--cn-bg,#FAF5EC)] px-4 sm:px-6 py-6 text-[var(--cn-ink,#1B1A17)]">
      <div className="mx-auto max-w-4xl">
        <Masthead />
        <div className="mt-6 sm:mt-10">
          <Suspense
            fallback={
              <div className="text-center font-ui text-sm text-[#8A5A2B] py-12">
                Loading...
              </div>
            }
          >
            <OnboardingContent searchParams={props.searchParams} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
