-- Migration 006: messages-Tabelle für Realtime freischalten
-- Wird vom Background-Operations-Panel gebraucht (B-23, docs/backlog.md).
-- Angewendet per Supabase-MCP (apply_migration), hier gespiegelt für Versionierung.

alter publication supabase_realtime add table public.messages;
