import { supabaseService } from "@/lib/supabase/service";
import { requireRoles } from "@/lib/roles";
import { LicenseForm } from "./license-form";
import { LicenseRow } from "./license-row";

export const dynamic = "force-dynamic";

interface License {
  id: string;
  key: string;
  tier: string;
  status: string;
  claimed_by: string | null;
  note: string;
  created_at: string;
}

export default async function LicensesPage() {
  await requireRoles(["owner", "admin"]);
  const service = supabaseService();
  const { data, error } = await service
    .from("licenses")
    .select("id,key,tier,status,claimed_by,note,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  const licenses = (data ?? []) as License[];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Licenses</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Pro keys for the desktop app. A key activates one account (M-A2); trials cover everyone
        else for 30 days.
      </p>
      <LicenseForm />
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 text-left text-zinc-400">
              <th className="px-4 py-2">Key</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Claimed by</th>
              <th className="px-4 py-2">Note</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {licenses.map((license) => (
              <LicenseRow key={license.id} license={license} />
            ))}
            {licenses.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                  No keys yet — mint one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
