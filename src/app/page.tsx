import type { Metadata } from "next";
import Landing from "@/components/landing/Landing";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: { absolute: `${BRAND} – Cover that keeps up with your life` },
  description: "Get a quote in 30 seconds. Auto, home, health and life insurance with claims paid in hours, not weeks.",
  icons: { icon: "/logo.jpeg" },
};

export default function Home() {
  return <Landing />;
}
