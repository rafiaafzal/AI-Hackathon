import fs from "fs";
import path from "path";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { generateJSON } from "@/lib/ai";
import { withRetry } from "@/lib/retry";
import { UserProfile } from "@/lib/profile";
import { Edition, EditionItem, EditionSection } from "@/lib/edition/types";
import { toOneSentence } from "@/lib/utils";

interface DBUserRow {
  id: string;
  name: string | null;
  profile_json: UserProfile | null;
  interest_vector: string | number[] | null;
}

interface DBArticleRow {
  id: string;
  url: string;
  title: string;
  source: string | null;
  published_at: string | null;
  summary: string | null;
  topics: string[] | null;
  similarity?: number;
}

interface CandidateArticle extends DBArticleRow {
  score?: number;
  isDiscovery?: boolean;
}

interface SignalJoinedArticle {
  article_id: string;
  type: string;
  created_at?: string;
  articles: { topics: string[] | null } | { topics: string[] | null }[] | null;
}

interface SignalWithTopics {
  type: string;
  topics: string[];
  createdAt?: string;
}

function countEditionTopics(edition: Partial<Edition> | null): Record<string, number> {
  if (!edition) return {};
  const counts: Record<string, number> = {};
  const addTopics = (topics?: string[] | null) => {
    if (!topics) return;
    for (const t of topics) {
      const key = t.toLowerCase().trim();
      if (key) {
        counts[key] = (counts[key] || 0) + 1;
      }
    }
  };

  if (edition.lead?.topics) addTopics(edition.lead.topics);
  for (const sec of edition.sections || []) {
    for (const item of sec.items || []) {
      addTopics(item.topics);
    }
  }
  for (const item of edition.inBrief || []) {
    addTopics(item.topics);
  }
  if (edition.discovery?.topics) addTopics(edition.discovery.topics);

  return counts;
}

function formatTopicName(topic: string): string {
  const t = topic.toLowerCase().trim();
  if (t === "ai") return "AI";
  return t;
}

function computeChangesSinceYesterday(
  current: {
    lead: EditionItem | null;
    sections: EditionSection[];
    inBrief: EditionItem[];
    discovery?: EditionItem;
  },
  previous: Edition | null,
  recentSignals: SignalWithTopics[]
): string[] {
  const changes: string[] = [];
  const currCounts = countEditionTopics({
    lead: current.lead as EditionItem & { blurb: string },
    sections: current.sections,
    inBrief: current.inBrief,
    discovery: current.discovery as (EditionItem & { whyNew: string }) | undefined,
  });
  const prevCounts = countEditionTopics(previous);

  // Group signals by topic and action
  const skipsByTopic: Record<string, number> = {};
  const likesByTopic: Record<string, number> = {};
  const dislikesByTopic: Record<string, number> = {};

  for (const sig of recentSignals) {
    for (const t of sig.topics) {
      const key = t.toLowerCase().trim();
      if (!key) continue;
      if (sig.type === "skip") skipsByTopic[key] = (skipsByTopic[key] || 0) + 1;
      if (sig.type === "like") likesByTopic[key] = (likesByTopic[key] || 0) + 1;
      if (sig.type === "dislike") dislikesByTopic[key] = (dislikesByTopic[key] || 0) + 1;
    }
  }

  // 1. Skips
  for (const [topic, skipCount] of Object.entries(skipsByTopic)) {
    if (changes.length >= 4) break;
    const topicLabel = formatTopicName(topic);
    const currCount = currCounts[topic] || 0;
    const prevCount = prevCounts[topic] || 0;

    if (currCount === 0) {
      changes.push(
        `You skipped ${skipCount} ${topicLabel} ${skipCount === 1 ? "story" : "stories"}, so ${topicLabel} was excluded today.`
      );
    } else if (prevCount > 0 && currCount < prevCount) {
      changes.push(
        `You skipped ${skipCount} ${topicLabel} ${skipCount === 1 ? "story" : "stories"}, so ${topicLabel} is down to ${currCount} ${currCount === 1 ? "story" : "stories"} today.`
      );
    } else {
      changes.push(
        `You skipped ${skipCount} ${topicLabel} ${skipCount === 1 ? "story" : "stories"}, so ${topicLabel} is down to ${currCount} ${currCount === 1 ? "story" : "stories"} today.`
      );
    }
  }

  // 2. Dislikes
  for (const [topic, dislikeCount] of Object.entries(dislikesByTopic)) {
    if (changes.length >= 4) break;
    if (skipsByTopic[topic]) continue;
    const topicLabel = formatTopicName(topic);
    changes.push(
      `You disliked ${dislikeCount} ${topicLabel} ${dislikeCount === 1 ? "story" : "stories"}, removing them from today's paper.`
    );
  }

  // 3. Likes
  for (const [topic, likeCount] of Object.entries(likesByTopic)) {
    if (changes.length >= 4) break;
    const topicLabel = formatTopicName(topic);
    const currCount = currCounts[topic] || 0;
    const prevCount = prevCounts[topic] || 0;
    const diff = currCount - prevCount;

    if (diff > 0) {
      changes.push(
        `You liked ${topicLabel} stories, so ${topicLabel} got ${diff} extra ${diff === 1 ? "story" : "stories"}.`
      );
    } else {
      changes.push(
        `You liked ${likeCount} ${topicLabel} ${likeCount === 1 ? "story" : "stories"}, prioritizing it today.`
      );
    }
  }

  // 4. Discovery story
  if (current.discovery && changes.length < 4) {
    changes.push("New today: a story from outside your usual topics.");
  }

  // 5. Topic shifts if previous edition exists and room left
  if (previous && changes.length < 4) {
    for (const [topic, currCount] of Object.entries(currCounts)) {
      if (changes.length >= 4) break;
      const prevCount = prevCounts[topic] || 0;
      if (prevCount === 0 && currCount > 0 && !likesByTopic[topic]) {
        const topicLabel = formatTopicName(topic);
        changes.push(
          `Added ${currCount} ${topicLabel} ${currCount === 1 ? "story" : "stories"} based on your reading trends.`
        );
      }
    }
  }

  return changes.slice(0, 4);
}

