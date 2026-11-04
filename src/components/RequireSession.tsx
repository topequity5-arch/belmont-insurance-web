"use client";
import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import { Me } from "@/lib/types";
import { ErrorNote, Spinner } from "./ui";

export function RequireSession({ area, children }: { area: "client" | "admin"; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api<Me>("/me").then((me) => {
      if (!active) return;
      if (area === "admin" && me.role === "client") {
        router.replace("/portal");
        return;
      }
      setLoading(false);
    }).catch((cause: unknown) => {
      if (!active) return;
      if (cause instanceof ApiError && cause.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      setError(cause instanceof Error ? cause.message : "Unable to verify your session.");
      setLoading(false);
    });
    return () => { active = false; };
  }, [area, pathname, router]);

  if (loading) return <main className="grid min-h-screen place-items-center"><Spinner /></main>;
  if (error) return <main className="mx-auto max-w-xl p-8"><ErrorNote message={error} /></main>;
  return children;
}
