"use client";
import Link from "next/link";
import { Badge, Empty, PageHeader, Spinner, Table, Td } from "@/components/ui";
import { useQuery } from "@/lib/api";
import { date, usd } from "@/lib/format";
import type { Claim } from "@/lib/types";

export default function Claims() {
  const { data, loading } = useQuery<Claim[]>("/claims");
  return (
    <>
      <PageHeader title="Claims" sub="Follow every claim from submission to payment." action={<Link href="/portal/claims/new" className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white">File a claim</Link>} />
      {loading ? <Spinner /> : (data ?? []).length === 0 ? <Empty title="No claims yet">If something goes wrong, you can file a claim here.</Empty> : (
        <Table head={["Claim", "Incident", "Claimed", "Approved", "Status"]}>
          {data!.map((c) => (
            <tr key={c.id} className="hover:bg-mist/40">
              <Td><Link className="font-semibold text-brand-d" href={`/portal/claims/${c.id}`}>{c.number}</Link><div className="text-ink2">{c.title}</div></Td>
              <Td>{date(c.incident_date)}</Td><Td>{usd(c.amount_claimed_usd)}</Td><Td>{usd(c.amount_approved_usd)}</Td><Td><Badge status={c.status} /></Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
