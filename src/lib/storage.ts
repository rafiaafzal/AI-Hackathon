import { supabaseAdmin } from '@/lib/supabase';
import { ArticleWithEmbedding } from '@/lib/embeddings';

export interface SaveResult {
  savedCount: number;
  errors: string[];
}

export async function saveArticles(
  articles: ArticleWithEmbedding[]
): Promise<SaveResult> {
  if (articles.length === 0) {
    return { savedCount: 0, errors: [] };
  }

  const errors: string[] = [];
  let savedCount = 0;
  const BATCH_SIZE = 50;

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    const rows = batch.map((a) => ({
      url: a.url,
      title: a.title,
      source: a.source,
      published_at: a.published_at,
      text: a.snippet, // Store snippet for now, headline + short summary + original link only
      summary: a.summary,
      topics: a.topics,
      embedding: a.embedding,
    }));

    const { data, error } = await supabaseAdmin
      .from('articles')
      .upsert(rows, { onConflict: 'url' })
      .select('id');

    if (error) {
      errors.push(`Error saving batch ${i / BATCH_SIZE}: ${error.message}`);
    } else {
      savedCount += data?.length ?? rows.length;
    }
  }

  return { savedCount, errors };
}
