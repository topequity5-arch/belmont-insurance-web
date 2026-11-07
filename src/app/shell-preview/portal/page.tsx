"use client";
import { Shell, type NavItem } from "@/components/Shell";

const NAV: NavItem[] = [
  { href: "/portal", label: "Overview", exact: true },
  { href: "/portal/plans", label: "Plans" },
  { href: "/portal/policies", label: "My policies" },
  { href: "/portal/claims", label: "Claims" },
  { href: "/portal/billing", label: "Billing" },
  { href: "/portal/settings", label: "Account" },
];

export default function Page() {
  return <Shell nav={NAV} area="client"><p>preview content</p></Shell>;
}
