"use client";
import { RequirePermission } from "@/components/RequirePermission";
import { Card, PageHeader, Spinner } from "@/components/ui";
import { useQuery } from "@/lib/api";

type Tool = { name: string; description: string; input_schema: object };

export default function Agent() {
  return <RequirePermission perm="claims:read"><AgentContent /></RequirePermission>;
}

function AgentContent() {
  const { data, loading } = useQuery<Tool[]>("/admin/agent/tools");
  return (
    <>
      <PageHeader title="AI agent tools" sub="The actions an AI agent is allowed to take under your permissions. Approving claims and confirming payments always stay with people." />
      {loading ? <Spinner /> : <div className="grid gap-4 md:grid-cols-2">{(data ?? []).map((t) => (
        <Card key={t.name}><h2 className="font-mono text-sm font-bold">{t.name}</h2><p className="mt-1 text-sm text-ink2">{t.description}</p><pre className="mt-3 overflow-x-auto rounded-xl bg-mist p-3 text-xs">{JSON.stringify(t.input_schema, null, 2)}</pre></Card>))}</div>}
      <p className="mt-6 text-sm text-ink2">Developers: see docs/AI_AGENT.md for how to connect an agent to this tool list.</p>
    </>
  );
}
