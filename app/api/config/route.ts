import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";

interface Flag {
  key: string;
  value_json: unknown;
  rollout_pct: number;
}

/** Deterministic 0–99 bucket per install id (stable across restarts). */
export function bucketFor(installId: string, key: string): number {
  let hash = 2166136261;
  for (const ch of `${installId}:${key}`) {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % 100;
}

/**
 * Public remote config (anonymous). GET /api/config?install=<uuid> →
 * `{ key: value }` for flags whose rollout includes this install.
 */
export async function GET(request: Request) {
  const install = new URL(request.url).searchParams.get("install") ?? "anonymous";
  const service = supabaseService();
  const { data, error } = await service.from("feature_flags").select("key,value_json,rollout_pct");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const config: Record<string, unknown> = {};
  for (const flag of (data ?? []) as Flag[]) {
    if (bucketFor(install, flag.key) < flag.rollout_pct) {
      config[flag.key] = flag.value_json;
    }
  }
  return NextResponse.json(config);
}
