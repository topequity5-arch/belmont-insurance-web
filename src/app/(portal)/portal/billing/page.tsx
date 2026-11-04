"use client";
import Link from "next/link";
import { Badge, Empty, PageHeader, Spinner, Table, Td } from "@/components/ui";
import { useQuery } from "@/lib/api";
import { date, usd } from "@/lib/format";
import type { Invoice, Payment } from "@/lib/types";

export default function Billing() {
  const inv = useQuery<Invoice[]>("/invoices");
  const pay = useQuery<Payment[]>("/payments");
  if (inv.loading) return <Spinner />;
  return (
    <>
      <PageHeader title="Billing" sub="Invoices and the payments you have submitted." />
      <h2 className="mb-3 text-xl font-extrabold">Invoices</h2>
      {(inv.data ?? []).length === 0 ? <Empty title="No invoices yet" /> : (
        <Table head={["Invoice", "Description", "Amount", "Due", "Status", ""]}>
          {inv.data!.map((i) => (
            <tr key={i.id}><Td className="font-semibold">{i.number}</Td><Td>{i.description}</Td><Td>{usd(i.amount_usd)}</Td><Td>{date(i.due_date)}</Td><Td><Badge status={i.status} /></Td>
              <Td>{i.status === "open" && <Link className="font-semibold text-brand-d" href={`/portal/billing/pay/${i.id}`}>Pay now</Link>}</Td></tr>
          ))}
        </Table>
      )}
      <h2 className="mb-3 mt-10 text-xl font-extrabold">Payments</h2>
      {(pay.data ?? []).length === 0 ? <Empty title="No payments submitted" /> : (
        <Table head={["Submitted", "Invoice", "Method", "Reference", "Status"]}>
          {pay.data!.map((p) => (
            <tr key={p.id}><Td>{date(p.submitted_at)}</Td><Td>{p.invoice.number}</Td><Td>{p.method.label}</Td><Td className="max-w-[220px] truncate font-mono text-xs">{p.tx_reference}</Td>
              <Td><Badge status={p.status} />{p.review_note && <p className="mt-1 text-xs text-ink2">{p.review_note}</p>}</Td></tr>
          ))}
        </Table>
      )}
    </>
  );
}
