"use client";
import Link from "next/link";
import { useState } from "react";
import { Badge, PageHeader, Select, Spinner, Table, Td } from "@/components/ui";
import { RequirePermission } from "@/components/RequirePermission";
import { useQuery } from "@/lib/api";
import { date, usd } from "@/lib/format";
import type { Claim, Page } from "@/lib/types";

export default function AdminClaims() {
  return <RequirePermission perm="claims:read"><AdminClaimsContent /></RequirePermission>;
}

function AdminClaimsContent() {
  const [status, setStatus] = useState("");
  const { data, loading } = useQuery<Page<Claim>>(`/admin/claims?limit=100${status ? `&status=${status}` : ""}`);
  return (
    <>
      <PageHeader title="Claims" action={<Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-48"><option value="">All statuses</option>{["submitted", "under_review", "info_requested", "approved", "rejected", "paid"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</Select>} />
      {loading ? <Spinner /> : (
        <Table head={["Claim", "Client", "Policy", "Incident", "Claimed", "Status"]}>
          {(data?.items ?? []).map((c) => (
            <tr key={c.id} className="hover:bg-mist/40"><Td><Link className="font-semibold text-brand-d" href={`/admin/claims/${c.id}`}>{c.number}</Link><div className="text-ink2">{c.title}</div></Td>
              <Td>{c.user_email}</Td><Td>{c.policy_number}</Td><Td>{date(c.incident_date)}</Td><Td>{usd(c.amount_claimed_usd)}</Td><Td><Badge status={c.status} /></Td></tr>
          ))}
        </Table>
      )}
    </>
  );
}
