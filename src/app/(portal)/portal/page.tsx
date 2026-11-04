"use client";
import Link from "next/link";
import { Badge, Card, Empty, PageHeader, Spinner } from "@/components/ui";
import { useQuery } from "@/lib/api";
import { date, usd } from "@/lib/format";
import type { Claim, Invoice, Me, Position, Subscription } from "@/lib/types";

export default function Overview() {
  const me = useQuery<Me>("/me");
  const subs = useQuery<Subscription[]>("/subscriptions");
  const inv = useQuery<Invoice[]>("/invoices?status=open");
  const claims = useQuery<Claim[]>("/claims");
  const pos = useQuery<Position[]>("/investments");
  if (subs.loading || inv.loading) return <Spinner />;
  const active = (subs.data ?? []).filter((s) => s.status === "active");
  const open = inv.data ?? [];
  const invested = (pos.data ?? []).filter((p) => ["active", "matured"].includes(p.status));
  return (
    <>
      <PageHeader title={`Welcome${me.data?.full_name ? `, ${me.data.full_name.split(" ")[0]}` : ""}`} sub="Your cover, claims and savings at a glance." />
      {open.length > 0 && (
        <Card className="mb-6 border-warn/40 bg-warn/5">
          <h2 className="text-lg font-bold">{open.length === 1 ? "1 invoice is waiting for payment" : `${open.length} invoices are waiting for payment`}</h2>
          <div className="mt-3 space-y-2">
            {open.map((i) => (
              <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>{i.description} · due {date(i.due_date)}</span>
                <Link className="rounded-full bg-brand px-4 py-1.5 font-semibold text-white" href={`/portal/billing/pay/${i.id}`}>Pay {usd(i.amount_usd)}</Link>
              </div>
            ))}
          </div>
        </Card>
      )}
      <div className="grid gap-5 md:grid-cols-3">
        <Card><p className="text-sm text-ink2">Active policies</p><p className="font-display text-4xl font-extrabold">{active.length}</p><Link className="text-sm font-semibold text-brand-d" href="/portal/policies">View policies</Link></Card>
        <Card><p className="text-sm text-ink2">Open claims</p><p className="font-display text-4xl font-extrabold">{(claims.data ?? []).filter((c) => !["paid", "rejected"].includes(c.status)).length}</p><Link className="text-sm font-semibold text-brand-d" href="/portal/claims">View claims</Link></Card>
        <Card><p className="text-sm text-ink2">Invested</p><p className="font-display text-4xl font-extrabold">{usd(invested.reduce((a, p) => a + Number(p.principal_usd) + Number(p.accrued_usd), 0))}</p><Link className="text-sm font-semibold text-brand-d" href="/portal/investments">View investments</Link></Card>
      </div>
      <h2 className="mb-3 mt-10 text-2xl font-extrabold">Your cover</h2>
      {active.length === 0 ? <Empty title="No active cover yet"><Link className="font-semibold text-brand-d" href="/portal/plans">Browse plans</Link> to get started.</Empty> : (
        <div className="grid gap-4 md:grid-cols-2">
          {active.map((s) => (
            <Card key={s.id}><div className="flex items-start justify-between"><div><p className="font-display text-xl font-bold">{s.plan.name}</p><p className="text-sm text-ink2">{s.policy_number}</p></div><Badge status={s.status} /></div>
              <p className="mt-3 text-sm text-ink2">Covered up to {usd(s.coverage_usd)} · renews {date(s.current_period_end)}</p></Card>
          ))}
        </div>
      )}
    </>
  );
}
