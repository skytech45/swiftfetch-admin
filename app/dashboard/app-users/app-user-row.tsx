"use client";

import { useState, useTransition } from "react";
import { revokeDevice, setAppUserStatus, setTier } from "./actions";

interface Device {
  id: string;
  device_id: string;
  label: string | null;
  last_seen: string;
}

interface AppUser {
  id: string;
  email: string;
  tier: string;
  status: string;
}

export function AppUserRow({ user, devices }: { user: AppUser; devices: Device[] }) {
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
    <tr className="border-t border-zinc-800 align-top">
      <td className="px-4 py-2">{user.email}</td>
      <td className="px-4 py-2">
        <select
          defaultValue={user.tier}
          disabled={pending}
          onChange={(e) => run(setTier(user.id, e.target.value as "free" | "pro"))}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1"
        >
          <option value="free">free</option>
          <option value="pro">pro</option>
        </select>
      </td>
      <td className="px-4 py-2">{user.status}</td>
      <td className="px-4 py-2">
        {devices.length === 0 ? (
          <span className="text-zinc-500">—</span>
        ) : (
          <ul className="space-y-1">
            {devices.map((device) => (
              <li key={device.id} className="flex items-center gap-2 font-mono text-xs">
                <span title={device.device_id}>
                  {(device.label || device.device_id).slice(0, 24)}
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(revokeDevice(device.id, user.id))}
                  className="rounded border border-zinc-700 px-1 hover:bg-zinc-800"
                >
                  revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </td>
      <td className="px-4 py-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(setAppUserStatus(user.id, user.status === "suspended" ? "active" : "suspended"))
          }
          className="rounded-md border border-zinc-700 px-2 py-1 hover:bg-zinc-800"
        >
          {user.status === "suspended" ? "Unsuspend" : "Suspend"}
        </button>
        {message !== null && <span className="ml-2 text-red-400">{message}</span>}
      </td>
    </tr>
  );
}
