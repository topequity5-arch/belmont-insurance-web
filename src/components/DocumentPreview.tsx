"use client";
import { useEffect, useState } from "react";
import { apiBlob } from "@/lib/api";
import { ErrorNote } from "./ui";

export function DocumentPreview({ path, name, contentType }: {
  path: string;
  name: string;
  contentType?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  async function view() {
    setError(null);
    setLoading(true);
    try {
      const blob = await apiBlob(path);
      const type = (contentType || blob.type).split(";", 1)[0].trim().toLowerCase();
      if (type !== "application/pdf" && !type.startsWith("image/")) {
        throw new Error("This file cannot be previewed. Only PDFs and images are supported.");
      }
      setPreviewType(type);
      setUrl(URL.createObjectURL(blob));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to preview this file.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" className="text-brand-d underline disabled:opacity-60" onClick={view} disabled={loading}>
        {loading ? "Loading…" : "View"}
      </button>
      {error && <span className="block"><ErrorNote message={error} /></span>}
      {url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Preview ${name}`}>
          <button type="button" aria-label="Close preview" className="absolute inset-0 bg-black/60" onClick={() => setUrl(null)} />
          <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="truncate font-bold">{name}</h2>
              <button type="button" className="rounded-full px-3 py-1 text-sm font-semibold hover:bg-mist" onClick={() => setUrl(null)}>Close</button>
            </div>
            {previewType === "application/pdf"
              ? <iframe title={name} src={url} className="h-[75vh] w-full rounded-lg border border-line" />
              : <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto"><img src={url} alt={name} className="max-h-[75vh] max-w-full object-contain" /></div>}
          </div>
        </div>
      )}
    </>
  );
}
