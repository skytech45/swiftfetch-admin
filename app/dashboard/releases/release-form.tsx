"use client";

import { useState, useTransition } from "react";
import { createRelease } from "./actions";

export function ReleaseForm() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function submit(form: FormData) {
    setMessage(null);
    startTransition(() => {
      void createRelease({
        version: String(form.get("version") ?? ""),
        channel: String(form.get("channel") ?? "stable"),
        min_required: String(form.get("min_required") ?? "0.1.0"),
        notes: String(form.get("notes") ?? ""),
        artifacts: String(form.get("artifacts") ?? ""),
        published: form.get("published") === "on",
      }).then((result) => {
        if (result.error) setMessage(result.error);
        else setMessage("Release saved.");
      });
    });
  }

  return (
    <form
      action={submit}
      className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
    >
      <label className="text-sm text-zinc-300">
        Version
        <input
          name="version"
          required
          placeholder="1.2.0"
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2"
        />
      </label>
      <label className="text-sm text-zinc-300">
        Channel
        <select name="channel" className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2">
          <option value="stable">stable</option>
          <option value="beta">beta</option>
        </select>
      </label>
      <label className="text-sm text-zinc-300">
        Min required (force-update below this)
        <input
          name="min_required"
          placeholder="0.1.0"
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2"
        />
      </label>
      <label className="flex items-end gap-2 text-sm text-zinc-300">
        <input type="checkbox" name="published" className="mb-2" /> Publish immediately
      </label>
      <label className="col-span-2 text-sm text-zinc-300">
        Release notes
        <textarea
          name="notes"
          rows={2}
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2"
        />
      </label>
      <label className="col-span-2 text-sm text-zinc-300">
        Artifacts JSON (target → url + Ed25519 signature)
        <textarea
          name="artifacts"
          rows={3}
          placeholder='{"windows-x86_64": {"url": "https://…", "signature": "…"}}'
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-xs"
        />
      </label>
      <div className="col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-emerald-600 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          Save release
        </button>
        {message !== null && <span className="ml-3 text-sm text-zinc-300">{message}</span>}
      </div>
    </form>
  );
}
