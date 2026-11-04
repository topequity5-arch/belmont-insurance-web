"use client";
import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Card, Empty, ErrorNote, Field, Input, PageHeader, Select, Spinner, useAction } from "@/components/ui";
import { api, useQuery } from "@/lib/api";
import { date, pct, usd } from "@/lib/format";
import type { Position } from "@/lib/types";

function Withdraw({ id, onDone }: { id: string; onDone: () => void }) {
  const { pending, error, run } = useAction();
  const [m, setM] = useState("bank"); const [a, setA] = useState(""); const [b, setB] = useState(""); const [c, setC] = useState("");
  return (
    <form className="mt-4 space-y-3 border-t border-line pt-4" onSubmit={(e) => { e.preventDefault(); run(async () => {
      await api(`/investments/${id}/withdraw`, { body: { payout_method: m, payout_details: m === "bank" ? { bank_name: a, account_name: b, account_number: c } : { asset: a, network: b, address: c } } }); onDone(); }); }}>
      <p className="text-sm font-semibold">Where should we send your payout?</p>
      <Select value={m} onChange={(e) => { setM(e.target.value); setA(""); setB(""); setC(""); }}><option value="bank">Bank account (USD)</option><option value="crypto">Crypto wallet</option></Select>
      <Field label={m === "bank" ? "Bank name" : "Asset"}><Input required value={a} onChange={(e) => setA(e.target.value)} /></Field>
      <Field label={m === "bank" ? "Account name" : "Network"}><Input required value={b} onChange={(e) => setB(e.target.value)} /></Field>
      <Field label={m === "bank" ? "Account number" : "Wallet address"}><Input required value={c} onChange={(e) => setC(e.target.value)} /></Field>
      <ErrorNote message={error} /><Button disabled={pending}>Request withdrawal</Button>
    </form>
  );
}

export default function Investments() {
  const { data, loading, reload } = useQuery<Position[]>("/investments");
  if (loading) return <Spinner />;
  return (
    <>
      <PageHeader title="Investments" sub="Returns accrue monthly. Principal and returns are paid out after maturity." action={<Link href="/portal/plans" className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white">New investment</Link>} />
      {(data ?? []).length === 0 ? <Empty title="No investments yet">Choose a growth plan to start earning.</Empty> : (
        <div className="grid gap-4 md:grid-cols-2">
          {data!.map((p) => (
            <Card key={p.id}>
              <div className="flex items-start justify-between"><div><h2 className="font-display text-xl font-bold">{p.plan.name}</h2><p className="text-sm text-ink2">{p.reference}</p></div><Badge status={p.status} /></div>
              <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-ink2">Principal</dt><dd>{usd(p.principal_usd)}</dd><dt className="text-ink2">Rate</dt><dd>{pct(p.annual_rate_bps)} a year</dd>
                <dt className="text-ink2">Earned so far</dt><dd className="font-semibold text-ok">{usd(p.accrued_usd)}</dd><dt className="text-ink2">Term</dt><dd>{p.term_months} months</dd>
                <dt className="text-ink2">Matures</dt><dd>{date(p.maturity_date)}</dd>
              </dl>
              {p.status === "pending_funding" && <p className="mt-3 text-sm text-warn">Waiting for your deposit. <Link className="font-semibold underline" href="/portal/billing">Go to billing</Link></p>}
              {p.status === "matured" && <Withdraw id={p.id} onDone={reload} />}
              {p.status === "withdrawal_requested" && <p className="mt-3 text-sm">Withdrawal requested. We will send {usd(Number(p.principal_usd) + Number(p.accrued_usd))} shortly.</p>}
              {p.payout_reference && <p className="mt-3 text-sm">Paid on reference <b>{p.payout_reference}</b></p>}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
