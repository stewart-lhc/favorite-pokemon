create table if not exists declaration_rate_limits (
  key_hash text primary key check (char_length(key_hash) = 64),
  window_started_at timestamptz not null default now(),
  attempt_count integer not null default 1 check (attempt_count > 0),
  updated_at timestamptz not null default now()
);

-- favmon:migration-statement
create index if not exists declaration_rate_limits_updated_at_idx
  on declaration_rate_limits (updated_at);
