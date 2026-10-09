import { supabaseService } from "./supabase/service";

export interface AuditEntry {
  actor: string | null;
  action: string;
  entity: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
}

/** Appends an immutable audit row. Call from every mutating server action. */
export async function writeAudit(entry: AuditEntry): Promise<void> {
  const service = supabaseService();
  const { error } = await service.from("audit_logs").insert({
    actor: entry.actor,
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entityId ?? null,
    before: entry.before === undefined ? null : entry.before,
    after: entry.after === undefined ? null : entry.after,
  });
  if (error) {
    console.error("audit write failed", error);
  }
}
