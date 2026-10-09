import { supabaseService } from "@/lib/supabase/service";
import { requireRoles } from "@/lib/roles";

export const dynamic = "force-dynamic";

interface AuditRow {
  id: string;
  actor: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  created_at: string;
}

export default async function AuditPage() {
  await requireRoles(["owner", "admin", "support"]);
  const service = supabaseService();
  const { data, error } = await service
    .from("audit_logs")
    .select("id,actor,action,entity,entity_id,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as AuditRow[];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Audit log</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Every admin mutation, newest first. Rows are insert-only.
      </p>
      <div className="mt-4 overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 text-left text-zinc-400">
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">Actor</th>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Entity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-zinc-800">
                <td className="px-4 py-2 text-zinc-400">
                  {new Date(row.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-2 font-mono text-xs">{row.actor?.slice(0, 8) ?? "—"}</td>
                <td className="px-4 py-2 font-mono text-xs">{row.action}</td>
                <td className="px-4 py-2 font-mono text-xs">
                  {row.entity}
                  {row.entity_id ? ` · ${row.entity_id.slice(0, 8)}` : ""}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                  No audit events yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
