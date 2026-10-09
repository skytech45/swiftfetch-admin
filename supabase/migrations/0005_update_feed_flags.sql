-- SwiftFetch Admin (Track A, M-A1): distribution control.
-- `releases` powers the public update feed (per-channel latest +
-- min-required version for force-update). `feature_flags` powers remote
-- config the desktop app pulls at startup. Idempotent.

create table if not exists releases (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  channel text not null default 'stable' check (channel in ('stable', 'beta')),
  min_required text not null default '0.1.0',
  notes text not null default '',
  artifacts jsonb not null default '{}',
  -- {"windows-x86_64": {"url": "...", "signature": "..."}, ...}
  published boolean not null default false,
  created_at timestamptz not null default now(),
  unique (channel, version)
);

create table if not exists feature_flags (
  key text primary key,
  value_json jsonb not null default 'null',
  rollout_pct int not null default 100 check (rollout_pct between 0 and 100),
  updated_at timestamptz not null default now()
);

-- Seed the flags the desktop reads at startup (safe defaults).
insert into feature_flags (key, value_json) values
  ('clipboard.prompt_default', '"ask"'),
  ('connections.default', '8'),
  ('announcement.banner', 'null'),
  ('feed.channel_default', '"stable"')
on conflict (key) do nothing;

-- Public (unauthenticated, anonymous) reads: the desktop updater and
-- remote-config fetch run with the anon key and no login.
alter table releases enable row level security;
alter table feature_flags enable row level security;

drop policy if exists "published releases readable" on releases;
create policy "published releases readable" on releases
  for select using (published = true);

drop policy if exists "flags readable" on feature_flags;
create policy "flags readable" on feature_flags
  for select using (true);

-- Writes go through the service-role API (owner/admin server actions).
