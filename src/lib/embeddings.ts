import { embed } from '@/lib/ai';
import { withRetry, sleep } from '@/lib/retry';
import { EnrichedArticle } from '@/lib/enrich';

export interface ArticleWithEmbedding extends EnrichedArticle {
  embedding: string; // pgvector string format: "[0.123,0.456,...]"
}

export async function generateEmbeddings(
  articles: EnrichedArticle[]
): Promise<ArticleWithEmbedding[]> {
  if (articles.length === 0) return [];

  const results: ArticleWithEmbedding[] = [];
  const BATCH_SIZE = 50;

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    const texts = batch.map((a) => `${a.title}. ${a.summary}`);

    try {
      const vectors = await withRetry(() => embed(texts));

      for (let j = 0; j < batch.length; j++) {
        const vector = vectors[j] ?? [];
        results.push({
          ...batch[j],
          embedding: `[${vector.join(',')}]`,
        });
      }
    } catch (err: unknown) {
      console.error(
        `[embeddings] Error generating embeddings for batch starting at ${i}:`,
        err
      );
      // Fallback 1536-dim zero vector if API fails so the article can still be stored
      for (const article of batch) {
        results.push({
          ...article,
          embedding: `[${new Array(1536).fill(0).join(',')}]`,
        });
      }
    }

    if (i + BATCH_SIZE < articles.length) {
      await sleep(500);
    }
  }

  return results;
}
