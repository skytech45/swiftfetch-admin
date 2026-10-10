"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { supabaseService } from "@/lib/supabase/service";
import { requireRoles } from "@/lib/roles";
import { writeAudit } from "@/lib/audit";

/** Mints a license key (owner/admin). Format: SF-XXXX-XXXX-XXXX-XXXX. */
export async function createLicense(note: string): Promise<{ error?: string; key?: string }> {
  const actor = await requireRoles(["owner", "admin"]);
  const groups = [];
  const bytes = randomBytes(8);
  for (let i = 0; i < 4; i++) {
    groups.push(bytes.subarray(i * 2, i * 2 + 2).toString("hex").toUpperCase());
  }
  const key = `SF-${groups.join("-")}`;
  const service = supabaseService();
  const { data, error } = await service
    .from("licenses")
    .insert({ key, tier: "pro", note: note.slice(0, 200) })
    .select("id")
    .single();
  if (error) return { error: error.message };
  await writeAudit({
    actor: actor.id,
    action: "license.create",
    entity: "licenses",
    entityId: (data as { id: string }).id,
    after: { note },
  });
  revalidatePath("/dashboard/licenses");
  return { key };
}

/** Revokes (or restores) a license key. */
export async function setLicenseStatus(
  id: string,
  status: "active" | "revoked",
): Promise<{ error?: string }> {
  const actor = await requireRoles(["owner", "admin"]);
  const service = supabaseService();
  const { error } = await service.from("licenses").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  await writeAudit({
    actor: actor.id,
    action: status === "revoked" ? "license.revoke" : "license.restore",
    entity: "licenses",
    entityId: id,
  });
  revalidatePath("/dashboard/licenses");
  return {};
}

/** Deletes an unclaimed license key. */
export async function deleteLicense(id: string): Promise<{ error?: string }> {
  const actor = await requireRoles(["owner", "admin"]);
  const service = supabaseService();
  const { data } = await service.from("licenses").select("claimed_by").eq("id", id).single();
  if (data && (data as { claimed_by: string | null }).claimed_by) {
    return { error: "Claimed keys cannot be deleted — revoke instead" };
  }
  const { error } = await service.from("licenses").delete().eq("id", id);
  if (error) return { error: error.message };
  await writeAudit({ actor: actor.id, action: "license.delete", entity: "licenses", entityId: id });
  revalidatePath("/dashboard/licenses");
  return {};
}
