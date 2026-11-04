"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, ErrorNote, Input, PageHeader, Spinner, Tabs, useAction } from "@/components/ui";
import { api, useQuery } from "@/lib/api";
import { pct, usd } from "@/lib/format";
import type { Invoice, Plan } from "@/lib/types";

const CATS = [["all", "All"], ["auto", "Auto"], ["home", "Home"], ["health", "Health"], ["life", "Life"], ["investment", "Investments"]] as const;

function PlanCard({ plan, interval }: { plan: Plan; interval: "monthly" | "yearly" }) {
  const router = useRouter();
  const { pending, error, run } = useAction();
  const [principal, setPrincipal] = useState(plan.min_principal_usd ?? "");
  const isInv = plan.product.category === "investment";
  const price = interval === "yearly" ? plan.price_yearly_usd : plan.price_monthly_usd;
  async function buy() {
    await run(async () => {
      const r = isInv
        ? await api<{ invoice: Invoice }>("/investments", { body: { plan_id: plan.id, principal_usd: principal } })
        : await api<{ invoice: Invoice }>("/subscriptions", { body: { plan_id: plan.id, billing_interval: interval } });
      router.push(`/portal/billing/pay/${r.invoice.id}`);
    });
  }
  return (
    <Card className={plan.highlighted ? "border-brand ring-2 ring-brand/20" : ""}>
      <p className="text-sm font-semibold text-ink2">{plan.product.name}</p>
      <h3 className="text-2xl font-extrabold">{plan.name}</h3>
      <p className="mt-1 text-sm text-ink2">{plan.tagline}</p>
      {isInv ? (
        <>
          <p className="mt-4 font-display text-4xl font-extrabold">{pct(plan.annual_rate_bps)}<span className="text-base font-medium text-ink2"> a year</span></p>
          <p className="text-sm text-ink2">{plan.term_months}-month term · minimum {usd(plan.min_principal_usd)}</p>
          <label className="mt-4 block text-sm font-semibold">Amount to invest (USD)<Input type="number" min={Number(plan.min_principal_usd)} step="0.01" value={principal} onChange={(e) => setPrincipal(e.target.value)} className="mt-1" /></label>
        </>
      ) : price ? (
        <>
          <p className="mt-4 font-display text-4xl font-extrabold">{usd(price)}<span className="text-base font-medium text-ink2"> / {interval === "yearly" ? "year" : "month"}</span></p>
          <p className="text-sm text-ink2">Covered up to {usd(plan.coverage_usd)} · {usd(plan.deductible_usd)} deductible</p>
        </>
      ) : <p className="mt-4 text-sm text-ink2">Not available with {interval} billing.</p>}
      <ul className="mt-4 space-y-1.5 text-sm">{plan.features.map((f) => <li key={f}>✓ {f}</li>)}</ul>
      <div className="mt-5 space-y-2"><ErrorNote message={error} /><Button className="w-full" disabled={pending || (!isInv && !price)} onClick={buy}>{isInv ? "Invest" : `Subscribe to ${plan.name}`}</Button></div>
    </Card>
  );
}

export default function Plans() {
  const [cat, setCat] = useState<string>("all");
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const { data, loading, error } = useQuery<Plan[]>("/catalog/plans");
  const plans = (data ?? []).filter((p) => cat === "all" || p.product.category === cat);
  return (
    <>
      <PageHeader title="Plans" sub="Choose a plan and we will create your first invoice. Cover starts when your payment is confirmed." />
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Tabs value={cat} onChange={setCat} options={CATS.map(([v, l]) => ({ value: v, label: l }))} />
        {cat !== "investment" && <Tabs value={interval} onChange={setInterval} options={[{ value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly" }]} />}
      </div>
      {loading && <Spinner />}<ErrorNote message={error} />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{plans.map((p) => <PlanCard key={p.id} plan={p} interval={interval} />)}</div>
    </>
  );
}
