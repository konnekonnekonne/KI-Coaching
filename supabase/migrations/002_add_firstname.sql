-- Migration 002: Vorname zu profiles hinzufügen
-- Run in Supabase SQL Editor: https://rccugewhmscysohzewfw.supabase.co/project/default/sql

alter table public.profiles
  add column if not exists first_name text;

-- Sessions: title-Spalte für Anzeige in der Übersicht (optional, auto-generiert)
alter table public.sessions
  add column if not exists message_count integer default 0;
