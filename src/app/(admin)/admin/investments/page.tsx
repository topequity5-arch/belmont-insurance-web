"use client";
import { RequirePermission } from "@/components/RequirePermission";
import { useState } from "react";
import { Badge, Button, ErrorNote, Input, PageHeader, Spinner, Table, Td, useAction } from "@/components/ui";
import { api, useQuery } from "@/lib/api";
import { date, pct, usd } from "@/lib/format";
import type { Page, Position } from "@/lib/types";

export default function AdminInvestments() {
  return <RequirePermission perm="investments:read"><AdminInvestmentsContent /></RequirePermission>;
}

function AdminInvestmentsContent() {
  const { data, loading, reload } = useQuery<Page<Position>>("/admin/investments?limit=100");
  const { pending, error, run } = useAction();
  const [refs, setRefs] = useState<Record<string, string>>({});
  if (loading) return <Spinner />;
  return (
    <>
      <PageHeader title="Investments" sub="Accruals and maturity run in the daily billing job. Complete withdrawals here after paying the client." />
      <ErrorNote message={error} />
      <Table head={["Reference", "Plan", "Principal", "Rate", "Accrued", "Matures", "Status", ""]}>{(data?.items ?? []).map((p) => (
        <tr key={p.id}><Td className="font-semibold">{p.reference}</Td><Td>{p.plan?.name ?? "—"}</Td><Td>{usd(p.principal_usd)}</Td><Td>{pct(p.annual_rate_bps)}</Td><Td>{usd(p.accrued_usd)}</Td><Td>{date(p.maturity_date)}</Td><Td><Badge status={p.status} /></Td>
          <Td>{p.status === "withdrawal_requested" && <div className="flex gap-2"><Input placeholder="Payout reference" value={refs[p.id] ?? ""} onChange={(e) => setRefs({ ...refs, [p.id]: e.target.value })} /><Button disabled={pending || (refs[p.id] ?? "").length < 3} onClick={() => run(async () => { await api(`/admin/investments/${p.id}/complete-withdrawal`, { body: { payout_reference: refs[p.id] } }); reload(); })}>Mark paid</Button></div>}</Td></tr>))}</Table>
    </>
  );
}
