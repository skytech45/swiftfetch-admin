"use server";

import { revalidatePath } from "next/cache";
import { supabaseService } from "@/lib/supabase/service";
import { requireRoles } from "@/lib/roles";
import { writeAudit } from "@/lib/audit";

/** Change an app user's tier (free/pro). */
export async function setTier(userId: string, tier: "free" | "pro"): Promise<{ error?: string }> {
  const actor = await requireRoles(["owner", "admin"]);
  const service = supabaseService();
  const { data: before } = await service.from("app_users").select("tier").eq("id", userId).single();
  if (!before) return { error: "App user not found" };
  const { error } = await service.from("app_users").update({ tier }).eq("id", userId);
  if (error) return { error: error.message };
  await writeAudit({
    actor: actor.id,
    action: "app_user.set_tier",
    entity: "app_users",
    entityId: userId,
    before: { tier: (before as { tier: string }).tier },
    after: { tier },
  });
  revalidatePath("/dashboard/app-users");
  return {};
}

/** Suspend / unsuspend an app user (blocks device registration + app use). */
export async function setAppUserStatus(
  userId: string,
  status: "active" | "suspended",
): Promise<{ error?: string }> {
  const actor = await requireRoles(["owner", "admin"]);
  const service = supabaseService();
  const { error } = await service.from("app_users").update({ status }).eq("id", userId);
  if (error) return { error: error.message };
  await writeAudit({
    actor: actor.id,
    action: status === "suspended" ? "app_user.suspend" : "app_user.unsuspend",
    entity: "app_users",
    entityId: userId,
    after: { status },
  });
  revalidatePath("/dashboard/app-users");
  return {};
}

/** Revoke one device binding (frees a seat of the 3-PC limit). */
export async function revokeDevice(deviceId: string, userId: string): Promise<{ error?: string }> {
  const actor = await requireRoles(["owner", "admin"]);
  const service = supabaseService();
  const { error } = await service.from("devices").delete().eq("id", deviceId);
  if (error) return { error: error.message };
  await writeAudit({
    actor: actor.id,
    action: "device.revoke",
    entity: "devices",
    entityId: deviceId,
    before: { user_id: userId },
  });
  revalidatePath("/dashboard/app-users");
  return {};
}
