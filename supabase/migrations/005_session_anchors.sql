-- Migration 005: Session-Umgebung (B-23) — persistente Anker,
-- unabhängig von Text/Voice-Modus. Siehe docs/backlog.md B-23.
-- Angewendet per Supabase-MCP (apply_migration), hier gespiegelt für Versionierung.

create table if not exists public.session_anchors (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  key         text not null,
  label       text not null,
  kind        text not null check (kind in ('text','number','list','checkbox')),
  value       jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (session_id, key)
);

alter table public.session_anchors enable row level security;

create policy "session_anchors: own data" on public.session_anchors
  for all using (auth.uid() = user_id);

create index if not exists session_anchors_session_id_idx on public.session_anchors(session_id);

-- Realtime-Abo fuers Frontend (persistente Anker live anzeigen)
alter publication supabase_realtime add table public.session_anchors;
