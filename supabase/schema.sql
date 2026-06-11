-- ============================================================
-- SawahVerse — Supabase schema
-- ============================================================
-- Run this in the Supabase SQL editor (or `supabase db push`).
-- The game currently saves progress in localStorage; this schema
-- is the next step so progress, chat, and the leaderboard become
-- real and shared between players.
--
-- Identity model: players are identified by their Solana wallet
-- address. The recommended flow is "Sign in with Solana" via a
-- Supabase Edge Function that verifies a signed message and mints
-- a Supabase JWT whose `sub` is the wallet address. The RLS
-- policies below assume `auth.jwt() ->> 'wallet'` holds that
-- verified wallet address.
-- ============================================================

-- ---------- users ----------
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null unique,
  username text,
  level int not null default 1,
  xp int not null default 0,
  coins int not null default 50,
  energy int not null default 100,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

-- ---------- farms ----------
-- One row per player; tiles stored as JSON for the MVP
-- (e.g. [{"id":0,"state":"growing","planted_at":"..."}]).
create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  size int not null default 9,
  tiles jsonb not null default '[]'::jsonb,
  upgraded_at timestamptz,
  unique (user_id)
);

-- ---------- inventory ----------
-- One row per (player, item). Stackable items use quantity.
create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  item_type text not null check (item_type in ('rice', 'seed', 'fish', 'rare_item')),
  item_name text not null,
  rarity text check (rarity in ('Common', 'Uncommon', 'Rare', 'Epic', 'Legendary')),
  quantity int not null default 1 check (quantity >= 0),
  metadata jsonb not null default '{}'::jsonb,
  acquired_at timestamptz not null default now()
);
create index if not exists inventory_user_idx on public.inventory (user_id);

-- ---------- fish_catches ----------
-- Append-only log of every catch (powers stats + activity feed).
create table if not exists public.fish_catches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  fish_name text not null,
  rarity text not null check (rarity in ('Common', 'Uncommon', 'Rare', 'Epic', 'Legendary')),
  value int not null default 0,
  caught_at timestamptz not null default now()
);
create index if not exists fish_catches_user_idx on public.fish_catches (user_id, caught_at desc);

-- ---------- leaderboard ----------
-- A view, not a table: it can never drift out of sync with users.
create or replace view public.leaderboard as
select
  u.id,
  coalesce(u.username, left(u.wallet_address, 4) || '…' || right(u.wallet_address, 4)) as display_name,
  u.level,
  u.xp,
  u.coins,
  (select count(*) from public.fish_catches fc
    where fc.user_id = u.id and fc.rarity in ('Epic', 'Legendary')) as rare_catches
from public.users u
order by u.coins desc
limit 100;

-- ---------- chat_messages ----------
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 280),
  created_at timestamptz not null default now()
);
create index if not exists chat_created_idx on public.chat_messages (created_at desc);

-- Enable Supabase Realtime on chat for live messages.
alter publication supabase_realtime add table public.chat_messages;

-- ============================================================
-- Row Level Security
-- Everyone may read public game data; players may only write
-- rows tied to their own verified wallet.
-- ============================================================
alter table public.users enable row level security;
alter table public.farms enable row level security;
alter table public.inventory enable row level security;
alter table public.fish_catches enable row level security;
alter table public.chat_messages enable row level security;

create policy "users readable by all" on public.users for select using (true);
create policy "users update own row" on public.users for update
  using (wallet_address = auth.jwt() ->> 'wallet');

create policy "farms readable by all" on public.farms for select using (true);
create policy "farms write own" on public.farms for all
  using (user_id in (select id from public.users where wallet_address = auth.jwt() ->> 'wallet'));

create policy "inventory read own" on public.inventory for select
  using (user_id in (select id from public.users where wallet_address = auth.jwt() ->> 'wallet'));
create policy "inventory write own" on public.inventory for all
  using (user_id in (select id from public.users where wallet_address = auth.jwt() ->> 'wallet'));

create policy "catches readable by all" on public.fish_catches for select using (true);
create policy "catches insert own" on public.fish_catches for insert
  with check (user_id in (select id from public.users where wallet_address = auth.jwt() ->> 'wallet'));

create policy "chat readable by all" on public.chat_messages for select using (true);
create policy "chat insert own" on public.chat_messages for insert
  with check (user_id in (select id from public.users where wallet_address = auth.jwt() ->> 'wallet'));
