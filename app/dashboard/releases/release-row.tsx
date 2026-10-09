"use client";

import { useState, useTransition } from "react";
import { deleteRelease, setPublished } from "./actions";

interface Release {
  id: string;
  version: string;
  channel: string;
  min_required: string;
  published: boolean;
}

export function ReleaseRow({ release }: { release: Release }) {
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
      <td className="px-4 py-2 font-mono">{release.version}</td>
      <td className="px-4 py-2">{release.channel}</td>
      <td className="px-4 py-2 font-mono">{release.min_required}</td>
      <td className="px-4 py-2">{release.published ? "live" : "draft"}</td>
      <td className="px-4 py-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(setPublished(release.id, !release.published))}
          className="rounded-md border border-zinc-700 px-2 py-1 hover:bg-zinc-800"
        >
          {release.published ? "Unpublish" : "Publish"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(deleteRelease(release.id))}
          className="ml-2 rounded-md border border-zinc-700 px-2 py-1 hover:bg-zinc-800"
        >
          Delete
        </button>
        {message !== null && <span className="ml-2 text-red-400">{message}</span>}
      </td>
    </tr>
  );
}
