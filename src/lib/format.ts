export const usd = (v: string | number | null | undefined) =>
  v == null ? "-" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(v));
export const date = (v: string | null | undefined) => (v ? new Date(v).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "-");
export const dateTime = (v: string) => new Date(v).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
export const pct = (bps: number | null) => (bps == null ? "-" : `${(bps / 100).toFixed(2)}%`);
export const label = (s: string) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
