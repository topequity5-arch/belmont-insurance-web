"use client";
import { useCallback, useEffect, useState } from "react";
import { API_URL } from "./brand";
import { getAccessToken } from "./session";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

async function request(path: string, method: string, body?: BodyInit, contentType?: string) {
  const anonymous = ["/auth/login", "/auth/register", "/auth/verify"].some((route) => path.startsWith(route));
  const token = anonymous ? null : await getAccessToken();
  const headers = new Headers();
  if (contentType) headers.set("Content-Type", contentType);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${API_URL}/v1${path}`, { method, headers, body });
}

async function parseError(response: Response): Promise<ApiError> {
  const json = await response.json().catch(() => null);
  const detail = json?.error?.message ?? (Array.isArray(json?.detail)
    ? json.detail.map((d: { msg: string; loc: string[] }) => `${d.loc.slice(1).join(".")}: ${d.msg}`).join("; ")
    : null);
  return new ApiError(response.status, json?.error?.code ?? "error", detail ?? "Something went wrong. Try again.");
}

export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = opts.method ?? (opts.body !== undefined ? "POST" : "GET");
  const res = await request(path, method, opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    opts.body !== undefined ? "application/json" : undefined);
  if (res.status === 204) return undefined as T;
  if (!res.ok) throw await parseError(res);
  return await res.json() as T;
}

/** Minimal data hook: loads on mount / when `path` changes; call `reload()` after mutations. */
export function useQuery<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!path) return;
    try { setError(null); setData(await api<T>(path)); } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }, [path]);
  useEffect(() => { setLoading(true); load(); }, [load]);
  return { data, error, loading, reload: load };
}

export async function apiUpload<T>(path: string, file: File): Promise<T> {
  const query = `?file_name=${encodeURIComponent(file.name)}`;
  const res = await request(`${path}${query}`, "POST", file, file.type || "application/octet-stream");
  if (!res.ok) throw await parseError(res);
  return await res.json() as T;
}

export async function apiDownload(path: string, fileName: string) {
  const res = await request(path, "GET");
  if (!res.ok) throw await parseError(res);
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
