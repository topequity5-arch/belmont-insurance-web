import { Shell, type NavItem } from "@/components/Shell";
import { RequireSession } from "@/components/RequireSession";

const NAV: NavItem[] = [
  { href: "/portal", label: "Overview", exact: true },
  { href: "/portal/plans", label: "Plans" },
  { href: "/portal/policies", label: "My policies" },
  { href: "/portal/claims", label: "Claims" },
  { href: "/portal/billing", label: "Billing" },
  { href: "/portal/settings", label: "Account" },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <RequireSession area="client"><Shell nav={NAV} area="client">{children}</Shell></RequireSession>;
}
