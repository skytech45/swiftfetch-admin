import { supabaseService } from "@/lib/supabase/service";
import { requireRoles } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  await requireRoles(["owner", "admin", "finance", "support", "viewer"]);
  const service = supabaseService();
  const [{ count: users }, { count: events }] = await Promise.all([
    service.from("profiles").select("*", { count: "exact", head: true }),
    service.from("audit_logs").select("*", { count: "exact", head: true }),
  ]);

  const cards = [
    { label: "Team members", value: users ?? 0 },
    { label: "Audit events", value: events ?? 0 },
    { label: "Update feed", value: "M-A1" },
    { label: "Licensing", value: "M-A2" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Overview</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Track A foundations (M-A0): auth, RBAC, audit. Distribution control ships in M-A1.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="text-2xl font-semibold">{card.value}</div>
            <div className="mt-1 text-sm text-zinc-400">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
