import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Masthead from "@/components/Masthead";
import SignInForm from "./SignInForm";

export const instant = false;

async function SignInGuard() {
  const cookieStore = await cookies();
  if (cookieStore.has("cn_user")) {
    redirect("/paper");
  }

  return <SignInForm />;
}

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-[var(--cn-bg,#FAF5EC)] px-4 sm:px-6 py-6 text-[var(--cn-ink,#1B1A17)]">
      <div className="mx-auto max-w-xl">
        <Masthead />
        <div className="mt-8">
          <Suspense
            fallback={
              <div className="text-center font-ui text-sm text-[#8A5A2B] py-12">
                Loading...
              </div>
            }
          >
            <SignInGuard />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
