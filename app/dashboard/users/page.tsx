import { supabaseService } from "@/lib/supabase/service";
import { requireRoles, type Profile } from "@/lib/roles";
import { MemberRow } from "./member-row";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requireRoles(["owner", "admin", "support"]);
  const service = supabaseService();
  const { data, error } = await service
    .from("profiles")
    .select("id,email,role,suspended")
    .order("created_at");
  if (error) throw new Error(error.message);
  const members = (data ?? []) as Profile[];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Users</h1>
      <p className="mt-1 text-sm text-zinc-400">
        License-holder registry ships in M-A2; this is the admin team (module 1/6).
      </p>
      <div className="mt-4 overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 text-left text-zinc-400">
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <MemberRow key={member.id} member={member} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
