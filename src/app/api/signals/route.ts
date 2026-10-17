import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { UserProfile } from "@/lib/profile";

export const maxDuration = 60;

const SignalSchema = z.object({
  articleId: z.string().min(1, "articleId is required"),
  type: z.enum(["click", "like", "dislike", "skip", "read_time", "pdf"]),
  value: z.number().optional().default(1),
});

function parseVector(raw: unknown): number[] | null {
  if (Array.isArray(raw)) {
    return raw.map(Number);
  }
  if (typeof raw === "string") {
    try {
      const cleaned = raw.replace(/[\[\]]/g, "").trim();
      if (!cleaned) return null;
      return cleaned.split(",").map((s) => parseFloat(s.trim()));
    } catch {
      return null;
    }
  }
  return null;
}

function normalize(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  if (norm === 0) return vec;
  return vec.map((val) => val / norm);
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("cn_user")?.value;

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const rawBody: unknown = await request.json();
    const parsed = SignalSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const { articleId, type, value } = parsed.data;

    // 1. Insert into signals table
    const { data: insertedSignal, error: insertError } = await supabaseAdmin
      .from("signals")
      .insert({
        user_id: userId,
        article_id: articleId,
        type,
        value: value ?? 1,
      })
      .select("id")
      .single();

    if (insertError || !insertedSignal) {
      console.error("[POST /api/signals] Insert signal error:", insertError);
      return NextResponse.json(
        { ok: false, error: insertError?.message || "Failed to record signal" },
        { status: 500 }
      );
    }

    // 2. If signal is like, click, dislike, or skip, update user's interest_vector and topic_weights
    const isFeedbackType =
      type === "like" || type === "click" || type === "dislike" || type === "skip";

    if (isFeedbackType) {
      // Read article's embedding and topics server-side
      const { data: article } = await supabaseAdmin
        .from("articles")
        .select("embedding, topics")
        .eq("id", articleId)
        .single();

      // Read user's current vector and profile_json
      const { data: user } = await supabaseAdmin
        .from("users")
        .select("interest_vector, profile_json")
        .eq("id", userId)
        .single();

      if (user) {
        const updatePayload: {
          interest_vector?: string;
          profile_json?: UserProfile;
        } = {};

        // A. Vector update
        const userVec = parseVector(user.interest_vector);
        const articleVec = article ? parseVector(article.embedding) : null;

        if (articleVec && articleVec.length > 0) {
          const currentVec =
            userVec && userVec.length === articleVec.length
              ? userVec
              : new Array(articleVec.length).fill(0);

          let updatedVec: number[];
          if (type === "like" || type === "click") {
            // positive: v = normalize(v*0.95 + 0.05*articleEmbedding)
            updatedVec = currentVec.map((val, idx) => val * 0.95 + 0.05 * articleVec[idx]);
          } else {
            // negative: v = normalize(v - 0.03*articleEmbedding)
            updatedVec = currentVec.map((val, idx) => val - 0.03 * articleVec[idx]);
          }

          const normalizedVec = normalize(updatedVec);
          updatePayload.interest_vector = `[${normalizedVec.join(",")}]`;
        }

        // B. Topic weights nudge: like +0.05, click +0.02, dislike -0.07, skip -0.05, clamped 0..1
        let delta = 0;
        if (type === "like") delta = 0.05;
        else if (type === "click") delta = 0.02;
        else if (type === "dislike") delta = -0.07;
        else if (type === "skip") delta = -0.05;

        const articleTopics = Array.isArray(article?.topics) ? (article.topics as string[]) : [];
        if (articleTopics.length > 0 && delta !== 0) {
          const profile = (user.profile_json || {}) as UserProfile;
          const currentTopicWeights: Record<string, number> = {
            ...(profile.topic_weights || {}),
          };

          for (const topic of articleTopics) {
            const currentW = currentTopicWeights[topic] ?? 0.5;
            const nudged = Math.max(0, Math.min(1, currentW + delta));
            currentTopicWeights[topic] = Math.round(nudged * 1000) / 1000;
          }

          profile.topic_weights = currentTopicWeights;
          updatePayload.profile_json = profile;
        }

        if (Object.keys(updatePayload).length > 0) {
          await supabaseAdmin
            .from("users")
            .update(updatePayload)
            .eq("id", userId);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      signalId: (insertedSignal as { id: string }).id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/signals] Error:", err);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
