"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, ErrorNote, Field, Input, PageHeader, Select, Spinner, Textarea, useAction } from "@/components/ui";
import { api, useQuery } from "@/lib/api";
import { usd } from "@/lib/format";
import type { Claim, Subscription } from "@/lib/types";

export default function NewClaim() {
  const router = useRouter();
  const subs = useQuery<Subscription[]>("/subscriptions");
  const { pending, error, run } = useAction();
  const active = (subs.data ?? []).filter((s) => s.status === "active" && s.coverage_usd);
  const [f, setF] = useState({ subscription_id: "", title: "", description: "", incident_date: "", amount: "" });
  if (subs.loading) return <Spinner />;
  if (active.length === 0) return <Card>You need an active policy to file a claim. <Link className="font-semibold text-brand-d" href="/portal/plans">Browse plans</Link></Card>;
  const chosen = active.find((s) => s.id === (f.subscription_id || active[0].id))!;
  return (
    <>
      <PageHeader title="File a claim" sub="Tell us what happened. You can add photos and documents on the next screen." />
      <form className="max-w-2xl space-y-4" onSubmit={(e) => { e.preventDefault(); run(async () => {
        const c = await api<Claim>("/claims", { body: { subscription_id: chosen.id, title: f.title, description: f.description, incident_date: f.incident_date, amount_claimed_usd: f.amount } });
        router.push(`/portal/claims/${c.id}`);
      }); }}>
        <Field label="Policy"><Select value={chosen.id} onChange={(e) => setF({ ...f, subscription_id: e.target.value })}>{active.map((s) => <option key={s.id} value={s.id}>{s.plan.name} · {s.policy_number}</option>)}</Select></Field>
        <Field label="What happened? (short title)"><Input required minLength={3} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Details"><Textarea required minLength={10} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date of incident"><Input type="date" required max={new Date().toISOString().slice(0, 10)} value={f.incident_date} onChange={(e) => setF({ ...f, incident_date: e.target.value })} /></Field>
          <Field label="Amount you are claiming (USD)" hint={`Your cover limit is ${usd(chosen.coverage_usd)}.`}><Input type="number" required min="0.01" step="0.01" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
        </div>
        <ErrorNote message={error} />
        <Button disabled={pending}>Submit claim</Button>
      </form>
    </>
  );
}
