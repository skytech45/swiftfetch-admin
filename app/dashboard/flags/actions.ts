"use server";

import { revalidatePath } from "next/cache";
import { supabaseService } from "@/lib/supabase/service";
import { requireRoles } from "@/lib/roles";
import { writeAudit } from "@/lib/audit";

/** Upserts a remote-config flag (owner/admin). Value must be JSON. */
export async function setFlag(
  key: string,
  value: string,
  rollout: number,
): Promise<{ error?: string }> {
  const actor = await requireRoles(["owner", "admin"]);
  if (!/^[a-z0-9._-]+$/i.test(key)) {
    return { error: "Key may only contain letters, numbers, dots, dashes" };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return { error: "Value must be valid JSON" };
  }
  if (!Number.isInteger(rollout) || rollout < 0 || rollout > 100) {
    return { error: "Rollout must be an integer 0–100" };
  }
  const service = supabaseService();
  const { error } = await service
    .from("feature_flags")
    .upsert({ key, value_json: parsed, rollout_pct: rollout }, { onConflict: "key" });
  if (error) return { error: error.message };
  await writeAudit({
    actor: actor.id,
    action: "flag.set",
    entity: "feature_flags",
    entityId: key,
    after: { rollout_pct: rollout },
  });
  revalidatePath("/dashboard/flags");
  return {};
}
