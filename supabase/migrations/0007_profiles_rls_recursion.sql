-- SwiftFetch Admin: fix infinite recursion in the profiles RLS policy.
-- The old "owners manage profiles" policy selected from `profiles` inside
-- its own policy, so EVERY RLS read on profiles failed and the dashboard
-- showed forbidden for all real logins. The role check now lives in a
-- SECURITY DEFINER helper (bypasses RLS, no recursion). Idempotent.

create or replace function is_team_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role in ('owner', 'admin')
  );
$$;

drop policy if exists "owners manage profiles" on profiles;
create policy "owners manage profiles" on profiles
  for all using (is_team_admin());
