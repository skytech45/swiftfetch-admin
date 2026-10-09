-- SwiftFetch Admin: display names on app users (register form sends
-- `data.display_name`, stored here for the dashboard). Requires 0002.
-- Idempotent.

alter table app_users add column if not exists display_name text;

create or replace function handle_new_app_user()
returns trigger language plpgsql security definer as $$
begin
  insert into app_users (id, email, display_name, tier)
  values (new.id, new.email, new.raw_user_meta_data ->> 'display_name', 'free')
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, app_users.display_name);
  return new;
end $$;

drop trigger if exists on_app_user_created on auth.users;
create trigger on_app_user_created
  after insert on auth.users
  for each row execute function handle_new_app_user();
