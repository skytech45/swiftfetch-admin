"use client";

import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="rounded-md border border-zinc-700 px-2 py-1 hover:bg-zinc-800"
      onClick={() => {
        void supabaseBrowser()
          .auth.signOut()
          .then(() => {
            router.replace("/login");
            router.refresh();
          });
      }}
    >
      Sign out
    </button>
  );
}
