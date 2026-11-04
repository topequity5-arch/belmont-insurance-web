"use client";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Me } from "@/lib/types";
import { ErrorNote, Spinner } from "./ui";

export function RequirePermission({ perm, children }: { perm: string; children: ReactNode }) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api<Me>("/me").then((m) => {
      if (!active) return;
      setMe(m);
      setLoading(false);
    }).catch((cause: unknown) => {
      if (!active) return;
      setError(cause instanceof Error ? cause.message : "Unable to verify permissions.");
      setLoading(false);
    });
    return () => { active = false; };
  }, [router]);

  if (loading) return <main className="grid min-h-screen place-items-center"><Spinner /></main>;
  if (error) return <main className="mx-auto max-w-xl p-8"><ErrorNote message={error} /></main>;
  if (!me) return <main className="grid min-h-screen place-items-center"><Spinner /></main>;

  const perms = new Set(me.permissions);
  const allowed = perms.has("*") || perms.has(perm);
  if (!allowed) {
    router.replace(me.role === "client" ? "/portal" : "/portal");
    return null;
  }
  return <>{children}</>;
}
