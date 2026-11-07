"use client";
import { Shell, type NavItem } from "@/components/Shell";

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", exact: true, perm: "stats:read" },
  { href: "/admin/claims", label: "Claims", perm: "claims:read" },
  { href: "/admin/payments", label: "Payments", perm: "payments:read" },
  { href: "/admin/subscriptions", label: "Policies and invoices", perm: "subscriptions:read" },
  { href: "/admin/catalog", label: "Products and plans", perm: "catalog:read" },
  { href: "/admin/payment-methods", label: "Payment accounts", perm: "payments:read" },
  { href: "/admin/users", label: "Users", perm: "users:read" },
  { href: "/admin/audit", label: "Audit log", perm: "audit:read" },
  { href: "/admin/agent", label: "AI agent tools", perm: "claims:read" },
];

export default function Page() {
  return <Shell nav={NAV} area="admin"><p>preview content</p></Shell>;
}
