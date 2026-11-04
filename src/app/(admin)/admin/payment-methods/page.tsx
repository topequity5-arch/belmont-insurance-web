"use client";
import { RequirePermission } from "@/components/RequirePermission";
import { useState } from "react";
import { Badge, Button, Card, ErrorNote, Field, Input, PageHeader, Select, Spinner, Table, Td, Textarea, useAction } from "@/components/ui";
import { api, useQuery } from "@/lib/api";
import { dateTime } from "@/lib/format";
import type { PaymentMethod, Rate } from "@/lib/types";

const blank = { kind: "crypto", label: "", asset: "USDT", network: "", address: "", bank_name: "", account_name: "", account_number: "", routing_code: "", instructions: "" };

export default function Methods() {
  return <RequirePermission perm="payments:read"><MethodsContent /></RequirePermission>;
}

function MethodsContent() {
  const m = useQuery<PaymentMethod[]>("/admin/payment-methods");
  const r = useQuery<Rate[]>("/admin/rates");
  const add = useAction(); const rate = useAction();
  const [f, setF] = useState(blank);
  const [rf, setRf] = useState({ asset: "", price: "" });
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  if (m.loading) return <Spinner />;
  const nn = (s: string) => s || null;
  return (
    <>
      <PageHeader title="Payment accounts" sub="Bank accounts and wallets clients pay into. Only active accounts are shown to clients." />
      <Table head={["Account", "Details", "Status", ""]}>
        {(m.data ?? []).map((x) => (
          <tr key={x.id}><Td className="font-semibold">{x.label}<div className="text-xs font-normal text-ink2">{x.asset}{x.network && ` · ${x.network}`}</div></Td>
            <Td className="break-all font-mono text-xs">{x.kind === "crypto" ? x.address : `${x.bank_name} · ${x.account_number}`}</Td>
            <Td><Badge status={x.active ? "active" : "cancelled"} /></Td>
            <Td><button className="text-sm font-semibold text-brand-d" onClick={async () => { await api(`/admin/payment-methods/${x.id}`, { method: "PATCH", body: { active: !x.active } }); m.reload(); }}>{x.active ? "Disable" : "Enable"}</button></Td></tr>
        ))}
      </Table>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-bold">Add an account</h2>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); add.run(async () => {
            await api("/admin/payment-methods", { body: { kind: f.kind, label: f.label, asset: f.asset, network: nn(f.network), address: nn(f.address), bank_name: nn(f.bank_name), account_name: nn(f.account_name), account_number: nn(f.account_number), routing_code: nn(f.routing_code), instructions: f.instructions } });
            setF(blank); m.reload(); }); }}>
            <Select value={f.kind} onChange={(e) => setF({ ...blank, kind: e.target.value, asset: e.target.value === "bank" ? "USD" : "USDT" })}><option value="crypto">Crypto wallet</option><option value="bank">Bank account (USD)</option></Select>
            <Field label="Label shown to clients"><Input required value={f.label} onChange={set("label")} /></Field>
            <Field label="Asset"><Input required value={f.asset} onChange={set("asset")} /></Field>
            {f.kind === "crypto" ? <><Field label="Network"><Input required value={f.network} onChange={set("network")} /></Field><Field label="Wallet address"><Input required value={f.address} onChange={set("address")} /></Field></> :
              <><Field label="Bank name"><Input required value={f.bank_name} onChange={set("bank_name")} /></Field><Field label="Account name"><Input required value={f.account_name} onChange={set("account_name")} /></Field><Field label="Account number"><Input required value={f.account_number} onChange={set("account_number")} /></Field><Field label="SWIFT / routing"><Input value={f.routing_code} onChange={set("routing_code")} /></Field></>}
            <Field label="Instructions for clients"><Textarea rows={2} value={f.instructions} onChange={set("instructions")} /></Field>
            <ErrorNote message={add.error} /><Button disabled={add.pending}>Add account</Button>
          </form>
        </Card>
        <Card>
          <h2 className="mb-1 text-lg font-bold">Exchange rates (USD per 1 unit)</h2>
          <p className="mb-3 text-sm text-ink2">Used to quote crypto amounts on invoices. Keep these current.</p>
          <ul className="mb-4 divide-y divide-line text-sm">{(r.data ?? []).map((x) => <li key={x.asset} className="flex justify-between py-2"><b>{x.asset}</b><span>${x.usd_price} <span className="text-xs text-ink2">· {dateTime(x.updated_at)}</span></span></li>)}</ul>
          <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); rate.run(async () => { await api(`/admin/rates/${rf.asset.toUpperCase()}`, { method: "PUT", body: { usd_price: rf.price } }); setRf({ asset: "", price: "" }); r.reload(); }); }}>
            <Field label="Asset"><Input required value={rf.asset} onChange={(e) => setRf({ ...rf, asset: e.target.value })} className="w-24" /></Field>
            <Field label="USD price"><Input required type="number" step="any" min="0" value={rf.price} onChange={(e) => setRf({ ...rf, price: e.target.value })} /></Field>
            <Button disabled={rate.pending}>Set rate</Button>
          </form><ErrorNote message={rate.error} />
        </Card>
      </div>
    </>
  );
}
