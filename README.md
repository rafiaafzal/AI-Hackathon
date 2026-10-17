# Chai & News ☕📰

**Your morning paper, brewed fresh.**

A personal daily newspaper. Chai & News learns what each reader cares about, gathers matching stories from across the web every day, and delivers one personal paper: readable on the web, downloadable as a newspaper-style PDF, and smarter every time you use it.

## The problem

News is scattered across dozens of sites, apps and newsletters. People jump from link to link and still cannot name three things they learned. Social media solved "one feed" for friends. News has nothing like it.

## What it does

- **Onboarding in under a minute**: pick topics, optionally describe yourself in English, Urdu or Roman Urdu. Gemini turns that into a structured reader profile.
- **A real editor, not just a feed**: every morning an AI editor chooses the lead story, builds sections, and explains each pick with a "Because you..." line.
- **Web newspaper**: newspaper layout with lead story, sections, "In brief", and original links.
- **Three things you learned today**: daily takeaways so the reader leaves with something concrete.
- **Rabbit hole of the day**: one story outside your usual topics, to discover something new.
- **PDF edition**: a fresh, newspaper-inspired A4 PDF with masthead, columns and QR codes to the original articles.
- **Archive**: every past edition is saved and re-readable.
- **Learning loop**: likes, skips, clicks and read time update the reader's interest vector and topic weights, so tomorrow's paper is better than today's. Skipped stories never come back.
- **Transparency**: a profile page shows what the product has learned about you.

## How it works

```
RSS feeds -> Fetcher -> Gemini enrichment + embeddings -> Supabase (pgvector)
Onboarding -> Gemini profile -> user interest vector
Interest vector -> similarity search -> ranker -> Gemini editor -> Edition JSON
Edition JSON -> Web page / Archive / PDF
Reader signals -> update interest vector + topic weights -> next edition
```

Ranking score: `0.4 * similarity + 0.4 * topic weight (with learned boosts) + 0.2 * recency`, with source diversity limits, then an LLM editor pass for layout and explanations.

Architecture diagram: see `docs/architecture.png`.

## Tech stack

| Layer | Choice |
|---|---|
| App | Next.js 16 (App Router), TypeScript, Tailwind CSS 4, shadcn/ui |
| Database | Supabase Postgres + pgvector |
| AI | Google Gemini (summaries, profile extraction, editor, embeddings) |
| Sources | 21 public RSS feeds |
| PDF | HTML/CSS newspaper layout rendered with Puppeteer |
| Hosting | Vercel (with Cron) |

## Copyright note

We store and show only the headline, a short AI-written summary and a link to the original article. Full articles are never copied.

## Run locally

```bash
pnpm install
cp .env.example .env.local   # fill in your keys
pnpm dev
```

Environment variables (see `.env.example`):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_EMBED_MODEL`, `CRON_SECRET`.

Database: run `supabase/schema.sql`, then `supabase/migrations/001_match_articles.sql` in the Supabase SQL editor.

Fetch articles: `GET /api/cron/fetch` with `Authorization: Bearer <CRON_SECRET>`.
Generate editions: `GET /api/cron/editions` (same auth) or press "Refresh my paper".

## Project structure

```
src/app/            pages and API routes (onboarding, paper, archive, profile, cron, signals)
src/lib/            ai, feeds, fetcher, enrich, profile, edition engine, pdf
src/components/     Masthead, newspaper components, shadcn ui
src/prompts/        Gemini prompts (enrich, profile, editor)
supabase/           schema and migrations
```

## Built at NaSCon'26

Built in one day for the "Personal Morning Paper" problem statement, using AI-assisted development.