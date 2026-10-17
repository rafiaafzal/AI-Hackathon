import fs from "fs";
import path from "path";
import { z } from "zod";
import { generateJSON } from "@/lib/ai";
import { withRetry } from "@/lib/retry";
import { TOPICS, Topic } from "@/lib/feeds";

export const ProfileSchema = z.object({
  summary: z.string().min(1),
  interests: z.array(z.string()).max(8).default([]),
  keywords: z.array(z.string()).max(12).default([]),
  topic_weights: z.record(z.string(), z.number().min(0).max(1)).default({}),
  depth: z.enum(["headlines", "balanced", "deep"]).default("balanced"),
  expertise: z.enum(["beginner", "intermediate", "expert"]).default("intermediate"),
  region: z.string().default("Global"),
  language: z.enum(["english", "urdu", "roman_urdu", "mixed"]).default("english"),
  avoid: z.array(z.string()).default([]),
});

export type ExtractedProfile = z.infer<typeof ProfileSchema>;

export interface BuildProfileInput {
  name: string;
  topics: string[];
  topicDepth?: Record<string, number>; // 0 to 1 slider values per topic
  about?: string;
  language?: "english" | "urdu" | "roman_urdu" | "mixed";
  region?: string;
  deliveryTime?: string;
}

export interface UserProfile extends ExtractedProfile {
  name: string;
  deliveryTime: string;
  selectedTopics: string[];
  topic_depth: Record<string, number>;
}

function getProfileSystemPrompt(): string {
  try {
    const filePath = path.join(process.cwd(), "src/prompts/profile.md");
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return `You are an expert newspaper editor profiling a reader for "Chai & News". Return JSON with summary, interests, keywords, topic_weights, depth, expertise, region, language, and avoid. Allowed topic keys: ${TOPICS.join(
      ", "
    )}.`;
  }
}

export async function buildProfile(input: BuildProfileInput): Promise<UserProfile> {
  const systemPrompt = getProfileSystemPrompt();
  const validSelectedTopics = input.topics.filter((t): t is Topic =>
    (TOPICS as readonly string[]).includes(t)
  );

  // Normalize topic depths from input or default to 0.5 (balanced)
  const normalizedDepths: Record<string, number> = {};
  for (const topic of validSelectedTopics) {
    normalizedDepths[topic] =
      input.topicDepth && typeof input.topicDepth[topic] === "number"
        ? Math.max(0, Math.min(1, input.topicDepth[topic]))
        : 0.5;
  }

  // Determine overall depth descriptor from average slider depth
  const depthValues = Object.values(normalizedDepths);
  const avgDepth =
    depthValues.length > 0
      ? depthValues.reduce((sum, d) => sum + d, 0) / depthValues.length
      : 0.5;
  const overallDepth: "headlines" | "balanced" | "deep" =
    avgDepth < 0.35 ? "headlines" : avgDepth > 0.65 ? "deep" : "balanced";

  const userPayload = {
    name: input.name,
    selectedTopics: validSelectedTopics,
    topicDepths: normalizedDepths,
    about: input.about?.trim() || "",
    language: input.language || "english",
    region: input.region || "Global",
  };

  let aiProfile: ExtractedProfile | null = null;

  try {
    const rawOutput = await withRetry(() =>
      generateJSON<unknown>(
        systemPrompt,
        `Reader details:\n${JSON.stringify(userPayload, null, 2)}`
      )
    );

    const parsed = ProfileSchema.safeParse(rawOutput);
    if (parsed.success) {
      aiProfile = parsed.data;
    } else {
      console.warn("[buildProfile] Zod schema validation warning:", parsed.error.format());
    }
  } catch (err: unknown) {
    console.error("[buildProfile] AI extraction failed, falling back to rule-based profile:", err);
  }

  // Merge rule:
  // - selected topics get a base weight of 0.6
  // - topics mentioned in free text / emphasized by AI get +0.2
  // - cap at 1.0
  const finalWeights: Record<string, number> = {};
  for (const topic of validSelectedTopics) {
    finalWeights[topic] = 0.6;
  }

  if (aiProfile?.topic_weights) {
    for (const [topic, aiWeight] of Object.entries(aiProfile.topic_weights)) {
      if ((TOPICS as readonly string[]).includes(topic)) {
        if (aiWeight >= 0.5) {
          const current = finalWeights[topic] ?? 0.4;
          finalWeights[topic] = Math.min(1.0, current + 0.2);
        }
      }
    }
  }

  // Fallback profile if AI generation fails or produces empty fields
  const fallbackSummary = `You have curated a bespoke morning digest focused on ${validSelectedTopics.join(
    ", "
  )}. Your paper brings together the most essential developments across these areas every day.`;

  const fallbackInterests = validSelectedTopics.slice(0, 8);
  const fallbackKeywords = validSelectedTopics.map((t) => t.toLowerCase());

  return {
    summary: aiProfile?.summary || fallbackSummary,
    interests:
      aiProfile?.interests && aiProfile.interests.length > 0
        ? aiProfile.interests.slice(0, 8)
        : fallbackInterests,
    keywords:
      aiProfile?.keywords && aiProfile.keywords.length > 0
        ? aiProfile.keywords.slice(0, 12).map((k) => k.toLowerCase())
        : fallbackKeywords,
    topic_weights: finalWeights,
    depth: aiProfile?.depth || overallDepth,
    expertise: aiProfile?.expertise || "intermediate",
    region: aiProfile?.region || input.region || "Global",
    language: aiProfile?.language || input.language || "english",
    avoid: aiProfile?.avoid || [],
    name: input.name,
    deliveryTime: input.deliveryTime || "07:00",
    selectedTopics: validSelectedTopics,
    topic_depth: normalizedDepths,
  };
}