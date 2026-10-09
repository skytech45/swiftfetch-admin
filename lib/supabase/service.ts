import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. SERVER ONLY — never import from client components.
 * Bypasses RLS; every call site must enforce RBAC first (see `lib/roles`).
 */
export function supabaseService() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
