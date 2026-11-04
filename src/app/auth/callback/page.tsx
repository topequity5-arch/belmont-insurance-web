"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { api } from "@/lib/api";
import { AuthSessionResponse, saveSession } from "@/lib/session";
import { Spinner } from "@/components/ui";

function Callback() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    if (accessToken && refreshToken) {
      saveSession({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: Number(hash.get("expires_at")) || undefined,
        expires_in: Number(hash.get("expires_in")) || undefined,
      });
      router.replace("/portal");
      return;
    }

    const tokenHash = params.get("token_hash");
    const type = params.get("type");
    if (!tokenHash || !type) {
      setError(true);
      return;
    }
    api<AuthSessionResponse>("/auth/verify", { body: { token_hash: tokenHash, type } })
      .then((session) => {
        if (!saveSession(session)) throw new Error("The server did not create a session.");
        router.replace("/portal");
      })
      .catch(() => setError(true));
  }, [params, router]);

  return error
    ? <p className="rounded-2xl bg-white p-6 text-center">That confirmation link has expired. <Link className="font-semibold text-brand-d" href="/register">Sign up again</Link> or <Link className="font-semibold text-brand-d" href="/login">sign in</Link>.</p>
    : <div className="rounded-2xl bg-white p-6"><Spinner /></div>;
}

export default function AuthCallback() {
  return (
    <main className="mx-auto grid min-h-screen max-w-md content-center gap-6 p-6">
      <Link href="/" className="mx-auto"><Logo /></Link>
      <Suspense fallback={<Spinner />}><Callback /></Suspense>
    </main>
  );
}
