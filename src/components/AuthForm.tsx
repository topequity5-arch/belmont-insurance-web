"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Logo } from "./Logo";
import { Button, ErrorNote, Field, Input, useAction } from "./ui";
import { api } from "@/lib/api";
import { AuthSessionResponse, saveSession } from "@/lib/session";

function Form({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const { pending, error, run } = useAction();
  const [sent, setSent] = useState(false);
  const [f, setF] = useState({ email: "", password: "", name: "" });
  const next = params.get("next") ?? "/portal";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await run(async () => {
      if (mode === "login") {
        const session = await api<AuthSessionResponse>("/auth/login", { body: { email: f.email, password: f.password } });
        if (!saveSession(session)) throw new Error("The server did not create a session. Please try again.");
        router.push(next.startsWith("/") ? next : "/portal");
        router.refresh();
      } else {
        const session = await api<Partial<AuthSessionResponse>>("/auth/register", {
          body: {
            email: f.email,
            password: f.password,
            full_name: f.name,
            redirect_to: `${window.location.origin}/auth/callback`,
          },
        });
        if (saveSession(session)) { router.push("/portal"); router.refresh(); } else setSent(true);
      }
    });
  }
  if (sent) return <p className="rounded-2xl bg-white p-6 text-center">Check <b>{f.email}</b> for a confirmation link, then sign in.</p>;
  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-white p-6">
      <h1 className="text-2xl font-extrabold">{mode === "login" ? "Sign in" : "Create your account"}</h1>
      {params.get("error") && <ErrorNote message="That confirmation link has expired. Sign up again or sign in." />}
      {mode === "register" && <Field label="Full name"><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" /></Field>}
      <Field label="Email"><Input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" /></Field>
      <Field label="Password" hint={mode === "register" ? "At least 8 characters." : undefined}>
        <Input type="password" required minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete={mode === "login" ? "current-password" : "new-password"} />
      </Field>
      <ErrorNote message={error} />
      <Button disabled={pending} className="w-full">{mode === "login" ? "Sign in" : "Create account"}</Button>
      <p className="text-center text-sm text-ink2">
        {mode === "login" ? <>New here? <Link className="font-semibold text-brand-d" href="/register">Create an account</Link></> : <>Already registered? <Link className="font-semibold text-brand-d" href="/login">Sign in</Link></>}
      </p>
    </form>
  );
}

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  return (
    <main className="mx-auto grid min-h-screen max-w-md content-center gap-6 p-6">
      <Link href="/" className="mx-auto"><Logo /></Link>
      <Suspense><Form mode={mode} /></Suspense>
    </main>
  );
}
