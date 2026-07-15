create extension if not exists pgcrypto;

create table if not exists declarations (
  id uuid primary key default gen_random_uuid(),
  trainer_name text not null check (char_length(trim(trainer_name)) between 2 and 80),
  pokemon_id integer not null check (pokemon_id between 1 and 1025),
  pokemon_name text not null check (char_length(trim(pokemon_name)) between 1 and 120),
  reason text not null check (char_length(trim(reason)) between 10 and 300),
  type text not null check (type in ('favourite', 'not_favourite')),
  created_at timestamptz not null default now()
);

create index if not exists declarations_type_created_at_idx
  on declarations (type, created_at desc);

create index if not exists declarations_type_pokemon_id_idx
  on declarations (type, pokemon_id);

create table if not exists declaration_rate_limits (
  key_hash text primary key check (char_length(key_hash) = 64),
  window_started_at timestamptz not null default now(),
  attempt_count integer not null default 1 check (attempt_count > 0),
  updated_at timestamptz not null default now()
);

create index if not exists declaration_rate_limits_updated_at_idx
  on declaration_rate_limits (updated_at);

create or replace view pokemon_stats as
select
  pokemon_id,
  max(pokemon_name) as pokemon_name,
  count(*)::integer as fan_count
from declarations
where type = 'favourite'
group by pokemon_id;

create or replace view pokemon_stats_not_favourite as
select
  pokemon_id,
  max(pokemon_name) as pokemon_name,
  count(*)::integer as fan_count
from declarations
where type = 'not_favourite'
group by pokemon_id;
