// Promotes a signed-up user to owner: `node scripts/seed-owner.mjs you@example.com`
// Needs SUPABASE env (uses `.env.local`). Run once after the first sign-in.
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of (existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "").split("\n")) {
  const match = line.match(/^\s*([A-Z_]+)=(.*)\s*$/);
  if (match) process.env[match[1]] = match[2];
}

const email = process.argv[2];
if (!email) {
  console.error("usage: node scripts/seed-owner.mjs you@example.com");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const { data, error } = await supabase.auth.admin.listUsers();
if (error) throw error;
const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) {
  console.error(`no auth user with email ${email} — sign in once first (it provisions the profile)`);
  process.exit(1);
}
const { error: upsertError } = await supabase
  .from("profiles")
  .upsert({ id: user.id, email: user.email, role: "owner", suspended: false }, { onConflict: "id" });
if (upsertError) throw upsertError;
console.log(`promoted ${email} to owner`);
