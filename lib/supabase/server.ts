import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/** Request-scoped client (reads the session cookie). Server use only. */
export async function supabaseServer() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) => jar.set(name, value, options));
          } catch {
            /* middleware owns cookies in that context */
          }
        },
      },
    },
  );
}
