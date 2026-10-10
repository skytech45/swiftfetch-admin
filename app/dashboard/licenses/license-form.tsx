"use client";

import { useState, useTransition } from "react";
import { createLicense } from "./actions";

export function LicenseForm() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function submit(form: FormData) {
    setMessage(null);
    startTransition(() => {
      void createLicense(String(form.get("note") ?? "")).then((result) => {
        if (result.error) setMessage(result.error);
        else setMessage(`Minted: ${result.key}`);
      });
    });
  }

  return (
    <form
      action={submit}
      className="mt-4 flex items-end gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
    >
      <label className="flex-1 text-sm text-zinc-300">
        Note (who is this key for?)
        <input
          name="note"
          placeholder="e.g. launch partner"
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-600 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        Mint key
      </button>
      {message !== null && <span className="text-sm text-zinc-300">{message}</span>}
    </form>
  );
}
