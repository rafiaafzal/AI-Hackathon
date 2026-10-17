// NOTE: This page is for development and debugging purposes only.
import { supabaseAdmin } from '@/lib/supabase';

interface ArticleRow {
  id: string;
  url: string;
  title: string;
  source: string | null;
  summary: string | null;
  topics: string[] | null;
  published_at: string | null;
}

export default async function DebugArticlesPage() {
  // Query total count
  const { count: totalCount, error: countError } = await supabaseAdmin
    .from('articles')
    .select('*', { count: 'exact', head: true });

  // Query latest 50 articles
  const { data: articles, error: articlesError } = await supabaseAdmin
    .from('articles')
    .select('id, url, title, source, summary, topics, published_at')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(50);

  // Query topics for count breakdown
  const { data: allTopicsData } = await supabaseAdmin
    .from('articles')
    .select('topics');

  const topicCounts: Record<string, number> = {};
  if (allTopicsData) {
    for (const row of allTopicsData as { topics: string[] | null }[]) {
      if (Array.isArray(row.topics)) {
        for (const t of row.topics) {
          topicCounts[t] = (topicCounts[t] || 0) + 1;
        }
      }
    }
  }

  const sortedTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen bg-zinc-50 p-6 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:p-12">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="border-b border-zinc-200 pb-5 dark:border-zinc-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold tracking-tight">
                Chai &amp; News &mdash; Articles Debug
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Development view &bull; Displays database status, topic distribution, and latest ingested items.
              </p>
            </div>
            <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Dev Only
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Articles
            </span>
            <p className="mt-2 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
              {countError ? 'Error' : (totalCount ?? 0)}
            </p>
          </div>

          <div className="sm:col-span-2 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Topics Breakdown
            </span>
            <div className="mt-3 flex flex-wrap gap-2">
              {sortedTopics.length === 0 ? (
                <span className="text-sm text-zinc-400 italic">No topics ingested yet</span>
              ) : (
                sortedTopics.map(([topic, cnt]) => (
                  <span
                    key={topic}
                    className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    <span className="capitalize">{topic}</span>
                    <span className="rounded-full bg-zinc-200 px-1.5 py-0.2 text-[10px] font-semibold dark:bg-zinc-700">
                      {cnt}
                    </span>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Articles Table/List */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Latest Articles (up to 50)
            </h2>
          </div>

          {articlesError ? (
            <div className="p-6 text-red-600">
              Error fetching articles: {articlesError.message}
            </div>
          ) : !articles || articles.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">
              No articles found in Supabase. Run the fetch cron to ingest articles.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {(articles as ArticleRow[]).map((article) => (
                <article key={article.id} className="p-6 transition hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {article.source || 'Unknown Source'}
                    </span>
                    <span>&bull;</span>
                    <time dateTime={article.published_at || ''}>
                      {article.published_at
                        ? new Date(article.published_at).toLocaleString()
                        : 'No date'}
                    </time>
                  </div>

                  <h3 className="mt-2 text-base font-semibold leading-snug">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400 hover:underline"
                    >
                      {article.title}
                    </a>
                  </h3>

                  {article.summary && (
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                      {article.summary}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {article.topics?.map((topic) => (
                      <span
                        key={topic}
                        className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
