import { supabaseService } from "@/lib/supabase/service";
import { requireRoles } from "@/lib/roles";
import { AppUserRow } from "./app-user-row";

export const dynamic = "force-dynamic";

interface Device {
  id: string;
  device_id: string;
  label: string | null;
  last_seen: string;
}

interface AppUser {
  id: string;
  email: string;
  tier: string;
  status: string;
  trial_ends_at: string | null;
  created_at: string;
}

export default async function AppUsersPage() {
  await requireRoles(["owner", "admin", "support"]);
  const service = supabaseService();
  const { data: users, error } = await service
    .from("app_users")
    .select("id,email,tier,status,trial_ends_at,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  const list = (users ?? []) as AppUser[];

  const { data: devices } = await service
    .from("devices")
    .select("id,user_id,device_id,label,last_seen")
    .order("last_seen", { ascending: false });
  const byUser = new Map<string, (Device & { user_id: string })[]>();
  for (const device of (devices ?? []) as (Device & { user_id: string })[]) {
    const group = byUser.get(device.user_id) ?? [];
    group.push(device);
    byUser.set(device.user_id, group);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">App users</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Desktop accounts (Supabase Auth) with tiers and device bindings. Free tier is the
        default; Pro unlocks in M-A3 commerce.
      </p>
      <div className="mt-4 overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 text-left text-zinc-400">
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Tier</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Devices</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((user) => (
              <AppUserRow key={user.id} user={user} devices={byUser.get(user.id) ?? []} />
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                  No app users yet — they appear after the first desktop sign-up.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
