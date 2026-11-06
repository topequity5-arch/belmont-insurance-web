import type { Plan } from "./types";

export const fmt = (n: number) => n.toLocaleString("en-US");
export const num = (v: string | number | null | undefined) => (v == null ? null : Number(v));

/* ---------- quote calculator, driven by real catalog plans ---------- */
export type Kind = "auto" | "home" | "health" | "life" | "investment";
export const KINDS: Kind[] = ["auto", "home", "health", "life", "investment"];

export type CalcCfg = {
  min: number; max: number; step: number; def: number;
  label: string; note: string;
  pts: { cov: number; price: number; deductible: number | null }[];
  deds: { label: string; value: number | null }[];
};

export function niceStep(range: number): number {
  const raw = range / 20;
  const mag = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const n = raw / mag;
  return (n >= 5 ? 5 : n >= 2 ? 2 : 1) * mag;
}

/* Build calculator ranges and prices from active catalog plans. */
export function calcConfig(kind: Kind, plans: Plan[] | null): CalcCfg | null {
  const cat = (plans ?? []).filter((p) => p.product.category === kind);
  const eligible = cat.flatMap((plan) => {
    const cov = num(plan.coverage_usd);
    const monthly = num(plan.price_monthly_usd);
    const yearly = num(plan.price_yearly_usd);
    const price = monthly ?? (yearly == null ? null : yearly / 12);
    return cov == null || price == null ? [] : [{
      plan,
      point: { cov, price, deductible: num(plan.deductible_usd) },
    }];
  });
  const pts = eligible.map(({ point }) => point);
  if (!pts.length) return null;
  pts.sort((a, b) => a.cov - b.cov);
  const min = pts[0].cov, max = pts[pts.length - 1].cov;
  const step = max > min ? niceStep(max - min) : 1;
  const hl = eligible.find(({ plan }) => plan.highlighted)?.plan ?? eligible[0].plan;
  const dedVals = [...new Set(pts.map((point) => point.deductible))]
    .sort((a, b) => (b ?? -Infinity) - (a ?? -Infinity));
  const deds = dedVals.map((d) => ({ label: d == null ? "Standard" : `$${fmt(d)}`, value: d }));
  const rawDef = Math.min(Math.max(num(hl.coverage_usd) ?? min, min), max);
  return {
    min, max, step, def: Math.min(max, min + Math.round((rawDef - min) / step) * step),
    label: `${hl.product.name} coverage`, note: hl.tagline || hl.product.description,
    pts, deds,
  };
}

/* Interpolate monthly price only across plans with the selected deductible. */
export function priceAt(pts: CalcCfg["pts"], cov: number, deductible: number | null): number {
  const byCoverage = new Map<number, number>();
  for (const point of pts) {
    if (point.deductible !== deductible) continue;
    byCoverage.set(point.cov, Math.min(byCoverage.get(point.cov) ?? Infinity, point.price));
  }
  const curve = [...byCoverage].map(([coverage, price]) => ({ cov: coverage, price })).sort((a, b) => a.cov - b.cov);
  if (!curve.length) return 0;
  if (cov <= curve[0].cov) return curve[0].price;
  const last = curve[curve.length - 1];
  if (cov >= last.cov) return last.price;
  for (let i = 1; i < curve.length; i++) {
    if (cov <= curve[i].cov) {
      const a = curve[i - 1], b = curve[i];
      return a.price + ((cov - a.cov) / (b.cov - a.cov)) * (b.price - a.price);
    }
  }
  return last.price;
}

export type PlanCard = { id: string; name: string; tagline: string; features: string[]; highlighted: boolean; monthly: number | null; yearly: number | null };
