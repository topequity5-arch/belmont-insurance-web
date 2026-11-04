"use client";
import Link from "next/link";
import { Card, ErrorNote, PageHeader, Spinner } from "@/components/ui";
import { RequirePermission } from "@/components/RequirePermission";
import { useQuery } from "@/lib/api";
import { usd } from "@/lib/format";
import type { Stats } from "@/lib/types";

export default function Dashboard() {
  return <RequirePermission perm="stats:read"><DashboardContent /></RequirePermission>;
}

function DashboardContent() {
  const { data: s, loading, error } = useQuery<Stats>("/admin/stats");
  if (loading) return <Spinner />;
  if (!s) return <ErrorNote message={error} />;
  const queue = [
    { n: s.payments_awaiting_review, t: "Payments to verify", href: "/admin/payments" },
    { n: s.open_claims, t: "Open claims", href: "/admin/claims" },
    { n: s.claims_awaiting_payout, t: "Approved claims to pay out", href: "/admin/claims" },
  ];
  return (
    <>
      <PageHeader title="Dashboard" sub="What needs attention, and how the book looks today." />
      <div className="grid gap-4 md:grid-cols-3">
        {queue.map((q) => (
          <Link key={q.t} href={q.href}><Card className={`transition-colors hover:border-brand ${q.n > 0 ? "border-warn/50" : ""}`}><p className="font-display text-5xl font-extrabold">{q.n}</p><p className="mt-1 text-sm text-ink2">{q.t}</p></Card></Link>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Card><p className="text-sm text-ink2">Clients</p><p className="font-display text-3xl font-extrabold">{s.clients}</p></Card>
        <Card><p className="text-sm text-ink2">Active policies</p><p className="font-display text-3xl font-extrabold">{s.active_policies}</p></Card>
        <Card><p className="text-sm text-ink2">Confirmed revenue</p><p className="font-display text-3xl font-extrabold">{usd(s.revenue_confirmed_usd)}</p></Card>
        <Card><p className="text-sm text-ink2">Investment principal</p><p className="font-display text-3xl font-extrabold">{usd(s.investment_principal_usd)}</p></Card>
      </div>
    </>
  );
}
