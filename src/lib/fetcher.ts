import Parser from 'rss-parser';
import { FEEDS, FeedConfig } from '@/lib/feeds';
import { supabaseAdmin } from '@/lib/supabase';

export interface NormalizedArticle {
  url: string;
  title: string;
  source: string;
  published_at: string | null;
  snippet: string;
  hintTopics: string[];
}

export interface FeedResult {
  name: string;
  status: 'ok' | 'failed';
  items: number;
}

export interface FetchResult {
  feeds: FeedResult[];
  articles: NormalizedArticle[];
  newFound: number;
  skippedExisting: number;
  errors: string[];
}

export const MAX_NEW_PER_RUN = 120;
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDate(dateStr?: string): { iso: string | null; timestamp: number | null } {
  if (!dateStr) return { iso: null, timestamp: null };
  const d = new Date(dateStr);
  const time = d.getTime();
  if (isNaN(time)) return { iso: null, timestamp: null };
  return { iso: d.toISOString(), timestamp: time };
}

export async function fetchFeeds(customFeeds: FeedConfig[] = FEEDS): Promise<FetchResult> {
  const parser = new Parser({
    timeout: 10000,
    headers: {
      'User-Agent': 'curl/8.4.0',
      Accept: '*/*',
    },
  });

  const now = Date.now();
  const cutoffTime = now - THREE_DAYS_MS;
  const feedResults: FeedResult[] = [];
  const errors: string[] = [];

  const feedPromises = customFeeds.map(async (feed) => {
    try {
      const parsed = await parser.parseURL(feed.url);
      const rawItems = parsed.items || [];
      const validItems: NormalizedArticle[] = [];

      for (const item of rawItems) {
        const title = typeof item.title === 'string' ? item.title.trim() : '';
        const url = typeof item.link === 'string' ? item.link.trim() : '';

        if (!title || !url) continue;

        const dateInfo = parseDate(item.isoDate || item.pubDate);
        if (dateInfo.timestamp !== null && dateInfo.timestamp < cutoffTime) {
          continue;
        }

        const rawSnippet = item.contentSnippet || item.summary || item.content || '';
        const snippet = stripHtml(rawSnippet).slice(0, 600);

        validItems.push({
          url,
          title,
          source: feed.name,
          published_at: dateInfo.iso,
          snippet,
          hintTopics: feed.topics,
        });
      }

      // Sort newest first within feed (null dates placed at the end)
      validItems.sort((a, b) => {
        const timeA = a.published_at ? new Date(a.published_at).getTime() : 0;
        const timeB = b.published_at ? new Date(b.published_at).getTime() : 0;
        return timeB - timeA;
      });

      const topItems = validItems.slice(0, 15);
      return {
        feedName: feed.name,
        status: 'ok' as const,
        items: topItems,
        totalFetched: rawItems.length,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        feedName: feed.name,
        status: 'failed' as const,
        items: [] as NormalizedArticle[],
        totalFetched: 0,
        error: msg,
      };
    }
  });

  const settled = await Promise.allSettled(feedPromises);

  const seenUrls = new Set<string>();
  const feedGroups = new Map<string, NormalizedArticle[]>();
  for (const feed of customFeeds) {
    feedGroups.set(feed.name, []);
  }

  for (const res of settled) {
    if (res.status === 'fulfilled') {
      const val = res.value;
      feedResults.push({
        name: val.feedName,
        status: val.status,
        items: val.items.length,
      });

      if (val.status === 'failed' && val.error) {
        errors.push(`Feed "${val.feedName}" failed: ${val.error}`);
      }

      for (const item of val.items) {
        if (!seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          feedGroups.get(val.feedName)?.push(item);
        }
      }
    } else {
      errors.push(`Unhandled rejection in feed fetcher: ${String(res.reason)}`);
    }
  }

  // Check Supabase for existing URLs
  const allUrls = Array.from(seenUrls);
  const existingUrls = new Set<string>();

  for (let i = 0; i < allUrls.length; i += 100) {
    const chunk = allUrls.slice(i, i + 100);
    const { data, error } = await supabaseAdmin
      .from('articles')
      .select('url')
      .in('url', chunk);

    if (error) {
      errors.push(`Supabase error checking existing articles: ${error.message}`);
    } else if (data) {
      for (const row of data as { url: string }[]) {
        if (row.url) {
          existingUrls.add(row.url);
        }
      }
    }
  }

  // Filter out existing articles from feed groups
  for (const [feedName, items] of feedGroups.entries()) {
    feedGroups.set(
      feedName,
      items.filter((item) => !existingUrls.has(item.url))
    );
  }

  // Spread evenly across feeds up to MAX_NEW_PER_RUN (120)
  const selected: NormalizedArticle[] = [];
  let addedAny = true;
  let round = 0;

  while (selected.length < MAX_NEW_PER_RUN && addedAny) {
    addedAny = false;
    for (const feed of customFeeds) {
      const items = feedGroups.get(feed.name) || [];
      if (round < items.length) {
        selected.push(items[round]);
        addedAny = true;
        if (selected.length >= MAX_NEW_PER_RUN) break;
      }
    }
    round++;
  }

  // Sort selected articles newest first
  selected.sort((a, b) => {
    const timeA = a.published_at ? new Date(a.published_at).getTime() : 0;
    const timeB = b.published_at ? new Date(b.published_at).getTime() : 0;
    return timeB - timeA;
  });

  return {
    feeds: feedResults,
    articles: selected,
    newFound: selected.length,
    skippedExisting: existingUrls.size,
    errors,
  };
}
