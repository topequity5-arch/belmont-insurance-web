"use client";
import { useState } from "react";
import { apiDownload } from "@/lib/api";
import { ErrorNote } from "./ui";

export function FileDownload({ path, name }: { path: string; name: string }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function download() {
    setError(null);
    setLoading(true);
    try {
      await apiDownload(path, name);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to download this file.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span>
      <button type="button" className="text-brand-d underline disabled:opacity-60" onClick={download} disabled={loading}>
        {loading ? "Downloading…" : name}
      </button>
      {error && <span className="block"><ErrorNote message={error} /></span>}
    </span>
  );
}
