import type { Metadata } from "next";
import "./globals.css";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: { default: `${BRAND} - Insurance and investment plans`, template: `%s | ${BRAND}` }, description: "Buy cover, manage claims and grow your savings in one place." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