const EditorOutputSchema = z.object({
  theme: z.string().min(1),
  lead: z.object({
    id: z.string().min(1),
    blurb: z.string().min(1),
    reason: z.string().min(1),
  }),
  sections: z.array(
    z.object({
      label: z.string().min(1),
      items: z.array(
        z.object({
          id: z.string().min(1),
          reason: z.string().min(1),
        })
      ).min(1),
    })
  ).min(1),
  inBrief: z.array(z.string().min(1)),
  takeaways: z.array(z.string().min(1)),
  discovery: z
    .object({
      id: z.string().min(1),
      whyNew: z.string().min(1),
    })
    .optional(),
});

type EditorOutput = z.infer<typeof EditorOutputSchema>;

function getEditorSystemPrompt(): string {
  try {
    const filePath = path.join(process.cwd(), "src/prompts/editor.md");
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return (
      'You are the Chief Editor of "Chai & News". Curate candidate articles into a cohesive morning edition.'
    );
  }
}

function formatReason(rawReason?: string, isRomanUrdu = false, defaultTopic = "your reading list"): string {
  if (isRomanUrdu) {
    if (!rawReason) return `Because aap ${defaultTopic} mein dilchaspi rakhte hain.`;
    return rawReason.startsWith("Because ") ? rawReason : `Because aap ${rawReason}`;
  }
  if (!rawReason) return `Because you follow ${defaultTopic}.`;
  if (rawReason.startsWith("Because you")) return rawReason;
  if (rawReason.startsWith("Because")) return rawReason;
  return `Because you ${rawReason.charAt(0).toLowerCase() + rawReason.slice(1)}`;
}

function getAverageTopicDepth(profile: UserProfile | null): number {
  if (!profile) return 0.5;
  const rawDepth = profile.topic_depth;
  if (typeof rawDepth === "number" && !isNaN(rawDepth)) {
    return Math.max(0, Math.min(1, rawDepth));
  }
  if (rawDepth && typeof rawDepth === "object") {
    const values = Object.values(rawDepth).filter((v) => typeof v === "number" && !isNaN(v));
    if (values.length > 0) {
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
      return Math.max(0, Math.min(1, avg));
    }
  }
  const fallbackDepth = (profile as unknown as { depth?: unknown }).depth;
  if (typeof fallbackDepth === "number" && !isNaN(fallbackDepth)) {
    return Math.max(0, Math.min(1, fallbackDepth));
  }
  return 0.5;
}

