import { NextRequest, NextResponse } from 'next/server';
import { fetchFeeds } from '@/lib/fetcher';
import { enrichArticles } from '@/lib/enrich';
import { generateEmbeddings } from '@/lib/embeddings';
import { saveArticles } from '@/lib/storage';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && cronSecret.trim().length > 0) {
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : null;
    const querySecret = request.nextUrl.searchParams.get('secret');

    if (bearerToken !== cronSecret && querySecret !== cronSecret) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  const errors: string[] = [];

  try {
    // 1. Fetch RSS feeds and deduplicate against existing articles
    const fetchResult = await fetchFeeds();
    errors.push(...fetchResult.errors);

    const newFound = fetchResult.newFound;
    const skippedExisting = fetchResult.skippedExisting;

    if (fetchResult.articles.length === 0) {
      return NextResponse.json({
        ok: true,
        feeds: fetchResult.feeds,
        newFound: 0,
        processed: 0,
        saved: 0,
        skippedExisting,
        errors,
      });
    }

    // 2. Enrich with Gemini (topics + summary)
    const enriched = await enrichArticles(fetchResult.articles);
    const processed = enriched.length;

    // 3. Generate embeddings
    const withEmbeddings = await generateEmbeddings(enriched);

    // 4. Save to Supabase
    const saveResult = await saveArticles(withEmbeddings);
    errors.push(...saveResult.errors);

    return NextResponse.json({
      ok: true,
      feeds: fetchResult.feeds,
      newFound,
      processed,
      saved: saveResult.savedCount,
      skippedExisting,
      errors,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`Cron pipeline fatal error: ${message}`);
    return NextResponse.json(
      {
        ok: false,
        feeds: [],
        newFound: 0,
        processed: 0,
        saved: 0,
        skippedExisting: 0,
        errors,
      },
      { status: 500 }
    );
  }
}
