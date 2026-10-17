import { NextResponse } from 'next/server';
import { generateText, embed } from '@/lib/ai';

export async function GET() {
  try {
    const text = await generateText('You are a helpful assistant.', 'Say hello in one word.');
    const embeddings = await embed(['test sentence']);
    const embeddingLength = embeddings[0]?.length ?? 0;

    return NextResponse.json({
      ok: true,
      text,
      embeddingLength,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
