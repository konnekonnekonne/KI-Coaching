-- KICO Initial Schema
-- Run this in Supabase SQL Editor: https://ejxiboybvwpeknghlvar.supabase.co/project/default/sql

-- =====================
-- PROFILES
-- =====================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================
-- SESSIONS
-- =====================
create table if not exists public.sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text,
  created_at  timestamptz default now() not null,
  ended_at    timestamptz
);

-- =====================
-- MESSAGES
-- =====================
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  created_at  timestamptz default now() not null
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================
alter table public.profiles  enable row level security;
alter table public.sessions  enable row level security;
alter table public.messages  enable row level security;

-- Profiles: user can only see and update their own
create policy "profiles: own data" on public.profiles
  for all using (auth.uid() = id);

-- Sessions: user can only see and manage their own
create policy "sessions: own data" on public.sessions
  for all using (auth.uid() = user_id);

-- Messages: user can only see messages from their own sessions
create policy "messages: own data" on public.messages
  for all using (auth.uid() = user_id);

-- =====================
-- INDEXES
-- =====================
create index if not exists sessions_user_id_idx  on public.sessions(user_id);
create index if not exists sessions_created_at_idx on public.sessions(created_at desc);
create index if not exists messages_session_id_idx on public.messages(session_id);
create index if not exists messages_created_at_idx on public.messages(created_at asc);
