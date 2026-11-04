"use client";
import { RequirePermission } from "@/components/RequirePermission";
import { useState } from "react";
import { Badge, Button, Card, ErrorNote, Field, Input, PageHeader, Select, Spinner, Table, Td, useAction } from "@/components/ui";
import { api, useQuery } from "@/lib/api";
import { pct, usd } from "@/lib/format";
import type { Plan, Product } from "@/lib/types";

export default function Catalog() {
  return <RequirePermission perm="catalog:read"><CatalogContent /></RequirePermission>;
}

function CatalogContent() {
  const prods = useQuery<Product[]>("/admin/catalog/products");
  const plans = useQuery<Plan[]>("/admin/catalog/plans");
  const np = useAction(); const nl = useAction();
  const [p, setP] = useState({ code: "", name: "", category: "auto" });
  const [l, setL] = useState({ product_id: "", code: "", name: "", tagline: "", features: "", monthly: "", yearly: "", coverage: "", deductible: "", min: "", rate: "", term: "" });
  if (prods.loading) return <Spinner />;
  const product = (prods.data ?? []).find((x) => x.id === l.product_id);
  const inv = product?.category === "investment";
  const num = (s: string) => (s ? s : null);
  return (
    <>
      <PageHeader title="Products and plans" sub="Changes apply to new purchases. Existing policies keep the price and cover they were bought at." />
      <Table head={["Plan", "Product", "Pricing", "Cover / terms", "Status", ""]}>
        {(plans.data ?? []).map((x) => (
          <tr key={x.id}><Td className="font-semibold">{x.name}<div className="text-xs font-normal text-ink2">{x.code}</div></Td><Td>{x.product.name}</Td>
            <Td>{x.product.category === "investment" ? `from ${usd(x.min_principal_usd)}` : `${usd(x.price_monthly_usd)} / mo · ${usd(x.price_yearly_usd)} / yr`}</Td>
            <Td>{x.product.category === "investment" ? `${pct(x.annual_rate_bps)} · ${x.term_months} months` : `${usd(x.coverage_usd)} cover`}</Td><Td><Badge status={x.active ? "active" : "cancelled"} /></Td>
            <Td><button className="text-sm font-semibold text-brand-d" onClick={async () => { await api(`/admin/catalog/plans/${x.id}`, { method: "PATCH", body: { active: !x.active } }); plans.reload(); }}>{x.active ? "Hide" : "Show"}</button></Td></tr>
        ))}
      </Table>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card><h2 className="mb-3 text-lg font-bold">New product</h2>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); np.run(async () => { await api("/admin/catalog/products", { body: p }); setP({ code: "", name: "", category: "auto" }); prods.reload(); }); }}>
            <Field label="Name"><Input required value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></Field>
            <Field label="Code" hint="Lowercase letters, numbers, dashes."><Input required pattern="[a-z0-9_-]{2,40}" value={p.code} onChange={(e) => setP({ ...p, code: e.target.value })} /></Field>
            <Field label="Category"><Select value={p.category} onChange={(e) => setP({ ...p, category: e.target.value })}>{["auto", "home", "health", "life", "investment"].map((c) => <option key={c}>{c}</option>)}</Select></Field>
            <ErrorNote message={np.error} /><Button disabled={np.pending}>Create product</Button></form></Card>
        <Card><h2 className="mb-3 text-lg font-bold">New plan</h2>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); nl.run(async () => {
            await api("/admin/catalog/plans", { body: { product_id: l.product_id, code: l.code, name: l.name, tagline: l.tagline, features: l.features.split("\n").map((s) => s.trim()).filter(Boolean),
              price_monthly_usd: num(l.monthly), price_yearly_usd: num(l.yearly), coverage_usd: num(l.coverage), deductible_usd: num(l.deductible), min_principal_usd: num(l.min), annual_rate_bps: l.rate ? Math.round(Number(l.rate) * 100) : null, term_months: l.term ? Number(l.term) : null } });
            plans.reload(); }); }}>
            <Field label="Product"><Select required value={l.product_id} onChange={(e) => setL({ ...l, product_id: e.target.value })}><option value="">Choose…</option>{(prods.data ?? []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></Field>
            <div className="grid grid-cols-2 gap-3"><Field label="Name"><Input required value={l.name} onChange={(e) => setL({ ...l, name: e.target.value })} /></Field><Field label="Code"><Input required pattern="[a-z0-9_-]{2,60}" value={l.code} onChange={(e) => setL({ ...l, code: e.target.value })} /></Field></div>
            <Field label="Tagline"><Input value={l.tagline} onChange={(e) => setL({ ...l, tagline: e.target.value })} /></Field>
            {inv ? <div className="grid grid-cols-3 gap-3"><Field label="Min (USD)"><Input type="number" required value={l.min} onChange={(e) => setL({ ...l, min: e.target.value })} /></Field><Field label="Rate % / yr"><Input type="number" step="0.01" required value={l.rate} onChange={(e) => setL({ ...l, rate: e.target.value })} /></Field><Field label="Term (months)"><Input type="number" required value={l.term} onChange={(e) => setL({ ...l, term: e.target.value })} /></Field></div> :
              <div className="grid grid-cols-2 gap-3"><Field label="Monthly (USD)"><Input type="number" step="0.01" value={l.monthly} onChange={(e) => setL({ ...l, monthly: e.target.value })} /></Field><Field label="Yearly (USD)"><Input type="number" step="0.01" value={l.yearly} onChange={(e) => setL({ ...l, yearly: e.target.value })} /></Field><Field label="Coverage limit"><Input type="number" required value={l.coverage} onChange={(e) => setL({ ...l, coverage: e.target.value })} /></Field><Field label="Deductible"><Input type="number" value={l.deductible} onChange={(e) => setL({ ...l, deductible: e.target.value })} /></Field></div>}
            <Field label="Features (one per line)"><textarea rows={3} className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm" value={l.features} onChange={(e) => setL({ ...l, features: e.target.value })} /></Field>
            <ErrorNote message={nl.error} /><Button disabled={nl.pending}>Create plan</Button></form></Card>
      </div>
    </>
  );
}
