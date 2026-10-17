import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { Edition } from "@/lib/edition/types";
import { UserProfile } from "@/lib/profile";
import NewspaperView from "@/components/NewspaperView";

export const instant = false;

interface ArchivedPaperPageProps {
  params: Promise<{
    date: string;
  }>;
}

async function ArchivedPaperContent({ params }: ArchivedPaperPageProps) {
  const { date } = await params;

  // Validate YYYY-MM-DD date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    notFound();
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/onboarding");
  }

  // Load requested edition ensuring it belongs to this user
  const { data: editionRecord, error } = await supabaseAdmin
    .from("editions")
    .select("id, user_id, edition_date, layout_json")
    .eq("user_id", user.id)
    .eq("edition_date", date)
    .maybeSingle();

  if (error || !editionRecord || !editionRecord.layout_json) {
    notFound();
  }

  const edition = editionRecord.layout_json as Edition;

  return (
    <NewspaperView
      edition={edition}
      profile={user.profile_json as UserProfile | null}
      interactive={false}
    />
  );
}

export default function ArchivedPaperPage(props: ArchivedPaperPageProps) {
  return (
    <main className="min-h-screen bg-[var(--cn-bg,#FAF5EC)]">
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center font-headline text-xl text-[#8A5A2B]">
            Retrieving archived edition...
          </div>
        }
      >
        <ArchivedPaperContent params={props.params} />
      </Suspense>
    </main>
  );
}
