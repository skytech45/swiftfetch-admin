"use server";

import { revalidatePath } from "next/cache";
import { supabaseService } from "@/lib/supabase/service";
import { canManage, requireRoles, type AdminRole } from "@/lib/roles";
import { writeAudit } from "@/lib/audit";

const MANAGEABLE: AdminRole[] = ["admin", "finance", "support", "viewer"];

/** Change a member's role (owner/admin only, cannot touch equals). */
export async function setRole(userId: string, role: AdminRole): Promise<{ error?: string }> {
  const actor = await requireRoles(["owner", "admin"]);
  if (!MANAGEABLE.includes(role) && actor.role !== "owner") {
    return { error: "Only owners assign the owner role" };
  }
  const service = supabaseService();
  const { data: before } = await service.from("profiles").select("*").eq("id", userId).single();
  if (!before) return { error: "Member not found" };
  if (!canManage(actor.role, (before as { role: AdminRole }).role) && actor.id !== userId) {
    return { error: "Cannot manage a member of equal or higher rank" };
  }
  const { error } = await service.from("profiles").update({ role }).eq("id", userId);
  if (error) return { error: error.message };
  await writeAudit({
    actor: actor.id,
    action: "member.set_role",
    entity: "profiles",
    entityId: userId,
    before: { role: (before as { role: AdminRole }).role },
    after: { role },
  });
  revalidatePath("/dashboard/users");
  return {};
}

/** Suspend / unsuspend a member (owner/admin only). */
export async function setSuspended(userId: string, suspended: boolean): Promise<{ error?: string }> {
  const actor = await requireRoles(["owner", "admin"]);
  if (actor.id === userId) return { error: "You cannot suspend yourself" };
  const service = supabaseService();
  const { error } = await service.from("profiles").update({ suspended }).eq("id", userId);
  if (error) return { error: error.message };
  await writeAudit({
    actor: actor.id,
    action: suspended ? "member.suspend" : "member.unsuspend",
    entity: "profiles",
    entityId: userId,
    after: { suspended },
  });
  revalidatePath("/dashboard/users");
  return {};
}
