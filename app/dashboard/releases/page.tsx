import { supabaseService } from "@/lib/supabase/service";
import { requireRoles } from "@/lib/roles";
import { ReleaseForm } from "./release-form";
import { ReleaseRow } from "./release-row";

export const dynamic = "force-dynamic";

interface Release {
  id: string;
  version: string;
  channel: string;
  min_required: string;
  notes: string;
  published: boolean;
  created_at: string;
}

export default async function ReleasesPage() {
  await requireRoles(["owner", "admin"]);
  const service = supabaseService();
  const { data, error } = await service
    .from("releases")
    .select("id,version,channel,min_required,notes,published,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  const releases = (data ?? []) as Release[];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Releases</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Publishing makes a version live on <code>/api/updates/&lt;channel&gt;</code>. Only
        artifacts with a URL <em>and</em> an Ed25519 signature reach the updater.
      </p>
      <ReleaseForm />
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 text-left text-zinc-400">
              <th className="px-4 py-2">Version</th>
              <th className="px-4 py-2">Channel</th>
              <th className="px-4 py-2">Min required</th>
              <th className="px-4 py-2">Published</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {releases.map((release) => (
              <ReleaseRow key={release.id} release={release} />
            ))}
            {releases.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                  No releases yet — publish one to feed the updater.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
