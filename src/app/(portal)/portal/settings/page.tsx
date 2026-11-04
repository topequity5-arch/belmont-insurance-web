"use client";
import { useEffect, useState } from "react";
import { Badge, Button, Card, ErrorNote, Field, Input, PageHeader, Spinner, useAction } from "@/components/ui";
import { api, useQuery } from "@/lib/api";
import type { Me } from "@/lib/types";

export default function Settings() {
  const { data, loading, reload } = useQuery<Me>("/me");
  const { pending, error, run } = useAction();
  const [f, setF] = useState({ full_name: "", phone: "", country: "" });
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (data) setF({ full_name: data.full_name ?? "", phone: data.phone ?? "", country: data.country ?? "" }); }, [data]);
  if (loading || !data) return <Spinner />;
  return (
    <>
      <PageHeader title="Account" />
      <Card className="max-w-xl">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); run(async () => { await api("/me", { method: "PATCH", body: { full_name: f.full_name || null, phone: f.phone || null, country: f.country ? f.country.toUpperCase() : null } }); setSaved(true); reload(); }); }}>
          <Field label="Email"><Input value={data.email} disabled /></Field>
          <Field label="Full name"><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></Field>
          <Field label="Phone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="Country (2-letter code)"><Input maxLength={2} value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} /></Field>
          <p className="text-sm text-ink2">Identity verification: <Badge status={data.kyc_status} /></p>
          <ErrorNote message={error} />{saved && <p className="text-sm text-ok">Saved.</p>}
          <Button disabled={pending}>Save changes</Button>
        </form>
      </Card>
    </>
  );
}
