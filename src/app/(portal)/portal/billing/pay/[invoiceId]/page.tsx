"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Badge, Button, Card, CopyButton, ErrorNote, Field, Input, PageHeader, Spinner, Textarea, useAction } from "@/components/ui";
import { api, apiUpload, useQuery } from "@/lib/api";
import { usd } from "@/lib/format";
import type { Invoice, PaymentMethod, Quote } from "@/lib/types";

function Row({ k, v, copy }: { k: string; v: string; copy?: boolean }) {
  return <div className="flex items-center justify-between gap-3 border-b border-line py-2 text-sm last:border-0"><span className="text-ink2">{k}</span><span className="flex items-center gap-2 break-all text-right font-semibold">{v}{copy && <CopyButton text={v} />}</span></div>;
}

export default function Pay() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const router = useRouter();
  const inv = useQuery<Invoice>(`/invoices/${invoiceId}`);
  const methods = useQuery<PaymentMethod[]>("/payment-methods");
  const [methodId, setMethodId] = useState<string>("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const q = useAction(); const submit = useAction();
  const [f, setF] = useState({ ref: "", amount: "", note: "" });
  const [proof, setProof] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const method = methods.data?.find((m) => m.id === methodId);

  useEffect(() => {
    setQuote(null);
    if (!methodId) return;
    q.run(async () => { const r = await api<Quote>(`/payments/quote?invoice_id=${invoiceId}&method_id=${methodId}`); setQuote(r); setF((x) => ({ ...x, amount: r.asset === "USD" ? "" : r.amount_asset })); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [methodId, invoiceId]);

  if (inv.loading || methods.loading) return <Spinner />;
  if (!inv.data) return <ErrorNote message={inv.error} />;
  const i = inv.data;
  if (i.status !== "open") return <Card><p>This invoice is <Badge status={i.status} />. <Link className="font-semibold text-brand-d" href="/portal/billing">Back to billing</Link></p></Card>;

  async function send() {
    await submit.run(async () => {
      let proof_path: string | undefined;
      if (proof) {
        const uploaded = await apiUpload<{ path: string }>("/payments/proof-upload", proof);
        proof_path = uploaded.path;
      }
      await api("/payments", { body: { invoice_id: invoiceId, method_id: methodId, tx_reference: f.ref, amount_asset: f.amount || undefined, proof_path, note: f.note || undefined } });
      router.push("/portal/billing");
    });
  }
  return (
    <>
      <PageHeader title={`Pay ${usd(i.amount_usd)}`} sub={`${i.description} · ${i.number}`} />
      <div className="grid max-w-4xl gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-bold">1. Choose how to pay</h2>
          {(methods.data ?? []).length === 0 && <p className="text-sm text-ink2">No payment accounts are available yet. Please contact support.</p>}
          <div className="space-y-2">
            {(methods.data ?? []).map((m) => (
              <label key={m.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${methodId === m.id ? "border-brand bg-brand/5" : "border-line"}`}>
                <input type="radio" name="method" checked={methodId === m.id} onChange={() => setMethodId(m.id)} /><span className="font-semibold">{m.label}</span><span className="text-ink2">{m.kind === "bank" ? "Bank transfer" : m.network}</span>
              </label>
            ))}
          </div>
          <ErrorNote message={q.error} />
        </Card>
        <Card>
          <h2 className="mb-3 font-bold">2. Send the payment</h2>
          {!method || !quote ? <p className="text-sm text-ink2">Pick a method to see the account details.</p> : (
            <>
              {method.kind === "crypto" ? <>
                <Row k="Send exactly" v={`${quote.amount_asset} ${method.asset}`} copy /><Row k="Network" v={method.network ?? ""} /><Row k="Wallet address" v={method.address ?? ""} copy />
                <p className="mt-2 text-xs text-ink2">Rate used: 1 {method.asset} = {usd(quote.rate_usd)}. Send on the {method.network} network only. Funds sent on another network can be lost.</p>
              </> : <>
                <Row k="Amount" v={usd(quote.amount_usd)} /><Row k="Bank" v={method.bank_name ?? ""} /><Row k="Account name" v={method.account_name ?? ""} copy /><Row k="Account number" v={method.account_number ?? ""} copy />
                {method.routing_code && <Row k="SWIFT / routing" v={method.routing_code} copy />}<Row k="Reference" v={i.number} copy />
              </>}
              {method.instructions && <p className="mt-3 rounded-xl bg-mist p-3 text-sm">{method.instructions}</p>}
            </>
          )}
        </Card>
        {method && quote && (
          <Card className="md:col-span-2">
            <h2 className="mb-3 font-bold">3. Tell us you have paid</h2>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
              <Field label={method.kind === "crypto" ? "Transaction hash" : "Transfer reference"}><Input required minLength={6} value={f.ref} onChange={(e) => setF({ ...f, ref: e.target.value })} /></Field>
              {method.kind === "crypto" && <Field label={`Amount sent (${method.asset})`}><Input type="number" step="any" required value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>}
              <Field label="Receipt or screenshot (optional)"><input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={(e) => setProof(e.target.files?.[0] ?? null)} className="text-sm" /></Field>
              <Field label="Note (optional)"><Textarea rows={2} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
              <div className="space-y-2 md:col-span-2"><ErrorNote message={submit.error} /><Button disabled={submit.pending}>{submit.pending ? "Submitting…" : "I have paid"}</Button>
                <p className="text-xs text-ink2">We verify payments manually. You will be notified when it is confirmed.</p></div>
            </form>
          </Card>
        )}
      </div>
    </>
  );
}
