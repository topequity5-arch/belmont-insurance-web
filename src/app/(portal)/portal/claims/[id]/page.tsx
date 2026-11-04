"use client";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { Badge, Button, Card, ErrorNote, Field, Input, Select, Spinner, Textarea, useAction } from "@/components/ui";
import { api, apiUpload, useQuery } from "@/lib/api";
import { FileDownload } from "@/components/FileDownload";
import { dateTime, label, usd } from "@/lib/format";
import type { ClaimDetail } from "@/lib/types";

const STAGES = ["submitted", "under_review", "approved", "paid"];

function Tracker({ status }: { status: string }) {
  const rejected = status === "rejected";
  const idx = status === "info_requested" ? 1 : rejected ? 2 : STAGES.indexOf(status);
  const names = ["Submitted", "In review", rejected ? "Not approved" : "Approved", "Paid"];
  return (
    <ol className="relative ml-2 space-y-6 border-l-2 border-line pl-7">
      <span aria-hidden className={`tracker-line absolute -left-[2px] top-0 w-0.5 ${rejected ? "bg-bad" : "bg-brand"}`} style={{ height: `${(Math.min(idx, 3) / 3) * 100}%` }} />
      {names.map((n, i) => (
        <li key={n} className="relative">
          <span className={`absolute -left-[38px] top-0.5 h-5 w-5 rounded-full border-4 border-white ${i <= idx ? (rejected && i === 2 ? "bg-bad" : i === 3 ? "bg-ok" : "bg-brand") : "bg-line"}`} />
          <p className={`font-display text-lg font-bold ${i <= idx ? "" : "text-ink2"}`}>{n}{i === idx && status === "info_requested" ? " (we need more from you)" : ""}</p>
        </li>
      ))}
    </ol>
  );
}

export default function ClaimPage() {
  const { id } = useParams<{ id: string }>();
  const { data: c, loading, error, reload } = useQuery<ClaimDetail>(`/claims/${id}`);
  const msg = useAction(); const up = useAction(); const pay = useAction();
  const [text, setText] = useState("");
  const [payout, setPayout] = useState({ method: "bank", a: "", b: "", c: "" });
  const file = useRef<HTMLInputElement>(null);
  if (loading) return <Spinner />;
  if (!c) return <ErrorNote message={error} />;
  const closed = ["paid", "rejected"].includes(c.status);

  async function upload(f: File) {
    await up.run(async () => {
      const { storage_path } = await apiUpload<{ storage_path: string }>(`/claims/${id}/documents/upload`, f);
      await api(`/claims/${id}/documents`, { body: { file_name: f.name, storage_path, content_type: f.type, size_bytes: f.size } });
      reload();
    });
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <div><div className="flex items-center gap-3"><h1 className="text-3xl font-extrabold">{c.number}</h1><Badge status={c.status} /></div><p className="mt-1 text-ink2">{c.title} · {c.plan_name}</p></div>
        <Card><h2 className="mb-1 font-bold">Details</h2><p className="whitespace-pre-wrap text-sm">{c.description}</p>
          <p className="mt-3 text-sm text-ink2">Claimed {usd(c.amount_claimed_usd)}{c.amount_approved_usd && <> · Approved <b className="text-ink">{usd(c.amount_approved_usd)}</b></>}</p>
          {c.decision_note && <p className="mt-3 rounded-xl bg-mist p-3 text-sm"><b>Decision:</b> {c.decision_note}</p>}
        </Card>
        <Card>
          <h2 className="mb-3 font-bold">Conversation</h2>
          <ul className="space-y-3">
            {c.events.map((e) => (
              <li key={e.id} className={`rounded-xl p-3 text-sm ${e.actor_type === "user" ? "bg-brand/8" : "bg-mist"}`}>
                <p className="text-xs text-ink2">{e.actor_type === "user" ? "You" : "Claims team"} · {dateTime(e.created_at)}{e.to_status && ` · ${label(e.to_status)}`}</p>
                {e.message && <p className="mt-1 whitespace-pre-wrap">{e.message}</p>}
              </li>
            ))}
          </ul>
          {!closed && (
            <form className="mt-4 space-y-2" onSubmit={(e) => { e.preventDefault(); msg.run(async () => { await api(`/claims/${id}/messages`, { body: { message: text } }); setText(""); reload(); }); }}>
              <Textarea rows={3} required value={text} onChange={(e) => setText(e.target.value)} placeholder={c.status === "info_requested" ? "Reply with the information we asked for" : "Add a message for the claims team"} />
              <ErrorNote message={msg.error} /><Button disabled={msg.pending}>Send message</Button>
            </form>
          )}
        </Card>
      </div>
      <div className="space-y-6">
        <Card><h2 className="mb-4 font-bold">Progress</h2><Tracker status={c.status} /></Card>
        <Card>
          <h2 className="mb-2 font-bold">Documents</h2>
          <ul className="space-y-1 text-sm">{c.documents.map((d) => <li key={d.id}><FileDownload path={`/claims/${id}/documents/${d.id}/download`} name={d.file_name} /></li>)}{c.documents.length === 0 && <li className="text-ink2">No documents yet.</li>}</ul>
          {!closed && <>
            <input ref={file} type="file" hidden accept="image/*,application/pdf,video/mp4" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            <Button variant="soft" className="mt-3" disabled={up.pending} onClick={() => file.current?.click()}>{up.pending ? "Uploading…" : "Add a file"}</Button><ErrorNote message={up.error} />
            <p className="mt-2 text-xs text-ink2">JPG, PNG, PDF or MP4, up to 10 MB.</p></>}
        </Card>
        {c.status !== "paid" && c.status !== "rejected" && (
          <Card>
            <h2 className="mb-2 font-bold">Where should we pay you?</h2>
            {c.payout_method && <p className="mb-2 text-sm text-ink2">Saved: {c.payout_method === "bank" ? "bank account" : "crypto wallet"}. Update below if needed.</p>}
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); pay.run(async () => {
              const details = payout.method === "bank" ? { bank_name: payout.a, account_name: payout.b, account_number: payout.c } : { asset: payout.a, network: payout.b, address: payout.c };
              await api(`/claims/${id}/payout-details`, { method: "PUT", body: { payout_method: payout.method, payout_details: details } }); reload();
            }); }}>
              <Select value={payout.method} onChange={(e) => setPayout({ method: e.target.value, a: "", b: "", c: "" })}><option value="bank">Bank account (USD)</option><option value="crypto">Crypto wallet</option></Select>
              <Field label={payout.method === "bank" ? "Bank name" : "Asset (e.g. USDT)"}><Input required value={payout.a} onChange={(e) => setPayout({ ...payout, a: e.target.value })} /></Field>
              <Field label={payout.method === "bank" ? "Account name" : "Network (e.g. TRC20)"}><Input required value={payout.b} onChange={(e) => setPayout({ ...payout, b: e.target.value })} /></Field>
              <Field label={payout.method === "bank" ? "Account number" : "Wallet address"}><Input required value={payout.c} onChange={(e) => setPayout({ ...payout, c: e.target.value })} /></Field>
              <ErrorNote message={pay.error} /><Button variant="ghost" disabled={pay.pending}>Save payout details</Button>
            </form>
          </Card>
        )}
        {c.payout_reference && <Card><p className="text-sm">Paid on reference <b>{c.payout_reference}</b></p></Card>}
      </div>
    </div>
  );
}
