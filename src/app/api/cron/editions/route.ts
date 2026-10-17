import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateEdition } from "@/lib/edition/generate";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && cronSecret.trim().length > 0) {
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null;
    const querySecret = request.nextUrl.searchParams.get("secret");

    if (bearerToken !== cronSecret && querySecret !== cronSecret) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  const todayDate = new Date().toISOString().slice(0, 10);
  const userErrors: { userId: string; error: string }[] = [];
  let generatedCount = 0;
  let skippedExistingCount = 0;

  try {
    // 1. Fetch all users
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, name");

    if (usersError || !users) {
      return NextResponse.json(
        { ok: false, error: usersError?.message || "Failed to load users" },
        { status: 500 }
      );
    }

    // 2. Query all editions created today
    const { data: todayEditions } = await supabaseAdmin
      .from("editions")
      .select("user_id")
      .eq("edition_date", todayDate);

    const existingUserIds = new Set(
      (todayEditions || []).map((e) => e.user_id as string)
    );

    // 3. Loop sequentially for users that have no edition today
    for (const user of users) {
      const uId = user.id as string;
      if (existingUserIds.has(uId)) {
        skippedExistingCount++;
        continue;
      }

      try {
        await generateEdition(uId);
        generatedCount++;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[cron/editions] Error generating edition for user ${uId}:`, err);
        userErrors.push({ userId: uId, error: message });
      }
    }

    return NextResponse.json({
      ok: true,
      date: todayDate,
      totalUsers: users.length,
      generated: generatedCount,
      alreadyExisted: skippedExistingCount,
      errors: userErrors,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/editions] Fatal error in editions cron:", err);
    return NextResponse.json(
      {
        ok: false,
        error: message,
        generated: generatedCount,
        alreadyExisted: skippedExistingCount,
        errors: userErrors,
      },
      { status: 500 }
    );
  }
}
