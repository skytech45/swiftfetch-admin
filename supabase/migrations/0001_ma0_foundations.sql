-- SwiftFetch Admin (Track A, M-A0): auth foundations, RBAC, audit log.
-- Run in the Supabase SQL editor (or `supabase db push`). Idempotent.

-- 1. Roles ---------------------------------------------------------------
do $$ begin
  create type admin_role as enum ('owner', 'admin', 'finance', 'support', 'viewer');
exception when duplicate_object then null;
end $$;

-- 2. Profiles (one row per auth user) ------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role admin_role not null default 'viewer',
  suspended boolean not null default false,
  created_at timestamptz not null default now()
);

-- 3. Audit log (immutable: no update/delete grants given to anyone) ------
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor uuid references auth.users (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

-- 4. Auto-profile on signup (least privilege: viewer) --------------------
create or replace function handle_new_admin_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, role)
  values (new.id, new.email, 'viewer')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_admin_user_created on auth.users;
create trigger on_admin_user_created
  after insert on auth.users
  for each row execute function handle_new_admin_user();

-- 5. Row-level security ---------------------------------------------------
alter table profiles enable row level security;
alter table audit_logs enable row level security;

drop policy if exists "own profile readable" on profiles;
create policy "own profile readable" on profiles
  for select using (auth.uid() = id);

drop policy if exists "owners manage profiles" on profiles;
create policy "owners manage profiles" on profiles
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner', 'admin'))
  );

drop policy if exists "team reads audit log" on audit_logs;
create policy "team reads audit log" on audit_logs
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner', 'admin', 'support'))
  );

-- Writes go through the service-role API (server actions), never RLS.
