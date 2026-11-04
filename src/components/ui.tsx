"use client";
import { ReactNode, useState } from "react";
import { label } from "@/lib/format";

export function Button({ variant = "primary", className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "soft" }) {
  const v = {
    primary: "bg-brand text-white hover:bg-brand-d",
    ghost: "border border-line bg-white text-ink hover:border-ink",
    soft: "bg-mist text-ink hover:bg-line",
    danger: "bg-bad text-white hover:opacity-90",
  }[variant];
  return <button {...p} className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${v} ${className}`} />;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-white p-5 ${className}`}>{children}</section>;
}

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-3xl font-extrabold">{title}</h1>{sub && <p className="mt-1 max-w-prose text-ink2">{sub}</p>}</div>
      {action}
    </div>
  );
}

const TONES: Record<string, string> = {
  active: "ok", paid: "ok", confirmed: "ok", approved: "ok", matured: "ok", verified: "ok", withdrawn: "ok",
  submitted: "info", under_review: "info", pending_verification: "info", withdrawal_requested: "info", pending: "info",
  pending_payment: "warn", open: "warn", info_requested: "warn", past_due: "warn", pending_funding: "warn",
  rejected: "bad", expired: "bad", void: "bad", cancelled: "bad", suspended: "bad",
};
export function Badge({ status }: { status: string }) {
  const tone = TONES[status] ?? "neutral";
  const cls = { ok: "bg-ok/12 text-ok", info: "bg-brand/12 text-brand-d", warn: "bg-warn/15 text-warn", bad: "bg-bad/12 text-bad", neutral: "bg-mist text-ink2" }[tone];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label(status)}</span>;
}

export function Spinner() { return <div className="p-8 text-center text-sm text-ink2" role="status">Loading…</div>; }
export function ErrorNote({ message }: { message: string | null }) {
  return message ? <p role="alert" className="rounded-xl bg-bad/10 px-4 py-3 text-sm text-bad">{message}</p> : null;
}
export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-line p-10 text-center"><p className="font-display text-lg font-bold">{title}</p><div className="mt-1 text-sm text-ink2">{children}</div></div>;
}

export function Field({ label: l, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="block text-sm"><span className="mb-1 block font-semibold">{l}</span>{children}{hint && <span className="mt-1 block text-xs text-ink2">{hint}</span>}</label>;
}
const input = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand";
export const Input = (p: React.InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={`${input} ${p.className ?? ""}`} />;
export const Textarea = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea rows={4} {...p} className={`${input} ${p.className ?? ""}`} />;
export const Select = (p: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={`${input} ${p.className ?? ""}`} />;

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-line bg-mist/60 text-xs text-ink2"><tr>{head.map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}
export const Td = ({ children, className = "" }: { children?: ReactNode; className?: string }) => <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;

export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div role="tablist" className="inline-flex flex-wrap gap-1 rounded-2xl bg-mist p-1">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${value === o.value ? "bg-white shadow-sm" : "text-ink2 hover:text-ink"}`}>{o.label}</button>
      ))}
    </div>
  );
}

/** Wraps an async action with pending + error state. */
export function useAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    setPending(true); setError(null);
    try { return await fn(); } catch (e) { setError((e as Error).message); } finally { setPending(false); }
  }
  return { pending, error, run, setError };
}

export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return <button type="button" className="rounded-lg bg-mist px-2 py-1 text-xs font-semibold hover:bg-line" onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }}>{done ? "Copied" : "Copy"}</button>;
}
