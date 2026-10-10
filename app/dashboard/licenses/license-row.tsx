"use client";

import { useState, useTransition } from "react";
import { deleteLicense, setLicenseStatus } from "./actions";

interface License {
  id: string;
  key: string;
  status: string;
  claimed_by: string | null;
  note: string;
}

export function LicenseRow({ license }: { license: License }) {
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
      <td className="px-4 py-2 font-mono text-xs">{license.key}</td>
      <td className="px-4 py-2">{license.status}</td>
      <td className="px-4 py-2 font-mono text-xs">
        {license.claimed_by ? license.claimed_by.slice(0, 8) : "—"}
      </td>
      <td className="px-4 py-2">{license.note || "—"}</td>
      <td className="px-4 py-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(setLicenseStatus(license.id, license.status === "revoked" ? "active" : "revoked"))
          }
          className="rounded-md border border-zinc-700 px-2 py-1 hover:bg-zinc-800"
        >
          {license.status === "revoked" ? "Restore" : "Revoke"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(deleteLicense(license.id))}
          className="ml-2 rounded-md border border-zinc-700 px-2 py-1 hover:bg-zinc-800"
        >
          Delete
        </button>
        {message !== null && <span className="ml-2 text-red-400">{message}</span>}
      </td>
    </tr>
  );
}
