"use client";
import { RequirePermission } from "@/components/RequirePermission";
import { useState } from "react";
import { Input, PageHeader, Spinner, Table, Td } from "@/components/ui";
import { useQuery } from "@/lib/api";
import { dateTime } from "@/lib/format";
import type { AuditEntry, Page } from "@/lib/types";

export default function Audit() {
  return <RequirePermission perm="audit:read"><AuditContent /></RequirePermission>;
}

function AuditContent() {
  const [action, setAction] = useState("");
  const { data, loading } = useQuery<Page<AuditEntry>>(`/admin/audit?limit=100${action ? `&action=${encodeURIComponent(action)}` : ""}`);
  return (
    <>
      <PageHeader title="Audit log" sub="Every change made by clients, staff, AI agents and scheduled jobs. Entries cannot be edited." action={<Input placeholder="Filter by action, e.g. claim." value={action} onChange={(e) => setAction(e.target.value)} className="w-64" />} />
      {loading ? <Spinner /> : (
        <Table head={["When", "Who", "Action", "Record", "Details"]}>{(data?.items ?? []).map((a) => (
          <tr key={a.id}><Td className="whitespace-nowrap">{dateTime(a.created_at)}</Td><Td>{a.actor_type}<div className="font-mono text-xs text-ink2">{a.actor_id?.slice(0, 8)}</div></Td><Td className="font-semibold">{a.action}</Td><Td>{a.entity_type}<div className="font-mono text-xs text-ink2">{a.entity_id.slice(0, 8)}</div></Td><Td className="max-w-xs break-all font-mono text-xs text-ink2">{JSON.stringify(a.meta)}</Td></tr>))}</Table>
      )}
    </>
  );
}
