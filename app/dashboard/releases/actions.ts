"use server";

import { revalidatePath } from "next/cache";
import { supabaseService } from "@/lib/supabase/service";
import { requireRoles } from "@/lib/roles";
import { writeAudit } from "@/lib/audit";

export interface ReleaseInput {
  version: string;
  channel: string;
  min_required: string;
  notes: string;
  artifacts: string;
  published: boolean;
}

/** Creates a release draft (owner/admin). Artifacts must be JSON. */
export async function createRelease(input: ReleaseInput): Promise<{ error?: string }> {
  const actor = await requireRoles(["owner", "admin"]);
  if (!/^\d+\.\d+\.\d+$/.test(input.version)) {
    return { error: "Version must look like 1.2.3" };
  }
  let artifacts: unknown;
  try {
    artifacts = input.artifacts.trim() === "" ? {} : JSON.parse(input.artifacts);
  } catch {
    return { error: "Artifacts must be valid JSON" };
  }
  const service = supabaseService();
  const { data, error } = await service
    .from("releases")
    .insert({
      version: input.version,
      channel: input.channel,
      min_required: input.min_required || "0.1.0",
      notes: input.notes,
      artifacts,
      published: input.published,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  await writeAudit({
    actor: actor.id,
    action: "release.create",
    entity: "releases",
    entityId: (data as { id: string }).id,
    after: { version: input.version, channel: input.channel, published: input.published },
  });
  revalidatePath("/dashboard/releases");
  return {};
}

/** Toggles publish state (publishing makes it live on the feed). */
export async function setPublished(id: string, published: boolean): Promise<{ error?: string }> {
  const actor = await requireRoles(["owner", "admin"]);
  const service = supabaseService();
  const { error } = await service.from("releases").update({ published }).eq("id", id);
  if (error) return { error: error.message };
  await writeAudit({
    actor: actor.id,
    action: published ? "release.publish" : "release.unpublish",
    entity: "releases",
    entityId: id,
  });
  revalidatePath("/dashboard/releases");
  return {};
}

/** Deletes a release draft (published releases should be unpublished first). */
export async function deleteRelease(id: string): Promise<{ error?: string }> {
  const actor = await requireRoles(["owner", "admin"]);
  const service = supabaseService();
  const { error } = await service.from("releases").delete().eq("id", id);
  if (error) return { error: error.message };
  await writeAudit({ actor: actor.id, action: "release.delete", entity: "releases", entityId: id });
  revalidatePath("/dashboard/releases");
  return {};
}
