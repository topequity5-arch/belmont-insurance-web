import type { Plan } from "./types";

export const fmt = (n: number) => n.toLocaleString("en-US");
export const num = (v: string | number | null | undefined) => (v == null ? null : Number(v));

/* ---------- quote calculator, driven by real catalog plans ---------- */
export type Kind = "auto" | "home" | "health" | "life";
export const KINDS: Kind[] = ["auto", "home", "health", "life"];

/* Static fallback used only while the catalog API is unreachable. */
const C: Record<Kind, { min: number; max: number; step: number; def: number; base: number; rate: number; l: string; n: string }> = {
  auto: { min: 10000, max: 100000, step: 5000, def: 50000, base: 18, rate: 0.0007, l: "Liability coverage", n: "Collision, theft and roadside" },
  home: { min: 100000, max: 1000000, step: 25000, def: 400000, base: 12, rate: 0.00008, l: "Rebuild value", n: "Structure and belongings" },
  health: { min: 50000, max: 500000, step: 10000, def: 200000, base: 40, rate: 0.0004, l: "Annual benefit limit", n: "Doctor, drugs and hospital" },
  life: { min: 100000, max: 2000000, step: 50000, def: 500000, base: 8, rate: 0.00004, l: "Death benefit", n: "20-year term cover" },
};

export type CalcCfg = {
  min: number; max: number; step: number; def: number;
  label: string; note: string;
  pts: { cov: number; price: number }[]; // real (coverage, monthly price) points from the catalog
  deds: { label: string; value: number; factor: number }[];
};

export function niceStep(range: number): number {
  const raw = range / 20;
  const mag = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const n = raw / mag;
  return (n >= 5 ? 5 : n >= 2 ? 2 : 1) * mag;
}

/* Build the calculator config for a kind from real catalog plans; fall back to static data. */
export function calcConfig(kind: Kind, plans: Plan[] | null): CalcCfg {
  const cat = (plans ?? []).filter((p) => p.product.category === kind && num(p.coverage_usd) != null && num(p.price_monthly_usd) != null);
  if (!cat.length) {
    const c = C[kind];
    return {
      min: c.min, max: c.max, step: c.step, def: c.def, label: c.l, note: c.n, pts: [],
      deds: [[250, 1.12], [500, 1], [1000, 0.88]].map(([value, factor]) => ({ label: `$${fmt(value)}`, value, factor })),
    };
  }
  const pts = cat.map((p) => ({ cov: num(p.coverage_usd)!, price: num(p.price_monthly_usd)! })).sort((a, b) => a.cov - b.cov);
  const min = pts[0].cov, max = pts[pts.length - 1].cov;
  const step = max > min ? niceStep(max - min) : 1;
  const hl = cat.find((p) => p.highlighted) ?? cat[Math.floor(cat.length / 2)];
  const dedVals = [...new Set((plans ?? []).filter((p) => p.product.category === kind).map((p) => num(p.deductible_usd)).filter((d): d is number => d != null))].sort((a, b) => b - a);
  const maxD = dedVals[0] ?? 0;
  const deds = (dedVals.length ? dedVals : [500]).map((d) => ({
    label: `$${fmt(d)}`, value: d,
    factor: maxD > 0 ? Math.round((1.15 - 0.3 * (d / maxD)) * 100) / 100 : 1,
  }));
  const rawDef = Math.min(Math.max(num(hl.coverage_usd) ?? min, min), max);
  return {
    min, max, step, def: Math.min(max, min + Math.round((rawDef - min) / step) * step),
    label: `${cat[0].product.name} coverage`, note: hl.tagline || cat[0].product.description,
    pts, deds,
  };
}

/* Static fallback monthly price (linear in coverage) used only when no real plans are loaded. */
export function fallbackBase(kind: Kind, cov: number): number {
  const c = C[kind];
  return c.base + cov * c.rate;
}

/* Linear interpolation of monthly price over the real plan coverage points. */
export function priceAt(pts: { cov: number; price: number }[], cov: number): number {
  if (!pts.length) return 0;
  if (cov <= pts[0].cov) return pts[0].price;
  const last = pts[pts.length - 1];
  if (cov >= last.cov) return last.price;
  for (let i = 1; i < pts.length; i++) {
    if (cov <= pts[i].cov) {
      const a = pts[i - 1], b = pts[i];
      return a.price + ((cov - a.cov) / (b.cov - a.cov)) * (b.price - a.price);
    }
  }
  return last.price;
}

export type PlanCard = { id: string; name: string; tagline: string; features: string[]; highlighted: boolean; monthly: number | null; yearly: number | null };
export const FALLBACK_PLANS: PlanCard[] = [
  { id: "essential", name: "Essential", tagline: "The basics, done right.", features: ["Core protection", "Online claims", "Email and chat support"], highlighted: false, monthly: 29, yearly: 296 },
  { id: "plus", name: "Plus", tagline: "Our best balance of cover and price.", features: ["Everything in Essential", "Priority 24-hour claims", "Replacement-value cover", "Free roadside and home assistance"], highlighted: true, monthly: 59, yearly: 602 },
  { id: "premier", name: "Premier", tagline: "Maximum cover for the whole household.", features: ["Everything in Plus", "Dedicated claims manager", "Worldwide cover", "Zero deductible option"], highlighted: false, monthly: 99, yearly: 1010 },
];
