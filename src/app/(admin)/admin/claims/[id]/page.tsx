"use client";
import { RequirePermission } from "@/components/RequirePermission";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card, ErrorNote, Field, Input, Spinner, Textarea, useAction } from "@/components/ui";
import { api, useQuery } from "@/lib/api";
import { FileDownload } from "@/components/FileDownload";
import { dateTime, label, usd } from "@/lib/format";
import type { ClaimDetail } from "@/lib/types";

export default function AdminClaim() {
  const { id } = useParams<{ id: string }>();
  return <RequirePermission perm="claims:read"><AdminClaimContent id={id} /></RequirePermission>;
}

function AdminClaimContent({ id }: { id: string }) {
  const { data: c, loading, error, reload } = useQuery<ClaimDetail>(`/admin/claims/${id}`);
  const act = useAction();
  const [note, setNote] = useState(""); const [amount, setAmount] = useState(""); const [internal, setInternal] = useState(""); const [ref, setRef] = useState("");
  if (loading) return <Spinner />;
  if (!c) return <ErrorNote message={error} />;
  const go = (to: string) => act.run(async () => { await api(`/admin/claims/${id}/transition`, { body: { to_status: to, note: note || undefined, approved_amount_usd: to === "approved" && amount ? amount : undefined } }); setNote(""); reload(); });
  const next: Record<string, string[]> = { submitted: ["under_review", "rejected"], under_review: ["info_requested", "approved", "rejected"], info_requested: [], approved: [], rejected: [], paid: [] };
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <div><div className="flex items-center gap-3"><h1 className="text-3xl font-extrabold">{c.number}</h1><Badge status={c.status} /></div><p className="text-ink2">{c.user_email} · {c.plan_name} · {c.policy_number}</p></div>
        <Card><h2 className="font-bold">{c.title}</h2><p className="mt-2 whitespace-pre-wrap text-sm">{c.description}</p>
          <p className="mt-3 text-sm text-ink2">Claimed <b className="text-ink">{usd(c.amount_claimed_usd)}</b> · Coverage limit {usd(c.coverage_usd)}{c.amount_approved_usd && <> · Approved <b className="text-ink">{usd(c.amount_approved_usd)}</b></>}</p></Card>
        <Card><h2 className="mb-3 font-bold">Timeline</h2>
          <ul className="space-y-2">{c.events.map((e) => (
            <li key={e.id} className={`rounded-xl p-3 text-sm ${e.visibility === "internal" ? "border border-dashed border-warn bg-warn/5" : "bg-mist"}`}>
              <p className="text-xs text-ink2">{e.visibility === "internal" ? "Internal note" : label(e.kind)} · {label(e.actor_type)} · {dateTime(e.created_at)}{e.to_status && ` · ${label(e.to_status)}`}</p>{e.message && <p className="mt-1 whitespace-pre-wrap">{e.message}</p>}</li>))}</ul>
          <form className="mt-4 space-y-2" onSubmit={(e) => { e.preventDefault(); act.run(async () => { await api(`/admin/claims/${id}/notes`, { body: { note: internal, visible_to_client: false } }); setInternal(""); reload(); }); }}>
            <Textarea rows={2} required value={internal} onChange={(e) => setInternal(e.target.value)} placeholder="Internal note (not visible to the client)" /><Button variant="ghost" disabled={act.pending}>Add internal note</Button></form>
        </Card>
      </div>
      <div className="space-y-6">
        <Card><h2 className="mb-3 font-bold">Documents</h2><ul className="space-y-1 text-sm">{c.documents.map((d) => <li key={d.id}><FileDownload path={`/admin/claims/${id}/documents/${d.id}/download`} name={d.file_name} /></li>)}{c.documents.length === 0 && <li className="text-ink2">None uploaded.</li>}</ul></Card>
        {(next[c.status] ?? []).length > 0 && (
          <Card><h2 className="mb-3 font-bold">Decision</h2>
            <Field label="Message to the client" hint="Required to reject or request information."><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
            {next[c.status].includes("approved") && <div className="mt-3"><Field label="Approved amount (USD)" hint="Leave empty to approve the full claimed amount, up to the limit."><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field></div>}
            <ErrorNote message={act.error} />
            <div className="mt-3 flex flex-wrap gap-2">{next[c.status].map((t) => <Button key={t} variant={t === "rejected" ? "danger" : t === "approved" ? "primary" : "soft"} disabled={act.pending} onClick={() => go(t)}>{{ under_review: "Start review", info_requested: "Request information", approved: "Approve", rejected: "Reject" }[t]}</Button>)}</div>
          </Card>
        )}
        {c.status === "approved" && (
          <Card><h2 className="mb-2 font-bold">Record payout</h2>
            {c.payout_method ? <p className="mb-3 break-all rounded-xl bg-mist p-3 text-sm"><b>{c.payout_method}</b>: {JSON.stringify(c.payout_details)}</p> : <p className="mb-3 text-sm text-warn">The client has not given payout details yet.</p>}
            <Field label="Payout reference (bank ref or tx hash)"><Input value={ref} onChange={(e) => setRef(e.target.value)} /></Field>
            <ErrorNote message={act.error} /><Button className="mt-3" disabled={act.pending || !ref} onClick={() => act.run(async () => { await api(`/admin/claims/${id}/payout`, { body: { payout_reference: ref } }); reload(); })}>Mark as paid {usd(c.amount_approved_usd)}</Button>
          </Card>
        )}
      </div>
    </div>
  );
}
