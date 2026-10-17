import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { TOPICS } from '@/lib/feeds';
import { generateJSON } from '@/lib/ai';
import { withRetry, sleep } from '@/lib/retry';
import { NormalizedArticle } from '@/lib/fetcher';

export interface EnrichedArticle extends NormalizedArticle {
  summary: string;
  topics: string[];
}

const EnrichedItemSchema = z.object({
  index: z.number(),
  topics: z.array(z.string()).transform((rawTopics) => {
    const valid = rawTopics
      .map((t) => t.trim().toLowerCase())
      .filter((t): t is (typeof TOPICS)[number] =>
        (TOPICS as readonly string[]).includes(t)
      );
    return valid.length > 0 ? valid.slice(0, 3) : ['world'];
  }),
  summary: z.string().min(1),
});

const EnrichedBatchSchema = z.array(EnrichedItemSchema);

function getEnrichSystemPrompt(): string {
  try {
    const filePath = path.join(process.cwd(), 'src/prompts/enrich.md');
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return `You are an expert news editor for "Chai & News". For each article assign 1 to 3 topics strictly from: ${TOPICS.join(
      ', '
    )}, and write a concise summary of at most 2 sentences in your own words. Return a JSON array of { index, topics, summary }.`;
  }
}

export async function enrichArticles(
  articles: NormalizedArticle[]
): Promise<EnrichedArticle[]> {
  if (articles.length === 0) return [];

  const systemPrompt = getEnrichSystemPrompt();
  const enrichedArticles: EnrichedArticle[] = [];
  const BATCH_SIZE = 20;

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    const inputPayload = batch.map((article, idx) => ({
      index: idx,
      title: article.title,
      snippet: article.snippet,
      source: article.source,
    }));

    const userPrompt = `Enrich the following ${
      batch.length
    } articles:\n${JSON.stringify(inputPayload, null, 2)}`;

    let parsedBatch: z.infer<typeof EnrichedBatchSchema> | null = null;

    // First attempt with withRetry
    try {
      const rawResult = await withRetry(() =>
        generateJSON<unknown>(systemPrompt, userPrompt)
      );
      const parsed = EnrichedBatchSchema.safeParse(rawResult);
      if (parsed.success) {
        parsedBatch = parsed.data;
      }
    } catch (err: unknown) {
      console.warn(`[enrich] First attempt error for batch starting at ${i}:`, err);
    }

    // If first attempt failed to parse or errored, retry ONCE
    if (!parsedBatch) {
      try {
        console.warn(`[enrich] Retrying batch parse starting at index ${i}...`);
        const rawResult = await withRetry(() =>
          generateJSON<unknown>(systemPrompt, userPrompt)
        );
        const parsed = EnrichedBatchSchema.safeParse(rawResult);
        if (parsed.success) {
          parsedBatch = parsed.data;
        }
      } catch (retryErr: unknown) {
        console.error(`[enrich] Retry failed for batch at ${i}:`, retryErr);
      }
    }

    // Create lookup map if parsed successfully
    const resultsByIndex = new Map<number, { topics: string[]; summary: string }>();
    if (parsedBatch) {
      for (const item of parsedBatch) {
        resultsByIndex.set(item.index, {
          topics: item.topics,
          summary: item.summary,
        });
      }
    }

    // Map each article with result or fallback
    for (let idx = 0; idx < batch.length; idx++) {
      const article = batch[idx];
      const match = resultsByIndex.get(idx);

      if (match) {
        enrichedArticles.push({
          ...article,
          topics: match.topics,
          summary: match.summary,
        });
      } else {
        // Fallback to hintTopics and snippet cut to 200 chars
        const fallbackTopics =
          article.hintTopics.length > 0 ? article.hintTopics : ['world'];
        const fallbackSummary =
          article.snippet.length > 0
            ? article.snippet.slice(0, 200)
            : article.title;

        enrichedArticles.push({
          ...article,
          topics: fallbackTopics,
          summary: fallbackSummary,
        });
      }
    }

    // Pause 1 second between batches
    if (i + BATCH_SIZE < articles.length) {
      await sleep(1000);
    }
  }

  return enrichedArticles;
}
