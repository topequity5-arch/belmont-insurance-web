"use client";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { SiteChrome, useReveal } from "./SiteChrome";

const VALUES: [string, string, React.ReactNode][] = [
  ["Transparent by default", "Plain-language policies and upfront pricing. You always know what is covered before you pay.",
    <><path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z" /><path d="M9 12l2 2 4-4" /></>],
  ["Claims in hours, not weeks", "Most claims are reviewed and paid within 24 hours, with a live tracker from submission to payout.",
    <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>],
  ["Fair, flat pricing", "One clear price per plan. No hidden fees, no jargon, no small print surprises at renewal.",
    <><path d="M12 3v18M17 6.5C17 5 14.8 4 12 4s-5 1-5 2.5S9 9 12 9s5 1 5 2.5S14.8 14 12 14s-5 1-5 2.5S9 19 12 19s5-1 5-2.5" /></>],
  ["Humans when you need them", "Real support specialists on chat, phone and email — plus a contact form that actually reaches us.",
    <><path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z" /><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" /></>],
];

const STATS: [string, string][] = [
  ["30s", "average time to a quote"],
  ["24h", "median claim payout time"],
  ["4.9/5", "customer satisfaction rating"],
  ["120k+", "policies currently active"],
];

export default function AboutPage() {
  const root = useReveal<HTMLDivElement>();
  return (
    <SiteChrome>
      <div ref={root}>
        <header className="hero">
          <div className="blob b1" /><div className="blob b2" />
          <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
            <span className="pill rise"><span style={{ background: "var(--mist)", padding: "2px 10px", borderRadius: 99, fontWeight: 600, color: "var(--ink)" }}>Our story</span> Built for the people we cover <i /></span>
            <h1 className="rise">Insurance that puts <span className="u">people first.</span></h1>
            <p className="lead rise">{BRAND} was started with a simple idea: buying cover and making a claim should take minutes, not weeks. No jargon, no hold music, no surprises.</p>
            <div className="cta rise">
              <Link href="/#quote" className="btn btn-p">Get my quote</Link>
              <Link href="/contact" className="btn btn-g">Talk to us</Link>
            </div>
          </div>
        </header>

        <section><div className="wrap">
          <div className="sh rv"><h2>Our mission</h2><p>We believe insurance is a promise, and a promise should be easy to keep. So we built a platform where pricing is transparent, claims are tracked live, and payouts land in hours — with real humans behind every decision.</p></div>
          <div className="sg rv">
            {STATS.map(([b, s]) => <div key={s}><b>{b}</b><span>{s}</span></div>)}
          </div>
        </div></section>

        <section style={{ paddingTop: 0 }}><div className="wrap">
          <div className="sh rv"><h2>What we stand for</h2><p>Four principles shape every policy we sell and every claim we pay.</p></div>
          <div className="cg">
            {VALUES.map(([t, d, icon]) => (
              <article className="cc rv" key={t}>
                <div className="ci"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icon}</svg></div>
                <h3>{t}</h3><p>{d}</p>
              </article>
            ))}
          </div>
        </div></section>

        <section style={{ paddingTop: 0 }}><div className="wrap"><div className="fc rv">
          <h2>Ready to protect what matters most?</h2>
          <p>Get a price in 30 seconds — no paperwork, no obligation.</p>
          <Link href="/#quote" className="btn">Get my quote</Link>
        </div></div></section>
      </div>
    </SiteChrome>
  );
}