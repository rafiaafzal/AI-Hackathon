import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildProfile } from "@/lib/profile";
import { embed } from "@/lib/ai";
import { supabaseAdmin } from "@/lib/supabase";

export const maxDuration = 60;

const OnboardingBodySchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  topics: z.array(z.string()).min(3, "Select at least 3 topics"),
  topicDepth: z.record(z.string(), z.number()).default({}),
  about: z.string().max(600).optional().default(""),
  language: z.enum(["english", "urdu", "roman_urdu", "mixed"]).default("english"),
  region: z.string().default("Global"),
  deliveryTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format must be HH:MM")
    .default("07:00"),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody: unknown = await request.json();
    const parsed = OnboardingBodySchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, email, topics, topicDepth, about, language, region, deliveryTime } =
      parsed.data;

    // Check if a user with this email already exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { ok: false, error: "This email already has a paper. Please sign in." },
        { status: 409 }
      );
    }

    // 1. Build structured profile using Gemini
    const profile = await buildProfile({
      name,
      topics,
      topicDepth,
      about,
      language,
      region,
      deliveryTime,
    });

    // 2. Build rich interest text for embedding
    const interestText = `${profile.summary} Interests: ${profile.interests.join(
      ", "
    )}. Keywords: ${profile.keywords.join(", ")}. Topics: ${profile.selectedTopics.join(
      ", "
    )}.`;

    // 3. Generate 1536-dimensional embedding
    const vectors = await embed([interestText]);
    const userVector = vectors[0] ?? new Array(1536).fill(0);
    const pgvectorString = `[${userVector.join(",")}]`;

    // 4. Insert row into `users` table
    const { data, error } = await supabaseAdmin
      .from("users")
      .insert({
        name: profile.name,
        email,
        profile_json: profile,
        interest_vector: pgvectorString,
      })
      .select("id")
      .single();

    if (error || !data) {
      if (error?.code === "23505" || error?.message?.includes("duplicate key")) {
        return NextResponse.json(
          { ok: false, error: "This email already has a paper. Please sign in." },
          { status: 409 }
        );
      }
      console.error("[onboarding] Supabase user insertion error:", error);
      return NextResponse.json(
        { ok: false, error: error?.message || "Failed to create user record" },
        { status: 500 }
      );
    }

    const userId = (data as { id: string }).id;

    // 5. Set httpOnly cookie `cn_user`
    const response = NextResponse.json({ ok: true, userId });
    response.cookies.set("cn_user", userId, {
      path: "/",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60, // 1 year
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[onboarding] Fatal error:", err);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
