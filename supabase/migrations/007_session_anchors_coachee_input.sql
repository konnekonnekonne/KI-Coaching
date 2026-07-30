-- Migration 007: Coachee-Eingabe fuer Anker (Erweiterung B-23) -- der Coachee
-- soll manche Anker-Werte (allen voran die Coachingfrage) selbst schreiben,
-- statt dass KICO sie fuer ihn formuliert und via set_anchor selbst setzt.
-- Siehe docs/backlog.md B-23, docs/03_systemprompt.md.
-- Angewendet per Supabase-MCP (apply_migration), hier gespiegelt fuer Versionierung.

alter table public.session_anchors
  alter column value drop not null,
  add column if not exists prompt text,
  add column if not exists awaiting_input boolean not null default false;
