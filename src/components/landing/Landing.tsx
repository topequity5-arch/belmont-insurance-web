"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BRAND } from "@/lib/brand";
import { api, useQuery } from "@/lib/api";
import { getAccessToken } from "@/lib/session";
import type { Me, Plan } from "@/lib/types";
import {
  KINDS,
  calcConfig,
  fmt,
  num,
  priceAt,
  type Kind,
  type PlanCard,
} from "@/lib/quote";
import "./landing.css";

const TOASTS = [
  ["Claim approved", "Auto · 2 hours ago", "🚗"],
  ["Policy activated", "Home · just now", "🏠"],
  ["Payout sent: $1,240", "Health · 18 min ago", "💸"],
  ["New quote saved", "Life · 5 min ago", "🛡️"],
];
const NAMES = [
  "Northwind Motors",
  "Atlas Realty",
  "Meridian Health",
  "Brightpath",
  "Kestrel Auto",
  "Lumen Homes",
  "Orbit Bank",
  "Solace Care",
];

function Counter({ n, s }: { n: number; s: string }) {
  const ref = useRef<HTMLElement>(null);
  const [txt, setTxt] = useState("0");
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(
      (es) => {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const f = (t: number) => {
          const k = Math.min(1, (t - t0) / 1600),
            v = Math.round(n * (1 - Math.pow(1 - k, 4)));
          setTxt((n >= 1e6 ? (v / 1e6).toFixed(1) + "M" : fmt(v)) + s);
          if (k < 1) raf = requestAnimationFrame(f);
        };
        raf = requestAnimationFrame(f);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [n, s]);
  return <b ref={ref}>{txt}</b>;
}

export default function Landing() {
  /* nav */
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 10);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  /* data from the API: public catalog + currently signed-in user (when a session exists) */
  const {
    data: plans,
    loading: plansLoading,
    error: plansError,
  } = useQuery<Plan[]>("/catalog/plans");
  const [me, setMe] = useState<Me | null>(null);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    getAccessToken()
      .then((token) => {
        if (!active) return;
        setHasSession(!!token);
        if (token) {
          api<Me>("/me")
            .then((m) => {
              if (active) setMe(m);
            })
            .catch(() => {
              if (active) setMe(null);
            });
        }
      })
      .catch(() => {
        if (active) setHasSession(null);
      });
    return () => {
      active = false;
    };
  }, []);

  /* quote widget */
  const [type, setType] = useState<Kind>("auto");
  const [cov, setCov] = useState(0);
  const [deductible, setDeductible] = useState<number | null>(null);
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);
  const c = useMemo(() => calcConfig(type, plans), [type, plans]);
  const activeDeductible = c?.deds.some((d) => d.value === deductible)
    ? deductible
    : (c?.deds[0]?.value ?? null);
  const quotePoints =
    c?.pts.filter((point) => point.deductible === activeDeductible) ?? [];
  const quoteMin = quotePoints[0]?.cov ?? c?.min ?? 0;
  const quoteMax = quotePoints[quotePoints.length - 1]?.cov ?? c?.max ?? 0;
  const quoteCov = Math.min(quoteMax, Math.max(quoteMin, cov));
  const p =
    quoteMax > quoteMin
      ? ((quoteCov - quoteMin) / (quoteMax - quoteMin)) * 100
      : 100;
  const sc = Math.round(35 + p * 0.6);
  const price = c ? Math.round(priceAt(c.pts, quoteCov, activeDeductible)) : 0;
  /* Reset the quote controls when the selected coverage or catalog data changes. */
  useEffect(() => {
    setCov(c?.def ?? 0);
    setDeductible(c?.deds[0]?.value ?? null);
  }, [c]);
  useEffect(() => {
    if (c) setCov((v) => Math.min(quoteMax, Math.max(quoteMin, v)));
  }, [c, quoteMin, quoteMax]);
  useEffect(() => {
    const from = shownRef.current,
      t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 500),
        e = 1 - Math.pow(1 - k, 3);
      shownRef.current = Math.round(from + (price - from) * e);
      setShown(shownRef.current);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [price]);

  /* floating toast */
  const [toast, setToast] = useState({ i: 0, on: false });
  useEffect(() => {
    let i = 0,
      iv: ReturnType<typeof setInterval> | undefined;
    const hide: ReturnType<typeof setTimeout>[] = [];
    const show = () => {
      setToast({ i: i++ % TOASTS.length, on: true });
      hide.push(setTimeout(() => setToast((t) => ({ ...t, on: false })), 3200));
    };
    const first = setTimeout(() => {
      show();
      iv = setInterval(show, 5200);
    }, 1800);
    return () => {
      clearTimeout(first);
      if (iv) clearInterval(iv);
      hide.forEach(clearTimeout);
    };
  }, []);

  /* reveal on scroll */
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            el.style.transitionDelay =
              [...(el.parentNode as HTMLElement).children].indexOf(el) * 90 +
              "ms";
            el.classList.add("in");
            io.unobserve(el);
          }
        }),
      { threshold: 0.15 },
    );
    root.current?.querySelectorAll(".rv").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [plans]);

  /* claim tracker */
  const [steps, setSteps] = useState<string[]>(["", "", "", ""]);
  const [pct, setPct] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const tk = useRef<HTMLDivElement>(null);
  const runClaim = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setSteps(["", "", "", ""]);
    setPct(0);
    [0, 1, 2, 3].forEach((i) =>
      timers.current.push(
        setTimeout(
          () => {
            setSteps(
              [0, 1, 2, 3].map((j) => (j < i ? "done" : j === i ? "cur" : "")),
            );
            setPct(Math.round((i / 4) * 100 + 10));
          },
          i * 1500 + 300,
        ),
      ),
    );
    timers.current.push(
      setTimeout(() => {
        setSteps(["done", "done", "done", "done"]);
        setPct(100);
      }, 4800),
    );
  }, []);
  useEffect(() => {
    const el = tk.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => {
        if (es[0].isIntersecting) {
          runClaim();
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      timers.current.forEach(clearTimeout);
    };
  }, [runClaim]);

  /* billing toggle + plans section data */
  const [yearly, setYearly] = useState(false);
  const cards: PlanCard[] = useMemo(() => {
    return (plans ?? []).map((pl) => ({
      id: pl.id,
      name: pl.name,
      tagline: pl.tagline,
      features: pl.features,
      highlighted: pl.highlighted,
      monthly: num(pl.price_monthly_usd),
      yearly: num(pl.price_yearly_usd),
    }));
  }, [plans]);
  const cardPrice = (c: PlanCard) =>
    yearly
      ? c.yearly != null
        ? c.yearly / 12
        : c.monthly
      : (c.monthly ?? (c.yearly != null ? c.yearly / 12 : null));
  const savePct = useMemo(() => {
    const pcts = (plans ?? [])
      .filter((pl) => num(pl.price_monthly_usd) && num(pl.price_yearly_usd))
      .map((pl) =>
        Math.round(
          (1 - num(pl.price_yearly_usd)! / (12 * num(pl.price_monthly_usd)!)) *
            100,
        ),
      );
    return pcts.length
      ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
      : 15;
  }, [plans]);

  const closeMenu = () => setMenu(false);
  const T = TOASTS[toast.i];
  const STEPS = [
    ["Claim submitted", "Photos and details received"],
    ["Reviewed by a claims specialist", "Checked against your policy"],
    ["Approved", "You pay only your $500 deductible"],
    ["Payment sent", "Straight to your bank or garage"],
  ];
  const ICONS: Record<string, React.ReactNode> = {
    Auto: (
      <>
        <path d="M5 17h14M3 13l2-6a2 2 0 0 1 2-1.5h10A2 2 0 0 1 19 7l2 6v4H3z" />
        <circle cx="7.5" cy="17" r="1.5" />
        <circle cx="16.5" cy="17" r="1.5" />
      </>
    ),
    Home: <path d="M3 11 12 3l9 8M5 10v10h14V10M10 20v-6h4v6" />,
    Health: (
      <path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z" />
    ),
    Life: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.5l2.8 2.8L16 9.5" />
      </>
    ),
    Investment: <path d="M3 3v18h18M7 14l4-4 4 4 5-5M16 9h5v5" />,
  };
  const COVER = [
    [
      "Auto",
      "Collision, theft and roadside help, with repairs at 4,000+ trusted garages.",
    ],
    [
      "Home",
      "Fire, flood, break-ins and your belongings, covered at replacement value.",
    ],
    [
      "Health",
      "Doctor visits, prescriptions and hospital stays with a clear, flat copay.",
    ],
    [
      "Life",
      "Income protection for the people who rely on you, approved in one video call.",
    ],
    [
      "Investment",
      "Protection for portfolios and capital against brokerage insolvency, fraud, or market tail risks.",
    ],
  ];
  return (
    <div className="lp" ref={root}>
      <nav id="nav" className={scrolled ? "s" : ""}>
        <div className="wrap nv">
          <a href="#" className="logo" aria-label={`${BRAND} home`}>
            <img src="/logo.jpeg" alt="Logo" width="30" height="30" />
            {BRAND}
          </a>
          <div className={menu ? "links o" : "links"} id="links">
            <a href="#coverage" onClick={closeMenu}>
              Coverage
            </a>
            <a href="#claims" onClick={closeMenu}>
              Claims
            </a>
            <a href="#plans" onClick={closeMenu}>
              Plans
            </a>
            <a href="#reviews" onClick={closeMenu}>
              Reviews
            </a>
            <a href="#faq" onClick={closeMenu}>
              FAQ
            </a>
            {hasSession === true ? (
              <Link href="/portal" onClick={closeMenu}>
                {me
                  ? `Hi, ${me.full_name?.split(" ")[0] || me.email}`
                  : "My account"}
              </Link>
            ) : hasSession === false ? (
              <Link href="/login" onClick={closeMenu}>
                Sign in
              </Link>
            ) : null}
            <a
              href="#quote"
              className="btn btn-p"
              style={{ padding: "10px 22px" }}
              onClick={closeMenu}
            >
              {hasSession ? "My plans" : "Get a quote"}
            </a>
            <Link href="/about" onClick={closeMenu}>
              About
            </Link>
            <Link href="/contact" onClick={closeMenu}>
              Contact
            </Link>
          </div>
          <button
            className="burger"
            id="burger"
            aria-label="Toggle menu"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </nav>

      <header className="hero">
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="wrap hg">
          <div>
            <span className="pill rise">
              <span
                style={{
                  background: "var(--mist)",
                  padding: "2px 10px",
                  borderRadius: 99,
                  fontWeight: 600,
                  color: "var(--ink)",
                }}
              >
                New
              </span>{" "}
              Claims paid in under 24 hours <i />
            </span>
            <h1 className="rise">
              Cover that keeps up with <span className="u">your life.</span>
            </h1>
            <p className="lead rise">
              Auto, home, health and life insurance you can price, buy and
              manage in minutes. No jargon, no hold music, no surprises at claim
              time.
            </p>
            <div className="cta rise">
              <a href="#quote" className="btn btn-p">
                Get my quote
              </a>
              <a href="#claims" className="btn btn-g">
                See how claims work
              </a>
            </div>
            <div className="rate rise">
              <span className="stars" aria-hidden="true">
                ★★★★★
              </span>
              <span>
                <b>4.8</b> from 52,000+ customer reviews
              </span>
            </div>
          </div>

          <div className="qw" id="quote">
            <div className="tabs" role="tablist" aria-label="Insurance type">
              <span
                className="th"
                style={{
                  transform: `translateX(${KINDS.indexOf(type) * 100}%)`,
                }}
              />
              {KINDS.map((k) => (
                <button
                  key={k}
                  role="tab"
                  aria-selected={type === k}
                  onClick={() => setType(k)}
                >
                  {k[0].toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
            <div className="qm">
              <div className="qring" aria-hidden="true">
                <svg width="112" height="112" viewBox="0 0 112 112">
                  <defs>
                    <linearGradient id="lp-g" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#0c2d48" />
                      <stop offset="1" stopColor="#ff6b57" />
                    </linearGradient>
                  </defs>
                  <circle className="tr" cx="56" cy="56" r="48" />
                  <circle
                    className="pg"
                    cx="56"
                    cy="56"
                    r="48"
                    strokeDasharray="301.6"
                    style={{ strokeDashoffset: 301.6 * (1 - sc / 100) }}
                  />
                </svg>
                <b>{sc}</b>
              </div>
              <div>
                <div className="price" aria-live="polite">
                  {c ? (
                    <>
                      $
                      <span style={{ font: "inherit", color: "inherit" }}>
                        {shown}
                      </span>
                      <span>/mo</span>
                    </>
                  ) : (
                    "—"
                  )}
                </div>
                <p>
                  {c?.note ??
                    (plansLoading
                      ? "Loading plan prices…"
                      : plansError
                        ? "Quote pricing is temporarily unavailable."
                        : `No ${type} plans are currently available.`)}
                </p>
              </div>
            </div>
            {c && (
              <>
                <label className="sl" htmlFor="cov">
                  <span>{c.label}</span>
                  <output>${fmt(quoteCov)}</output>
                </label>
                <input
                  type="range"
                  id="cov"
                  min={quoteMin}
                  max={quoteMax}
                  step={quoteMax > quoteMin ? c.step : 1}
                  value={quoteCov}
                  onChange={(e) => setCov(+e.target.value)}
                  style={{ ["--p" as string]: p + "%" } as React.CSSProperties}
                />
                {c.deds.length > 1 && (
                  <div className="ded" role="group" aria-label="Deductible">
                    <span>Deductible</span>
                    {c.deds.map((d) => (
                      <button
                        key={d.label}
                        aria-pressed={activeDeductible === d.value}
                        onClick={() => setDeductible(d.value)}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            {c && (
              <a
                href={hasSession ? "/portal/plans" : "#plans"}
                className="btn btn-p"
              >
                Continue with this quote
              </a>
            )}
            <div className={toast.on ? "toast on" : "toast"} role="status">
              <i>{T[2]}</i>
              <div>
                <span>{T[0]}</span>
                <small>{T[1]}</small>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mq" aria-hidden="true">
        <div className="mt">
          {[...NAMES, ...NAMES].map((n, i) => (
            <span key={i}>{n}</span>
          ))}
        </div>
      </div>

      <section id="coverage">
        <div className="wrap">
          <div className="sh">
            <h2>One home for everything you want protected</h2>
            <p>
              Bundle two or more policies and save up to 25%. Change or pause
              any of them from your phone.
            </p>
          </div>
          <div className="cg">
            {COVER.map(([t, d]) => (
              <article className="cc rv" key={t}>
                <div className="ci">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {ICONS[t]}
                  </svg>
                </div>
                <h3>{t}</h3>
                <p>{d}</p>
                <a href="#quote">
                  Price {t.toLowerCase()} <span>→</span>
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="claims" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="cl">
            <div className="sh">
              <h2>File a claim in three taps. Watch it move.</h2>
              <p>
                Snap photos, confirm the details and track every step live. Most
                straightforward claims are paid within a day.
              </p>
              <button className="btn btn-p" onClick={runClaim}>
                Replay a sample claim
              </button>
            </div>
            <div className="tk" aria-live="polite" ref={tk}>
              <div className="tkh">
                <span>
                  Claim <b>#CL-20418</b> · Windscreen damage
                </span>
                <b>{pct}%</b>
              </div>
              {STEPS.map(([t, s], i) => (
                <div className={`st ${steps[i]}`.trim()} key={t}>
                  <span className="dot">{i + 1}</span>
                  <div>
                    <b>{t}</b>
                    <small>{s}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sg">
            <div>
              <Counter n={2400000} s="+" />
              <span>customers protected</span>
            </div>
            <div>
              <Counter n={98} s="%" />
              <span>claims paid on first review</span>
            </div>
            <div>
              <Counter n={19} s=" hrs" />
              <span>average payout time</span>
            </div>
            <div>
              <Counter n={25} s="%" />
              <span>average bundle savings</span>
            </div>
          </div>
        </div>
      </section>

      <section
        id="plans"
        style={{ background: "#fff", borderBlock: "1px solid var(--line)" }}
      >
        <div className="wrap">
          <div className="sh">
            <h2>Simple plans. Pick the cover that fits.</h2>
            <p>
              Every plan includes 24/7 support, instant digital proof of cover
              and no cancellation fees.
            </p>
          </div>
          <div className="pt" role="group" aria-label="Billing">
            <button aria-pressed={!yearly} onClick={() => setYearly(false)}>
              Monthly
            </button>
            <button aria-pressed={yearly} onClick={() => setYearly(true)}>
              Yearly
              {!plansLoading && !plansError && savePct > 0 && (
                <em>Save {savePct}%</em>
              )}
            </button>
          </div>
          {plansLoading && (
            <p style={{ color: "var(--ink2)", marginBottom: 20 }}>
              Loading plans…
            </p>
          )}
          {plansError && (
            <p style={{ color: "var(--ink2)", marginBottom: 20 }}>
              Could not load plans right now. Please try again later.
            </p>
          )}
          {!plansLoading && !plansError && !cards.length && (
            <p style={{ color: "var(--ink2)", marginBottom: 20 }}>
              There are no active plans available right now.
            </p>
          )}
          <div className="pg3">
            {cards.map((pl) => {
              const price = cardPrice(pl);
              return (
                <div
                  className={pl.highlighted ? "pl f rv" : "pl rv"}
                  key={pl.id}
                >
                  {pl.highlighted && <span className="tag">Most popular</span>}
                  <h3>{pl.name}</h3>
                  <div className="a">
                    $
                    {price != null && (
                      <span style={{ font: "inherit", opacity: 1 }}>
                        {fmt(Math.round(price))}
                      </span>
                    )}
                    <span>/mo</span>
                  </div>
                  <p
                    style={
                      pl.highlighted
                        ? { opacity: 0.85 }
                        : { color: "var(--ink2)" }
                    }
                  >
                    {pl.tagline}
                  </p>
                  <ul>
                    {pl.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <Link
                    href={hasSession ? "/portal/plans" : "/register"}
                    className="btn"
                  >
                    Choose {pl.name}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="reviews">
        <div className="wrap">
          <div className="sh">
            <h2>People remember how you treat them on their worst day</h2>
          </div>
          <div className="tg">
            {[
              [
                "#0c2d48",
                "SM",
                "Sarah M.",
                "Auto policyholder",
                "My car was hit on a Friday night. The claim was approved Saturday morning and the garage had it fixed by Tuesday.",
              ],
              [
                "#ff6b57",
                "DK",
                "Daniel K.",
                "Home and life",
                "I bundled home and life in ten minutes. It saved us $41 a month and the paperwork was just a few taps.",
              ],
              [
                "#16a870",
                "AR",
                "Amara R.",
                "Home policyholder",
                "After a burst pipe I expected weeks of calls. A real person phoned me within the hour and handled everything.",
              ],
            ].map(([bg, ini, n, r, q]) => (
              <figure className="tq rv" key={ini}>
                <span className="stars">★★★★★</span>
                <p>{q}</p>
                <div className="au">
                  <i style={{ background: bg }}>{ini}</i>
                  <div>
                    {n}
                    <small>{r}</small>
                  </div>
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sh">
            <h2>Questions, answered</h2>
          </div>
          <div className="fq">
            <details>
              <summary>How fast can I get covered?</summary>
              <p>
                Most customers are covered the same day. Complete the quote,
                pay, and your digital proof of insurance arrives instantly.
              </p>
            </details>
            <details>
              <summary>Can I cancel any time?</summary>
              <p>
                Yes. Cancel whenever you like with no fees, and we refund the
                unused portion of your premium.
              </p>
            </details>
            <details>
              <summary>How do claims get paid?</summary>
              <p>
                Approved claims are paid directly to you or to the repairer,
                whichever you prefer. Most are settled within 24 hours.
              </p>
            </details>
            <details>
              <summary>Will my price change after I buy?</summary>
              <p>
                Your rate is locked for the full policy term. At renewal we show
                you the new price before anything is charged.
              </p>
            </details>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="fc">
            <h2>Find out what you could save in 30 seconds</h2>
            <p>No paperwork and no obligation. Just a clear price.</p>
            <a href="#quote" className="btn">
              Get my quote
            </a>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="fg">
            <div>
              <a href="#" className="logo" style={{ marginBottom: 10 }}>
                <img src="/logo.jpeg" alt="Logo" width="26" height="26" />
                {BRAND}
              </a>
              <p>Modern insurance, built around people.</p>
            </div>
            <div>
              <h4>Cover</h4>
              <a href="#coverage">Auto</a>
              <a href="#coverage">Home</a>
              <a href="#coverage">Health</a>
              <a href="#coverage">Life</a>
              <a href="#coverage">Investment</a>
            </div>
            <div>
              <h4>Company</h4>
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
              <a href="#reviews">Reviews</a>
              <a href="#">Press</a>
            </div>
            <div>
              <h4>Help</h4>
              <a href="#faq">FAQ</a>
              <a href="#claims">Make a claim</a>
              <Link href="/contact">Contact</Link>
              <a href="#">Privacy</a>
            </div>
          </div>
          <p className="fine">
            © {new Date().getFullYear()} {BRAND}. Quotes shown are estimates and
            not an offer of cover.
          </p>
        </div>
      </footer>
    </div>
  );
}
