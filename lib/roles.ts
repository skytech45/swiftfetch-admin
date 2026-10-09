import { supabaseServer } from "./supabase/server";

export type AdminRole = "owner" | "admin" | "finance" | "support" | "viewer";

const RANK: Record<AdminRole, number> = {
  viewer: 0,
  support: 1,
  finance: 2,
  admin: 3,
  owner: 4,
};

export interface Profile {
  id: string;
  email: string;
  role: AdminRole;
  suspended: boolean;
}

/** Current user's profile, or null when signed out / not provisioned. */
export async function currentProfile(): Promise<Profile | null> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id,email,role,suspended")
    .eq("id", user.id)
    .single();
  return (data as Profile | null) ?? null;
}

/** Throws (→ 403 page) unless the user holds one of `roles`. */
export async function requireRoles(roles: AdminRole[]): Promise<Profile> {
  const profile = await currentProfile();
  if (!profile || profile.suspended) {
    throw new Error("forbidden: sign in with an admin account");
  }
  if (!roles.includes(profile.role)) {
    throw new Error(`forbidden: requires ${roles.join(" or ")}`);
  }
  return profile;
}

/** True when `actor` may assign/manage `target` (owners manage everyone). */
export function canManage(actor: AdminRole, target: AdminRole): boolean {
  return RANK[actor] > RANK[target] || actor === "owner";
}
