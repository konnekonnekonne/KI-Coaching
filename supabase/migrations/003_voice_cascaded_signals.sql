-- Migration 003: Cascaded-Voice-Architektur — Signal-Spalten und Phasentracking
-- Teil der Architekturentscheidung docs/10_architekturentscheidung-voice-cascaded.md
-- Angewendet per Supabase-MCP (apply_migration), hier gespiegelt für Versionierung.

-- Signale pro Nachricht (User: Risiko/Sentiment/Konsistenz, Assistant: QN-Selbstprüfung)
alter table public.messages
  add column if not exists risk_level text check (risk_level in ('keine','niedrig','mittel','hoch','akut')),
  add column if not exists risk_terms text[],
  add column if not exists sentiment_valence numeric check (sentiment_valence >= -1 and sentiment_valence <= 1),
  add column if not exists consistency_note text,
  add column if not exists qn_flags jsonb;

-- Phasentracking: EKG-artiger Verlauf durchs U-Modell, kein hartes Sprungfeld
create table if not exists public.phase_signals (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  phase       text not null check (phase in ('einstieg','vertiefung','wendepunkt','loesungsraum','transfer')),
  confidence  numeric not null check (confidence >= 0 and confidence <= 1),
  rationale   text,
  created_at  timestamptz not null default now()
);

alter table public.phase_signals enable row level security;

create policy "phase_signals: own data" on public.phase_signals
  for all using (auth.uid() = user_id);

create index if not exists phase_signals_session_id_idx on public.phase_signals(session_id, created_at desc);
