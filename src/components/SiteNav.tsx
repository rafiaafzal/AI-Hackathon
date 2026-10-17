import { Suspense } from "react";
import { getCurrentUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import SiteNavClient, { NavUser } from "./SiteNavClient";

export const instant = false;

async function SiteNavContent() {
  const user = await getCurrentUser();
  let todayEditionId: string | null = null;

  if (user) {
    const todayDate = new Date().toISOString().slice(0, 10);
    const { data: edition } = await supabaseAdmin
      .from("editions")
      .select("id")
      .eq("user_id", user.id)
      .eq("edition_date", todayDate)
      .maybeSingle();

    todayEditionId = edition?.id ?? null;
  }

  const navUser: NavUser | null = user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    : null;

  return <SiteNavClient user={navUser} todayEditionId={todayEditionId} />;
}

export default function SiteNav() {
  return (
    <Suspense
      fallback={
        <header className="border-b border-[#D9CFBF] bg-[#FAF5EC] print:hidden sticky top-0 z-40">
          <div className="mx-auto max-w-5xl px-4 sm:px-8 py-2.5 flex items-center justify-between">
            <span className="font-headline text-lg sm:text-xl font-bold text-[#1B1A17]">
              Chai &amp; News
            </span>
          </div>
        </header>
      }
    >
      <SiteNavContent />
    </Suspense>
  );
}
