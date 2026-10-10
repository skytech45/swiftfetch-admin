-- SwiftFetch Admin (Track A, M-A2): license keys + trials.
-- New signups get a 30-day Pro trial; license keys upgrade to Pro.
-- Idempotent.

-- 1. Trial window on new accounts ----------------------------------------
alter table app_users add column if not exists license_key text;

create or replace function handle_new_app_user()
returns trigger language plpgsql security definer as $$
begin
  insert into app_users (id, email, display_name, tier, trial_ends_at)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'display_name',
    'free',
    now() + interval '30 days'
  )
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, app_users.display_name);
  return new;
exception when others then
  raise warning 'handle_new_app_user failed for %: %', new.id, sqlerrm;
  return new;
end $$;

drop trigger if exists on_app_user_created on auth.users;
create trigger on_app_user_created
  after insert on auth.users
  for each row execute function handle_new_app_user();

-- 2. License keys ---------------------------------------------------------
create table if not exists licenses (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  tier text not null default 'pro' check (tier in ('pro')),
  status text not null default 'active' check (status in ('active', 'revoked')),
  max_devices int not null default 3,
  claimed_by uuid references auth.users (id) on delete set null,
  note text not null default '',
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table licenses enable row level security;
-- No public policies: licenses are managed through the service-role API.

-- 3. Key activation (called by the desktop app) ---------------------------
create or replace function activate_license(p_key text)
returns jsonb language plpgsql security definer as $$
declare
  v_license licenses%rowtype;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'reason', 'not_signed_in');
  end if;
  select * into v_license from licenses where key = p_key;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'invalid_key');
  end if;
  if v_license.status <> 'active' then
    return jsonb_build_object('ok', false, 'reason', 'revoked');
  end if;
  if v_license.expires_at is not null and v_license.expires_at < now() then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;
  if v_license.claimed_by is not null and v_license.claimed_by <> auth.uid() then
    return jsonb_build_object('ok', false, 'reason', 'already_claimed');
  end if;
  update licenses set claimed_by = auth.uid() where id = v_license.id;
  update app_users set tier = 'pro', license_key = p_key where id = auth.uid();
  return jsonb_build_object('ok', true, 'tier', 'pro');
end $$;
