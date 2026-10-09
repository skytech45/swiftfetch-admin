import Link from "next/link";
import { redirect } from "next/navigation";
import { currentProfile } from "@/lib/roles";
import { SignOutButton } from "./signout-button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await currentProfile();
  if (!profile) redirect("/login");
  if (profile.suspended) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
        <p className="text-zinc-200">This account is suspended. Contact an owner.</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="flex items-center gap-6 border-b border-zinc-800 px-6 py-3">
        <span className="font-semibold">SwiftFetch Admin</span>
        <nav className="flex gap-4 text-sm text-zinc-400">
          <Link href="/dashboard" className="hover:text-zinc-100">
            Overview
          </Link>
          <Link href="/dashboard/users" className="hover:text-zinc-100">
            Users
          </Link>
          <Link href="/dashboard/app-users" className="hover:text-zinc-100">
            App users
          </Link>
          <Link href="/dashboard/audit" className="hover:text-zinc-100">
            Audit log
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm text-zinc-400">
          <span>
            {profile.email} · {profile.role}
          </span>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
