"use client";
import Link from "next/link";
import { Badge, Button, Card, Empty, ErrorNote, PageHeader, Spinner, useAction } from "@/components/ui";
import { api, useQuery } from "@/lib/api";
import { date, usd } from "@/lib/format";
import type { Subscription } from "@/lib/types";

export default function Policies() {
  const { data, loading, reload } = useQuery<Subscription[]>("/subscriptions");
  const { pending, error, run } = useAction();
  if (loading) return <Spinner />;
  return (
    <>
      <PageHeader title="My policies" action={<Link href="/portal/plans" className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white">Add cover</Link>} />
      <ErrorNote message={error} />
      {(data ?? []).length === 0 ? <Empty title="No policies yet">Pick a plan to get covered.</Empty> : (
        <div className="grid gap-4 md:grid-cols-2">
          {data!.map((s) => (
            <Card key={s.id}>
              <div className="flex items-start justify-between"><div><h2 className="font-display text-xl font-bold">{s.plan.name}</h2><p className="text-sm text-ink2">{s.policy_number} · {s.plan.product.name}</p></div><Badge status={s.status} /></div>
              <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-ink2">Premium</dt><dd>{usd(s.premium_usd)} / {s.billing_interval === "yearly" ? "year" : "month"}</dd>
                <dt className="text-ink2">Coverage</dt><dd>{usd(s.coverage_usd)}</dd>
                <dt className="text-ink2">Deductible</dt><dd>{usd(s.deductible_usd)}</dd>
                <dt className="text-ink2">Current period</dt><dd>{date(s.current_period_start)} to {date(s.current_period_end)}</dd>
              </dl>
              {s.cancel_at_period_end && <p className="mt-3 text-sm text-warn">Cancels on {date(s.current_period_end)}. You stay covered until then.</p>}
              <div className="mt-4 flex gap-2">
                {s.status === "active" && <Link href="/portal/claims/new" className="rounded-full bg-mist px-4 py-2 text-sm font-semibold">File a claim</Link>}
                {["pending_payment", "active", "past_due"].includes(s.status) && !s.cancel_at_period_end && (
                  <Button variant="ghost" disabled={pending} onClick={() => confirm("Cancel this policy? Active cover continues to the end of the paid period.") && run(async () => { await api(`/subscriptions/${s.id}/cancel`, { method: "POST" }); reload(); })}>Cancel</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
