import type { Metadata } from "next";
import ContactPage from "@/components/landing/ContactPage";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Get in touch with ${BRAND}: send us a message through the contact form or visit our office.`,
};

export default function Page() {
  return <ContactPage />;
}