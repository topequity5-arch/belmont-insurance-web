"use client";
import { RequirePermission } from "@/components/RequirePermission";
import { useState } from "react";
import { Badge, PageHeader, Spinner, Table, Td, Tabs } from "@/components/ui";
import { useQuery } from "@/lib/api";
import { date, usd } from "@/lib/format";
import type { Invoice, Page, Subscription } from "@/lib/types";

export default function Subs() {
  return <RequirePermission perm="subscriptions:read"><SubsContent /></RequirePermission>;
}

function SubsContent() {
  const [tab, setTab] = useState<"policies" | "invoices">("policies");
  const s = useQuery<Page<Subscription>>(tab === "policies" ? "/admin/subscriptions?limit=100" : null);
  const i = useQuery<Page<Invoice>>(tab === "invoices" ? "/admin/invoices?limit=100" : null);
  return (
    <>
      <PageHeader title="Policies and invoices" action={<Tabs value={tab} onChange={setTab} options={[{ value: "policies", label: "Policies" }, { value: "invoices", label: "Invoices" }]} />} />
      {tab === "policies" ? (s.loading ? <Spinner /> : (
        <Table head={["Policy", "Client", "Plan", "Premium", "Period ends", "Status"]}>{(s.data?.items ?? []).map((x) => (
          <tr key={x.id}><Td className="font-semibold">{x.policy_number}</Td><Td>{x.user_email}</Td><Td>{x.plan.name}</Td><Td>{usd(x.premium_usd)} / {x.billing_interval === "yearly" ? "yr" : "mo"}</Td><Td>{date(x.current_period_end)}</Td><Td><Badge status={x.status} /></Td></tr>))}</Table>
      )) : (i.loading ? <Spinner /> : (
        <Table head={["Invoice", "Description", "Amount", "Due", "Status"]}>{(i.data?.items ?? []).map((x) => (
          <tr key={x.id}><Td className="font-semibold">{x.number}</Td><Td>{x.description}</Td><Td>{usd(x.amount_usd)}</Td><Td>{date(x.due_date)}</Td><Td><Badge status={x.status} /></Td></tr>))}</Table>
      ))}
    </>
  );
}
