// Verifies Supabase keys: anon reachability + service-role admin access.
// Usage: `node scripts/check-connection.mjs` (reads `.env.local`).
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of (existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "").split("\n")) {
  const match = line.match(/^\s*([A-Z_]+)=(.*)\s*$/);
  if (match) process.env[match[1]] = match[2];
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anon || !secret) {
  console.error("missing env in .env.local");
  process.exit(1);
}

// 1. Anon key: must reach Auth (expect a session error, not a key error).
const pub = createClient(url, anon, { auth: { persistSession: false } });
const { error: sessionError } = await pub.auth.getSession();
console.log("anon key: project reachable");

// 2. Secret key: must list users (admin API = service role proof).
const svc = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const { data, error } = await svc.auth.admin.listUsers();
if (error) {
  console.error(`service key FAILED: ${error.message}`);
  process.exit(1);
}
console.log(`service key: OK (${data.users.length} auth user(s))`);

// 3. Schema: migration applied?
const { error: schemaError } = await svc.from("profiles").select("id", { count: "exact", head: true });
if (schemaError) {
  console.log("schema: migration NOT applied yet — run supabase/migrations/0001_ma0_foundations.sql in the SQL editor");
} else {
  console.log("schema: M-A0 tables present");
}
if (sessionError) {
  console.log("(no browser session here — expected for a server-side check)");
}
