-- SwiftFetch Admin: let users provision their OWN app_users row.
-- The desktop app inserts `{id, email, display_name}` right after sign-up
-- (`on_conflict DO NOTHING` — first writer wins, server trigger stays as
-- backup). INSERT-only by design: tier/status remain server-managed, so
-- there is no self-promotion path. Idempotent.

drop policy if exists "own app_user insert" on app_users;
create policy "own app_user insert" on app_users
  for insert with check (auth.uid() = id);
