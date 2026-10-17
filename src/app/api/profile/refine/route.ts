import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { buildProfile, UserProfile } from "@/lib/profile";
import { embed } from "@/lib/ai";
import { supabaseAdmin } from "@/lib/supabase";

export const maxDuration = 60;

const RefineBodySchema = z.object({
  about: z.string().max(1000).default(""),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const rawBody: unknown = await request.json().catch(() => ({}));
    const parsed = RefineBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const { about } = parsed.data;

    // Fetch latest user data
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, name, profile_json")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    const currentProfile = userData.profile_json as UserProfile | null;
    const oldTopics =
      currentProfile?.selectedTopics || currentProfile?.interests || [];

    // Re-run buildProfile with the old selected topics plus the new text
    const updatedProfile = await buildProfile({
      name: currentProfile?.name || userData.name || "Reader",
      topics: oldTopics,
      topicDepth: currentProfile?.topic_depth || {},
      about: about.trim(),
      language: currentProfile?.language,
      region: currentProfile?.region,
      deliveryTime: currentProfile?.deliveryTime,
    });

    // Re-embed
    const interestText = `${updatedProfile.summary} Interests: ${updatedProfile.interests.join(
      ", "
    )}. Keywords: ${updatedProfile.keywords.join(", ")}. Topics: ${updatedProfile.selectedTopics.join(
      ", "
    )}.`;

    const vectors = await embed([interestText]);
    const userVector = vectors[0] ?? new Array(1536).fill(0);
    const pgvectorString = `[${userVector.join(",")}]`;

    // Update profile_json and interest_vector for cookie user
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        profile_json: updatedProfile,
        interest_vector: pgvectorString,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("[POST /api/profile/refine] Supabase update error:", updateError);
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      profile: updatedProfile,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/profile/refine] Error:", err);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