function toEditionItem(
  article: CandidateArticle,
  reason: string,
  isRomanUrdu: boolean,
  isBrief = false
): EditionItem {
  const summaryText = isBrief ? toOneSentence(article.summary) : article.summary;
  const words = summaryText ? summaryText.trim().split(/\s+/).length : 50;
  return {
    articleId: article.id,
    url: article.url,
    title: article.title,
    source: article.source,
    publishedAt: article.published_at,
    summary: summaryText,
    topics: Array.isArray(article.topics) ? article.topics : [],
    reason: formatReason(reason, isRomanUrdu, article.topics?.[0] || "your selected topics"),
    readMinutes: Math.max(1, Math.round(words / 45)),
  };
}

export async function generateEdition(userId: string): Promise<Edition> {
  // 1. Load user (name, profile_json, interest_vector)
  const { data: userRow, error: userError } = await supabaseAdmin
    .from("users")
    .select("id, name, profile_json, interest_vector")
    .eq("id", userId)
    .single();

  if (userError || !userRow) {
    throw new Error(`[generateEdition] User not found: ${userId} (${userError?.message || "unknown"})`);
  }

  const user = userRow as DBUserRow;
  const profile = user.profile_json as UserProfile | null;
  const isRomanUrdu = profile?.language === "roman_urdu";
  const avgDepth = getAverageTopicDepth(profile);
  let layoutStyle: "brief" | "balanced" | "deep" = "balanced";
  if (avgDepth < 0.35) {
    layoutStyle = "brief";
  } else if (avgDepth > 0.65) {
    layoutStyle = "deep";
  }
  const isBrief = layoutStyle === "brief";

  // Call match_articles RPC (query_embedding: interest_vector, match_count: 60, since_hours: 96)
  let rawArticles: DBArticleRow[] = [];
  if (user.interest_vector) {
    const { data: matched, error: rpcError } = await supabaseAdmin.rpc("match_articles", {
      query_embedding: user.interest_vector,
      match_count: 60,
      since_hours: 96,
    });

    if (!rpcError && Array.isArray(matched) && matched.length > 0) {
      rawArticles = matched as DBArticleRow[];
    } else if (rpcError) {
      console.warn("[generateEdition] match_articles RPC error:", rpcError.message);
    }
  }

  // Fallback if match_articles returned no items or user has no vector
  if (rawArticles.length === 0) {
    const { data: fallbackArticles } = await supabaseAdmin
      .from("articles")
      .select("id, url, title, source, published_at, summary, topics")
      .order("published_at", { ascending: false })
      .limit(60);

    rawArticles = (fallbackArticles || []).map((a) => ({
      ...a,
      similarity: 0.5,
    })) as DBArticleRow[];
  }

  // 2. Load feedback from `signals` joined with articles(topics)
  const excludedArticleIds = new Set<string>();
  const topicBoost: Record<string, number> = {};
  const userSignalsWithTopics: SignalWithTopics[] = [];

  try {
    const { data: signalsData, error: signalsError } = await supabaseAdmin
      .from("signals")
      .select("article_id, type, created_at, articles(topics)")
      .eq("user_id", userId);

    if (signalsError) {
      console.warn("[generateEdition] Joined signals query failed, falling back:", signalsError.message);
      const { data: rawSignals } = await supabaseAdmin
        .from("signals")
        .select("article_id, type, created_at")
        .eq("user_id", userId);

      if (rawSignals && rawSignals.length > 0) {
        const artIds = rawSignals.map((s) => s.article_id as string);
        const { data: arts } = await supabaseAdmin
          .from("articles")
          .select("id, topics")
          .in("id", artIds);

        const topicsMap = new Map<string, string[]>();
        if (arts) {
          for (const a of arts) {
            topicsMap.set(a.id as string, (a.topics as string[]) || []);
          }
        }

        for (const sig of rawSignals) {
          const sType = sig.type as string;
          const artId = sig.article_id as string;
          const topics = topicsMap.get(artId) || [];
          userSignalsWithTopics.push({
            type: sType,
            topics,
            createdAt: sig.created_at as string | undefined,
          });

          if (sType === "skip" || sType === "dislike") {
            excludedArticleIds.add(artId);
          }
          let delta = 0;
          if (sType === "like") delta = 0.08;
          else if (sType === "click") delta = 0.03;
          else if (sType === "dislike") delta = -0.10;
          else if (sType === "skip") delta = -0.06;

          for (const t of topics) {
            topicBoost[t] = (topicBoost[t] || 0) + delta;
          }
        }
      }
    } else if (signalsData) {
      for (const rawRow of signalsData) {
        const row = rawRow as unknown as SignalJoinedArticle;
        let topics: string[] = [];
        if (row.articles) {
          if (Array.isArray(row.articles)) {
            topics = (row.articles[0]?.topics as string[]) || [];
          } else if (Array.isArray(row.articles.topics)) {
            topics = row.articles.topics;
          }
        }

        userSignalsWithTopics.push({
          type: row.type,
          topics,
          createdAt: row.created_at,
        });

        if (row.type === "skip" || row.type === "dislike") {
          excludedArticleIds.add(row.article_id);
        }
        let delta = 0;
        if (row.type === "like") delta = 0.08;
        else if (row.type === "click") delta = 0.03;
        else if (row.type === "dislike") delta = -0.10;
        else if (row.type === "skip") delta = -0.06;

        for (const t of topics) {
          topicBoost[t] = (topicBoost[t] || 0) + delta;
        }
      }
    }
  } catch (err: unknown) {
    console.warn("[generateEdition] Error loading user signals:", err);
  }

  // 3. Filter excluded articles and compute score = 0.4*similarity + 0.4*topicWeight + 0.2*recency
  const scoredArticles: (CandidateArticle & { score: number })[] = [];

  for (const article of rawArticles) {
    if (excludedArticleIds.has(article.id)) {
      continue;
    }

    const similarity = typeof article.similarity === "number" ? article.similarity : 0.5;
    const topics = Array.isArray(article.topics) ? article.topics : [];

    let topicWeight = 0;
    if (topics.length > 0) {
      let maxW = -Infinity;
      for (const t of topics) {
        const profileWeight = profile?.topic_weights?.[t] ?? 0;
        const boost = topicBoost[t] ?? 0;
        const combined = profileWeight + boost;
        if (combined > maxW) {
          maxW = combined;
        }
      }
      topicWeight = maxW === -Infinity ? 0 : maxW;
    }

    const pubTime = article.published_at ? new Date(article.published_at).getTime() : Date.now();
    const hoursOld = Math.max(0, (Date.now() - pubTime) / (1000 * 60 * 60));
    const recency = Math.max(0, 1 - hoursOld / 72);

    const score = 0.4 * similarity + 0.4 * topicWeight + 0.2 * recency;

    scoredArticles.push({
      ...article,
      score,
    });
  }

  // 4. Diversity: max 3 articles per source; keep top 28
  scoredArticles.sort((a, b) => b.score - a.score);

  const sourceCounts = new Map<string, number>();
  const top28: (CandidateArticle & { score: number })[] = [];

  for (const a of scoredArticles) {
    const src = (a.source || "Unknown").trim();
    const count = sourceCounts.get(src) || 0;
    if (count < 3 && top28.length < 28) {
      sourceCounts.set(src, count + 1);
      top28.push(a);
    }
  }

  // 5. Discovery candidate: best-ranked article whose topics do not overlap reader's selected topics
  const readerSelectedTopics = new Set(
    (profile?.selectedTopics || Object.keys(profile?.topic_weights || {})).map((t) =>
      t.toLowerCase().trim()
    )
  );

  const discoveryCandidate = scoredArticles.find((a) => {
    const topics = a.topics || [];
    if (topics.length === 0) return false;
    return topics.every((t) => !readerSelectedTopics.has(t.toLowerCase().trim()));
  });

  const candidatesPool: CandidateArticle[] = [...top28];
  if (discoveryCandidate) {
    const idx = candidatesPool.findIndex((a) => a.id === discoveryCandidate.id);
    if (idx >= 0) {
      candidatesPool[idx] = { ...candidatesPool[idx], isDiscovery: true };
    } else {
      candidatesPool.push({
        ...discoveryCandidate,
        isDiscovery: true,
      });
    }
  }

  // 6. Gemini editor pass using generateJSON + withRetry
  let editorOutput: EditorOutput | null = null;
  if (candidatesPool.length > 0) {
    try {
      const systemPrompt = getEditorSystemPrompt();
      let depthHint =
        "Standard balanced edition: 2 to 4 stories per section, 4 to 6 inBrief stories, 2-3 sentence lead blurb.";
      if (layoutStyle === "brief") {
        depthHint =
          "HEADLINE READER (depth < 0.35): Include up to 5 stories per section and up to 10 stories in inBrief. Keep all summaries to exactly 1 crisp sentence.";
      } else if (layoutStyle === "deep") {
        depthHint =
          "DEEP READ READER (depth > 0.65): Focus on depth with exactly 2 stories per section. Write a comprehensive 4-sentence lead blurb analyzing the story's implications.";
      }

      const editorInput = {
        reader: {
          name: user.name || "Reader",
          summary: profile?.summary || "",
          interests: profile?.interests || [],
          avoid: profile?.avoid || [],
          expertise: profile?.expertise || "intermediate",
          language: profile?.language || "english",
          depthHint,
        },
        candidates: candidatesPool.map((c) => ({
          id: c.id,
          title: c.title,
          source: c.source,
          summary: c.summary,
          topics: c.topics || [],
          discovery: Boolean(c.isDiscovery),
        })),
      };

      const rawAiResponse = await withRetry(() =>
        generateJSON<unknown>(
          systemPrompt,
          `Reader details and candidate articles:\n${JSON.stringify(editorInput, null, 2)}`
        )
      );

      const parsed = EditorOutputSchema.safeParse(rawAiResponse);
      if (parsed.success) {
        editorOutput = parsed.data;
      } else {
        console.warn("[generateEdition] AI editor output validation failed:", parsed.error.format());
      }
    } catch (err: unknown) {
      console.error("[generateEdition] Gemini editor pass error, using fallback layout:", err);
    }
  }

  // 7. Map ids back to articles; drop invalid or duplicate ids. Fallback to deterministic ranking if needed.
  const candidateMap = new Map(candidatesPool.map((c) => [c.id, c]));
  const usedIds = new Set<string>();

  let theme = isRomanUrdu ? "Aaj Ki Khas Khabrein" : "Today's Essential Briefing";
  let lead: (EditionItem & { blurb: string }) | null = null;
  const sections: EditionSection[] = [];
  const inBrief: EditionItem[] = [];
  let takeaways: string[] = [];
  let discovery: (EditionItem & { whyNew: string }) | undefined = undefined;

  if (editorOutput) {
    theme = editorOutput.theme;

    // Map lead
    if (candidateMap.has(editorOutput.lead.id)) {
      const art = candidateMap.get(editorOutput.lead.id)!;
      usedIds.add(art.id);
      lead = {
        ...toEditionItem(art, editorOutput.lead.reason, isRomanUrdu, isBrief),
        blurb: editorOutput.lead.blurb,
      };
    }

    // Map sections
    for (let sIdx = 0; sIdx < editorOutput.sections.length; sIdx++) {
      const sec = editorOutput.sections[sIdx];
      const validItems: EditionItem[] = [];
      for (const item of sec.items) {
        if (candidateMap.has(item.id) && !usedIds.has(item.id)) {
          usedIds.add(item.id);
          const art = candidateMap.get(item.id)!;
          validItems.push(toEditionItem(art, item.reason, isRomanUrdu, isBrief));
        }
      }
      const maxSectionItems = layoutStyle === "deep" ? 2 : (layoutStyle === "brief" ? 5 : 4);
      const trimmedItems = validItems.slice(0, maxSectionItems);
      if (trimmedItems.length > 0) {
        sections.push({
          key: `section_${sIdx + 1}`,
          label: sec.label,
          items: trimmedItems,
        });
      }
    }

    // Map inBrief
    const maxInBrief = layoutStyle === "deep" ? 3 : (layoutStyle === "brief" ? 10 : 6);
    for (const id of editorOutput.inBrief.slice(0, maxInBrief)) {
      if (candidateMap.has(id) && !usedIds.has(id)) {
        usedIds.add(id);
        const art = candidateMap.get(id)!;
        inBrief.push(
          toEditionItem(
            art,
            isRomanUrdu ? "Because aap tez khulaasa chahte hain." : "Because you wanted a quick morning brief.",
            isRomanUrdu,
            isBrief
          )
        );
      }
    }

    // Map takeaways (exactly 3 facts)
    takeaways = editorOutput.takeaways.filter((t) => typeof t === "string" && t.trim().length > 0).slice(0, 3);

    // Map discovery
    if (editorOutput.discovery && candidateMap.has(editorOutput.discovery.id) && !usedIds.has(editorOutput.discovery.id)) {
      const art = candidateMap.get(editorOutput.discovery.id)!;
      usedIds.add(art.id);
      discovery = {
        ...toEditionItem(
          art,
          isRomanUrdu ? "Because yeh nayi disha aapke daira-e-ilm ko barhati hai." : "Because expanding your horizons reveals fresh perspectives.",
          isRomanUrdu,
          isBrief
        ),
        whyNew: editorOutput.discovery.whyNew,
      };
    }
  }

  // Fallback to deterministic edition if lead is missing or sections empty
  if (!lead && candidatesPool.length > 0) {
    const topStory = candidatesPool[0];
    usedIds.add(topStory.id);
    lead = {
      ...toEditionItem(
        topStory,
        isRomanUrdu ? "Because yeh aaj ki sab se ahem khabar hai." : "Because this is today's top recommended story.",
        isRomanUrdu,
        isBrief
      ),
      blurb: topStory.summary || topStory.title,
    };
  }

  if (sections.length === 0) {
    const fallbackItems: EditionItem[] = [];
    const maxFallback = layoutStyle === "deep" ? 2 : (layoutStyle === "brief" ? 15 : 8);
    for (const art of candidatesPool) {
      if (!usedIds.has(art.id) && fallbackItems.length < maxFallback) {
        usedIds.add(art.id);
        fallbackItems.push(
          toEditionItem(
            art,
            isRomanUrdu ? "Because yeh aapke intikhab kardah mauzoat se mutabiqat rakhti hai." : "Because this directly matches your reading profile.",
            isRomanUrdu,
            isBrief
          )
        );
      }
    }
    if (fallbackItems.length > 0) {
      if (layoutStyle === "brief" && fallbackItems.length > 5) {
        for (let i = 0; i < fallbackItems.length; i += 5) {
          sections.push({
            key: `top_for_you_${Math.floor(i / 5) + 1}`,
            label: isRomanUrdu ? `Aap Ke Liye Khas ${Math.floor(i / 5) + 1}` : `Top Stories ${Math.floor(i / 5) + 1}`,
            items: fallbackItems.slice(i, i + 5),
          });
        }
      } else {
        sections.push({
          key: "top_for_you",
          label: isRomanUrdu ? "Aap Ke Liye Khas" : "Top for you",
          items: fallbackItems,
        });
      }
    }
  }

  if (inBrief.length === 0) {
    const maxInBriefFallback = layoutStyle === "deep" ? 3 : (layoutStyle === "brief" ? 10 : 6);
    for (const art of candidatesPool) {
      if (!usedIds.has(art.id) && inBrief.length < maxInBriefFallback) {
        usedIds.add(art.id);
        inBrief.push(
          toEditionItem(
            art,
            isRomanUrdu ? "Because mukhtasar waqt mein ahem khabrein." : "Because you need a rapid headline scan.",
            isRomanUrdu,
            isBrief
          )
        );
      }
    }
  }

  if (takeaways.length < 3) {
    const extraTakeaways = candidatesPool
      .filter((a) => a.summary)
      .map((a) => a.summary!)
      .slice(0, 3);
    for (const extra of extraTakeaways) {
      if (takeaways.length < 3) {
        takeaways.push(extra);
      }
    }
    while (takeaways.length < 3) {
      takeaways.push("Stay curious and informed with today's Chai & News dispatch.");
    }
  }

  if (!discovery && discoveryCandidate && !usedIds.has(discoveryCandidate.id)) {
    discovery = {
      ...toEditionItem(
        discoveryCandidate,
        isRomanUrdu ? "Because naye mauzooat par nazar rakhna faidamand hai." : "Because this explores ideas beyond your usual areas.",
        isRomanUrdu
      ),
      whyNew: isRomanUrdu
        ? "Yeh aam mutabiqat se hat kar ek naya aur dilchasp pehlu pesh karti hai."
        : "A surprising, high-value angle outside your primary interests.",
    };
  }

  // Safe fallback if lead still null (e.g. 0 articles total in system)
  if (!lead) {
    lead = {
      articleId: "placeholder",
      url: "#",
      title: "No articles available yet",
      source: "Chai & News",
      publishedAt: new Date().toISOString(),
      summary: "Run the ingestion feed to fetch the latest stories.",
      topics: [],
      reason: "Because your morning paper is preparing fresh dispatches.",
      readMinutes: 1,
      blurb: "Please populate RSS feeds to generate full news coverage.",
    };
  }

  // 8. Set date (today, YYYY-MM-DD), editionNumber (count of this user's editions + 1), upsert into `editions`
  const todayDate = new Date().toISOString().slice(0, 10);

  // Check existing edition for today to preserve editionNumber upon re-generation
  const { data: existingToday } = await supabaseAdmin
    .from("editions")
    .select("id, layout_json, created_at")
    .eq("user_id", userId)
    .eq("edition_date", todayDate)
    .maybeSingle();

  let editionNumber = 1;
  const existingLayout = existingToday?.layout_json as { editionNumber?: number } | null;
  if (existingLayout && typeof existingLayout.editionNumber === "number") {
    editionNumber = existingLayout.editionNumber;
  } else {
    const { count } = await supabaseAdmin
      .from("editions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    editionNumber = (count ?? 0) + 1;
  }

  // Query previous edition before today (if any) to compute "What changed since yesterday"
  const { data: prevEditionRow } = await supabaseAdmin
    .from("editions")
    .select("id, edition_date, layout_json, created_at")
    .eq("user_id", userId)
    .lt("edition_date", todayDate)
    .order("edition_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const previousEdition =
    (prevEditionRow?.layout_json as Edition | null) ??
    (existingToday?.layout_json as Edition | null);

  const referenceTime =
    prevEditionRow?.created_at || (existingToday as { created_at?: string } | null)?.created_at;

  let filteredSignals = userSignalsWithTopics;
  if (referenceTime) {
    const refMs = new Date(referenceTime).getTime() - 1000;
    const sinceRef = userSignalsWithTopics.filter(
      (s) => s.createdAt && new Date(s.createdAt).getTime() >= refMs
    );
    if (sinceRef.length > 0) {
      filteredSignals = sinceRef;
    }
  }

  const changes = computeChangesSinceYesterday(
    { lead, sections, inBrief, discovery },
    previousEdition,
    filteredSignals
  );

  const finalEdition: Edition = {
    id: existingToday?.id || "",
    date: todayDate,
    editionNumber,
    readerName: user.name || "Reader",
    theme,
    lead,
    sections,
    inBrief,
    takeaways,
    discovery,
    changes: changes.length > 0 ? changes : undefined,
    layoutStyle,
  };

  const { data: savedEdition, error: upsertError } = await supabaseAdmin
    .from("editions")
    .upsert(
      {
        user_id: userId,
        edition_date: todayDate,
        layout_json: finalEdition,
      },
      { onConflict: "user_id,edition_date" }
    )
    .select("id")
    .single();

  if (upsertError || !savedEdition) {
    throw new Error(`[generateEdition] Failed to upsert edition: ${upsertError?.message || "Unknown error"}`);
  }

  finalEdition.id = (savedEdition as { id: string }).id;

  // Update layout_json with actual id
  await supabaseAdmin
    .from("editions")
    .update({ layout_json: finalEdition })
    .eq("id", finalEdition.id);

  // Also maintain edition_items table
  try {
    await supabaseAdmin.from("edition_items").delete().eq("edition_id", finalEdition.id);

    const itemsToInsert: {
      edition_id: string;
      article_id: string;
      section: string;
      position: number;
      reason: string;
    }[] = [];

    if (finalEdition.lead.articleId && finalEdition.lead.articleId !== "placeholder") {
      itemsToInsert.push({
        edition_id: finalEdition.id,
        article_id: finalEdition.lead.articleId,
        section: "lead",
        position: 0,
        reason: finalEdition.lead.reason,
      });
    }

    let pos = 0;
    for (const sec of finalEdition.sections) {
      for (const item of sec.items) {
        itemsToInsert.push({
          edition_id: finalEdition.id,
          article_id: item.articleId,
          section: sec.label,
          position: pos++,
          reason: item.reason,
        });
      }
    }

    pos = 0;
    for (const item of finalEdition.inBrief) {
      itemsToInsert.push({
        edition_id: finalEdition.id,
        article_id: item.articleId,
        section: "in_brief",
        position: pos++,
        reason: item.reason,
      });
    }

    if (finalEdition.discovery && finalEdition.discovery.articleId) {
      itemsToInsert.push({
        edition_id: finalEdition.id,
        article_id: finalEdition.discovery.articleId,
        section: "discovery",
        position: 0,
        reason: finalEdition.discovery.whyNew,
      });
    }

    if (itemsToInsert.length > 0) {
      await supabaseAdmin.from("edition_items").insert(itemsToInsert);
    }
  } catch (err: unknown) {
    console.warn("[generateEdition] Failed to sync edition_items:", err);
  }

  return finalEdition;
}
