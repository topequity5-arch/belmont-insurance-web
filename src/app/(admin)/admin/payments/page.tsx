"use client";
import { useState } from "react";
import { Badge, Button, Card, ErrorNote, Field, Input, PageHeader, Spinner, Tabs, useAction } from "@/components/ui";
import { RequirePermission } from "@/components/RequirePermission";
import { api, useQuery } from "@/lib/api";
import { FileDownload } from "@/components/FileDownload";
import { dateTime, usd } from "@/lib/format";
import type { Page, Payment } from "@/lib/types";

function Review({ p, onDone }: { p: Payment; onDone: () => void }) {
  const { pending, error, run } = useAction();
  const [note, setNote] = useState("");
  const [amt, setAmt] = useState("");
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><p className="font-display text-xl font-bold">{usd(p.amount_usd)} <span className="text-base font-medium text-ink2">for {p.invoice.number}</span></p><p className="text-sm text-ink2">{p.user_email} · {dateTime(p.submitted_at)}</p></div><Badge status={p.status} />
      </div>
      <dl className="mt-3 grid grid-cols-[120px_1fr] gap-y-1 text-sm">
        <dt className="text-ink2">Method</dt><dd>{p.method.label}{p.network && ` (${p.network})`}</dd>
        <dt className="text-ink2">Reference</dt><dd className="break-all font-mono text-xs">{p.tx_reference}</dd>
        {p.amount_asset && <><dt className="text-ink2">Client says sent</dt><dd>{p.amount_asset} {p.asset}</dd></>}
        <dt className="text-ink2">Proof</dt><dd>{p.proof_path ? <FileDownload path={`/admin/payments/${p.id}/proof`} name="View upload" /> : "None"}</dd>
        {p.review_note && <><dt className="text-ink2">Review note</dt><dd>{p.review_note}</dd></>}
      </dl>
      {p.status === "submitted" && (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Amount received (USD)" hint="Leave empty if it matches the invoice."><Input type="number" step="0.01" value={amt} onChange={(e) => setAmt(e.target.value)} /></Field>
            <Field label="Note" hint="Required to reject. The client sees it."><Input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          </div>
          <ErrorNote message={error} />
          <div className="flex gap-2">
            <Button disabled={pending} onClick={() => run(async () => { await api(`/admin/payments/${p.id}/confirm`, { body: { confirmed_amount_usd: amt || undefined, note: note || undefined } }); onDone(); })}>Confirm payment</Button>
            <Button variant="danger" disabled={pending || note.length < 3} onClick={() => run(async () => { await api(`/admin/payments/${p.id}/reject`, { body: { note } }); onDone(); })}>Reject</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function AdminPayments() {
  return (
    <RequirePermission perm="payments:read">
      <AdminPaymentsContent />
    </RequirePermission>
  );
}

function AdminPaymentsContent() {
  const [status, setStatus] = useState("submitted");
  const { data, loading, reload } = useQuery<Page<Payment>>(`/admin/payments?limit=100&status=${status}`);
  return (
    <>
      <PageHeader title="Payments" sub="Check each transfer against the bank statement or the blockchain before you confirm." action={<Tabs value={status} onChange={setStatus} options={[{ value: "submitted", label: "To review" }, { value: "confirmed", label: "Confirmed" }, { value: "rejected", label: "Rejected" }]} />} />
      {loading ? <Spinner /> : (data?.items ?? []).length === 0 ? <p className="rounded-2xl border border-dashed border-line p-10 text-center text-ink2">Nothing here.</p> : <div className="space-y-4">{data!.items.map((p) => <Review key={p.id} p={p} onDone={reload} />)}</div>}
    </>
  );
}
