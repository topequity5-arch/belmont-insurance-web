"use client";
import { useState } from "react";
import { Badge, ErrorNote, Input, PageHeader, Select, Spinner, Table, Td, useAction } from "@/components/ui";
import { api, useQuery } from "@/lib/api";
import { date } from "@/lib/format";
import type { Me, Page, Profile } from "@/lib/types";

const ROLES = ["client", "support", "claims_adjuster", "finance", "admin"];

export default function Users() {
  const [q, setQ] = useState("");
  const me = useQuery<Me>("/me");
  const { data, loading, reload } = useQuery<Page<Profile>>(`/admin/users?limit=100${q ? `&q=${encodeURIComponent(q)}` : ""}`);
  const { error, run } = useAction();
  const canWrite = me.data?.permissions.includes("*");
  const patch = (id: string, body: object) => run(async () => { await api(`/admin/users/${id}`, { method: "PATCH", body }); reload(); });
  return (
    <>
      <PageHeader title="Users" sub="Only admins can change roles, suspend accounts or set verification status." action={<Input placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />} />
      <ErrorNote message={error} />
      {loading ? <Spinner /> : (
        <Table head={["User", "Role", "Verification", "Status", "Joined"]}>{(data?.items ?? []).map((u) => (
          <tr key={u.id}><Td className="font-semibold">{u.full_name || "-"}<div className="text-xs font-normal text-ink2">{u.email}</div></Td>
            <Td>{canWrite ? <Select value={u.role} onChange={(e) => patch(u.id, { role: e.target.value })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</Select> : u.role}</Td>
            <Td>{canWrite ? <Select value={u.kyc_status} onChange={(e) => patch(u.id, { kyc_status: e.target.value })}>{["not_submitted", "pending", "verified", "rejected"].map((r) => <option key={r}>{r}</option>)}</Select> : <Badge status={u.kyc_status} />}</Td>
            <Td>{canWrite ? <button className="text-sm font-semibold text-brand-d" onClick={() => patch(u.id, { status: u.status === "active" ? "suspended" : "active" })}>{u.status === "active" ? "Suspend" : "Reactivate"}</button> : null}<Badge status={u.status} /></Td><Td>{date(u.created_at)}</Td></tr>))}</Table>
      )}
    </>
  );
}
