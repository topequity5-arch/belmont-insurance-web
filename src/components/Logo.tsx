import { BRAND } from "@/lib/brand";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-xl font-extrabold ${light ? "text-white" : "text-ink"}`}>
      <img src="/logo.jpeg" alt="Logo" width="28" height="28" aria-hidden />
      {BRAND}
    </span>
  );
}
