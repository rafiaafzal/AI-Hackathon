# Subah - Personal Morning Newspaper App

## Overview
Subah is a personal morning newspaper application that curates and formats news articles specifically tailored to each user.

## Stack
- **Framework**: Next.js (App Router, Next.js 16, TypeScript)
- **Styling & UI**: Tailwind CSS, shadcn/ui
- **Database & Vectors**: Supabase (Postgres + pgvector)
- **AI**: Gemini API (`@google/genai` for text and embeddings)
- **PDF Generation**: Puppeteer (to be integrated)

## Application Flow
1. **Fetch RSS Articles**: Ingest articles from curated RSS feeds.
2. **Extract Text**: Clean and parse article content using Readability and JSDOM.
3. **Generate Embeddings**: Compute 1536-dimensional embeddings for articles using Gemini embedding model.
4. **Rank per User**: Perform vector similarity ranking based on the user's interest vector.
5. **Gemini "Editor" Selection**: Gemini selects and categorizes stories into a cohesive newspaper layout.
6. **Delivery**: Render the edition as an interactive web page and generate a newspaper-style printable PDF.
7. **Feedback Loop**: User signals (clicks, likes, skips, read time) dynamically refine and update the user's interest profile for future editions.

## Development & Architecture Rules
- **Server Secrets**: Server secrets (e.g. `SUPABASE_SECRET_KEY`, `CRON_SECRET`) must only be accessed in server-side API routes and server actions. Never expose them or import `supabaseAdmin` in client components.
- **AI JSON Validation**: Always validate all AI JSON responses using `zod` schemas before using them in application logic.
- **Prompts Location**: All prompt templates and system instructions must live in `src/prompts/`.
- **Embedding Dimensions**: Embeddings are fixed at 1536 dimensions with L2 normalization.
- **Copyright & Article Content**: Show only headline + short summary + original link. Never store or copy full copyrighted articles in final views.
