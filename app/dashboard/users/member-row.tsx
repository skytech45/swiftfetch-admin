"use client";

import { useState, useTransition } from "react";
import type { Profile, AdminRole } from "@/lib/roles";
import { setRole, setSuspended } from "./actions";

const ROLES: AdminRole[] = ["owner", "admin", "finance", "support", "viewer"];

export function MemberRow({ member }: { member: Profile }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run(promise: Promise<{ error?: string }>) {
    setMessage(null);
    startTransition(() => {
      void promise.then((result) => {
        if (result.error) setMessage(result.error);
      });
    });
  }

  return (
    <tr className="border-t border-zinc-800">
      <td className="px-4 py-2">{member.email}</td>
      <td className="px-4 py-2">
        <select
          defaultValue={member.role}
          disabled={pending}
          onChange={(e) => run(setRole(member.id, e.target.value as AdminRole))}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1"
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-2">{member.suspended ? "suspended" : "active"}</td>
      <td className="px-4 py-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(setSuspended(member.id, !member.suspended))}
          className="rounded-md border border-zinc-700 px-2 py-1 hover:bg-zinc-800"
        >
          {member.suspended ? "Unsuspend" : "Suspend"}
        </button>
        {message !== null && <span className="ml-2 text-red-400">{message}</span>}
      </td>
    </tr>
  );
}
