-- Enable vector extension if not present
create extension if not exists vector;

-- Create HNSW index for fast cosine similarity search
create index if not exists articles_embedding_hnsw_idx
on articles using hnsw (embedding vector_cosine_ops);

-- Similarity search function for articles
create or replace function match_articles (
  query_embedding vector(1536),
  match_count int,
  since_hours int default 96
)
returns table (
  id uuid,
  url text,
  title text,
  source text,
  published_at timestamptz,
  summary text,
  topics text[],
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    articles.id,
    articles.url,
    articles.title,
    articles.source,
    articles.published_at,
    articles.summary,
    articles.topics,
    1 - (articles.embedding <=> query_embedding) as similarity
  from articles
  where
    articles.embedding is not null
    and (
      articles.published_at >= now() - (since_hours || ' hours')::interval
      or articles.fetched_at >= now() - (since_hours || ' hours')::interval
    )
  order by articles.embedding <=> query_embedding
  limit match_count;
end;
$$;
