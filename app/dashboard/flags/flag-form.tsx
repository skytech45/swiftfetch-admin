"use client";

import { useState, useTransition } from "react";
import { setFlag } from "./actions";

export function FlagForm() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function submit(form: FormData) {
    setMessage(null);
    startTransition(() => {
      void setFlag(
        String(form.get("key") ?? ""),
        String(form.get("value") ?? "null"),
        Number(form.get("rollout") ?? 100),
      ).then((result) => {
        if (result.error) setMessage(result.error);
        else setMessage("Flag saved.");
      });
    });
  }

  return (
    <form
      action={submit}
      className="mt-4 grid grid-cols-3 gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
    >
      <label className="text-sm text-zinc-300">
        Key
        <input
          name="key"
          required
          placeholder="announcement.banner"
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2"
        />
      </label>
      <label className="text-sm text-zinc-300">
        Value (JSON)
        <input
          name="value"
          placeholder='"Hello!"'
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-xs"
        />
      </label>
      <label className="text-sm text-zinc-300">
        Rollout %
        <input
          name="rollout"
          type="number"
          min={0}
          max={100}
          defaultValue={100}
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2"
        />
      </label>
      <div className="col-span-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-emerald-600 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          Save flag
        </button>
        {message !== null && <span className="ml-3 text-sm text-zinc-300">{message}</span>}
      </div>
    </form>
  );
}
