-- SwiftFetch Admin (Track A, M-A2 lite): app end-users + device binding.
-- The desktop app signs users in via Supabase Auth; tiers and devices live
-- here and are managed from the dashboard (Users → App users). Idempotent.

-- 1. App users (end users of the desktop app; separate from admin team) --
create table if not exists app_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  tier text not null default 'free' check (tier in ('free', 'pro')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  trial_ends_at timestamptz,
  created_at timestamptz not null default now()
);

-- 2. Device bindings (≤3 PCs per user, PRD anti-abuse) -------------------
create table if not exists devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users (id) on delete cascade,
  device_id text not null,
  label text,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, device_id)
);

-- 3. Auto-provision app_users on signup (free tier) -----------------------
create or replace function handle_new_app_user()
returns trigger language plpgsql security definer as $$
begin
  insert into app_users (id, email, tier)
  values (new.id, new.email, 'free')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_app_user_created on auth.users;
create trigger on_app_user_created
  after insert on auth.users
  for each row execute function handle_new_app_user();

-- 4. Device registration with the 3-PC cap (called by the desktop app) ----
create or replace function register_device(p_device_id text, p_label text default null)
returns jsonb language plpgsql security definer as $$
declare
  v_count int;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'reason', 'not_signed_in');
  end if;
  if exists (select 1 from app_users where id = auth.uid() and status = 'suspended') then
    return jsonb_build_object('ok', false, 'reason', 'suspended');
  end if;
  insert into devices (user_id, device_id, label)
  values (auth.uid(), p_device_id, p_label)
  on conflict (user_id, device_id)
  do update set last_seen = now(), label = coalesce(excluded.label, devices.label);
  select count(*) into v_count from devices where user_id = auth.uid();
  if v_count > 3 then
    delete from devices where user_id = auth.uid() and device_id = p_device_id;
    return jsonb_build_object('ok', false, 'reason', 'device_limit');
  end if;
  return jsonb_build_object('ok', true, 'devices', v_count);
end $$;

-- 5. RLS: users read their own rows; admins go through the service API ---
alter table app_users enable row level security;
alter table devices enable row level security;

drop policy if exists "own app_user readable" on app_users;
create policy "own app_user readable" on app_users
  for select using (auth.uid() = id);

drop policy if exists "own devices readable" on devices;
create policy "own devices readable" on devices
  for select using (auth.uid() = user_id);
