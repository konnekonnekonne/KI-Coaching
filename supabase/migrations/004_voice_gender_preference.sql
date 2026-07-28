-- Migration 004: Stimmwahl für den Voice-Modus (Aura-2, Deutsch)
-- Zwei vom Nutzer ausgewählte Stimmen: aura-2-aurelia-de (weiblich),
-- aura-2-fabian-de (maennlich) — siehe voice-agent/models.py.
-- Angewendet per Supabase-MCP (apply_migration), hier gespiegelt für Versionierung.

alter table public.profiles
  add column if not exists voice_gender text check (voice_gender in ('weiblich','maennlich')) default 'weiblich';
