import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";

interface Artifact {
  url?: string;
  signature?: string;
}

/** Compare dotted versions: -1 when a < b, 0 when equal, 1 when a > b. */
export function compareVersions(a: string, b: string): number {
  const parts = (v: string) => v.split(".").map((n) => parseInt(n, 10) || 0);
  const pa = parts(a);
  const pb = parts(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x < y) return -1;
    if (x > y) return 1;
  }
  return 0;
}

/**
 * Public update feed (Tauri updater format, anonymous).
 * GET /api/updates/stable?current=0.1.0 → 204 when current, else the
 * release JSON with `platforms`, `min_required` and `force` hint.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ channel: string }> },
) {
  const { channel } = await params;
  if (channel !== "stable" && channel !== "beta") {
    return NextResponse.json({ error: "unknown channel" }, { status: 404 });
  }
  const current = new URL(request.url).searchParams.get("current") ?? "0.0.0";

  const service = supabaseService();
  const { data, error } = await service
    .from("releases")
    .select("version,min_required,notes,artifacts,created_at")
    .eq("channel", channel)
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return new NextResponse(null, { status: 204 });
  }
  const release = data as {
    version: string;
    min_required: string;
    notes: string;
    artifacts: Record<string, Artifact>;
    created_at: string;
  };
  if (compareVersions(current, release.version) >= 0) {
    return new NextResponse(null, { status: 204 });
  }
  const platforms: Record<string, Artifact> = {};
  for (const [target, artifact] of Object.entries(release.artifacts ?? {})) {
    if (artifact?.url && artifact?.signature) {
      platforms[target] = { url: artifact.url, signature: artifact.signature };
    }
  }
  return NextResponse.json({
    version: release.version,
    notes: release.notes,
    pub_date: release.created_at,
    min_required: release.min_required,
    force: compareVersions(current, release.min_required) < 0,
    platforms,
  });
}
