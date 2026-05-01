create table if not exists public.telegram_stats (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.telegram_stats enable row level security;

comment on table public.telegram_stats is
  'Singleton table for aggregated Telegram statistics. Raw exports and message texts must never be stored here.';

comment on column public.telegram_stats.data is
  'Aggregated statistics only: counts, chart points, top emoji, top words and awards.';
