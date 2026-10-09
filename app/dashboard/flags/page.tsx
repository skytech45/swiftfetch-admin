import { supabaseService } from "@/lib/supabase/service";
import { requireRoles } from "@/lib/roles";
import { FlagForm } from "./flag-form";

export const dynamic = "force-dynamic";

interface Flag {
  key: string;
  value_json: unknown;
  rollout_pct: number;
}

export default async function FlagsPage() {
  await requireRoles(["owner", "admin"]);
  const service = supabaseService();
  const { data, error } = await service
    .from("feature_flags")
    .select("key,value_json,rollout_pct")
    .order("key");
  if (error) throw new Error(error.message);
  const flags = (data ?? []) as Flag[];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Feature flags</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Remote config the desktop app pulls at startup. Rollout % gates by stable install bucket.
      </p>
      <FlagForm />
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 text-left text-zinc-400">
              <th className="px-4 py-2">Key</th>
              <th className="px-4 py-2">Value</th>
              <th className="px-4 py-2">Rollout</th>
            </tr>
          </thead>
          <tbody>
            {flags.map((flag) => (
              <tr key={flag.key} className="border-t border-zinc-800">
                <td className="px-4 py-2 font-mono text-xs">{flag.key}</td>
                <td className="px-4 py-2 font-mono text-xs">
                  {JSON.stringify(flag.value_json)?.slice(0, 80)}
                </td>
                <td className="px-4 py-2">{flag.rollout_pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
