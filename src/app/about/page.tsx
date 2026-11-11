import type { Metadata } from "next";
import AboutPage from "@/components/landing/AboutPage";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "About us",
  description: `Why ${BRAND} exists: transparent pricing, claims paid in hours, and real humans when you need them.`,
};

export default function Page() {
  return <AboutPage />;
}