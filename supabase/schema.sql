-- Enable pgvector extension
create extension if not exists vector;

-- Users table
create table users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique,
  profile_json jsonb default '{}'::jsonb,
  interest_vector vector(1536),
  created_at timestamptz default now()
);

-- Articles table
create table articles (
  id uuid primary key default gen_random_uuid(),
  url text unique not null,
  title text not null,
  source text,
  published_at timestamptz,
  text text,
  summary text,
  topics text[] default '{}',
  embedding vector(1536),
  fetched_at timestamptz default now()
);

-- Editions table
create table editions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  edition_date date not null,
  layout_json jsonb,
  pdf_url text,
  created_at timestamptz default now(),
  unique (user_id, edition_date)
);

-- Edition items table
create table edition_items (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid references editions(id) on delete cascade,
  article_id uuid references articles(id) on delete cascade,
  section text,
  position int,
  reason text
);

-- Signals table
-- (type is one of: click, skip, like, dislike, read_time, pdf)
create table signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  article_id uuid references articles(id) on delete cascade,
  type text not null,
  value float default 1,
  created_at timestamptz default now()
);
