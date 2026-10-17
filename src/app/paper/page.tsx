import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { generateEdition } from "@/lib/edition/generate";
import { Edition } from "@/lib/edition/types";
import { UserProfile } from "@/lib/profile";
import NewspaperView from "@/components/NewspaperView";
import EditionSkeleton from "@/components/edition/EditionSkeleton";

export const instant = false;

async function PaperContent() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("cn_user")?.value;

  if (!userId) {
    redirect("/onboarding");
  }

  // Load user
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("id, name, profile_json")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    redirect("/onboarding");
  }

  const todayDate = new Date().toISOString().slice(0, 10);

  // Load today's edition or generate it
  const { data: editionRecord } = await supabaseAdmin
    .from("editions")
    .select("id, layout_json")
    .eq("user_id", userId)
    .eq("edition_date", todayDate)
    .maybeSingle();

  let edition: Edition;
  if (editionRecord?.layout_json) {
    edition = editionRecord.layout_json as Edition;
  } else {
    edition = await generateEdition(userId);
  }

  return (
    <NewspaperView
      edition={edition}
      profile={user.profile_json as UserProfile | null}
      interactive={true}
    />
  );
}

export default function PaperPage() {
  return (
    <main className="min-h-screen bg-[var(--cn-bg,#FAF5EC)]">
      <Suspense fallback={<EditionSkeleton />}>
        <PaperContent />
      </Suspense>
    </main>
  );
}
