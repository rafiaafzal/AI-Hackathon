import Masthead from "@/components/Masthead";
import OnboardingWizard from "./OnboardingWizard";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-[var(--cn-bg,#FAF5EC)] px-4 sm:px-6 py-6 text-[var(--cn-ink,#1B1A17)]">
      <div className="mx-auto max-w-4xl">
        <Masthead />
        <div className="mt-6 sm:mt-10">
          <OnboardingWizard />
        </div>
      </div>
    </main>
  );
}
