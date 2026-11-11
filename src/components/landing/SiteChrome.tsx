"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { BRAND } from "@/lib/brand";
import { getAccessToken } from "@/lib/session";
import type { Me } from "@/lib/types";
import "./landing.css";

/**
 * Shared marketing chrome (nav + footer) for public pages such as /about and
 * /contact, so they carry the exact same theme as the landing page.
 * Anchor links (#coverage, …) are prefixed with "/" when not on the home page.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const anchor = (hash: string) => (onHome ? hash : `/${hash}`);

  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 10);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    let active = true;
    getAccessToken()
      .then((token) => {
        if (!active) return;
        setHasSession(!!token);
        if (token) api<Me>("/me").then((m) => { if (active) setMe(m); }).catch(() => { if (active) setMe(null); });
      })
      .catch(() => { if (active) setHasSession(null); });
    return () => { active = false; };
  }, []);

  const closeMenu = () => setMenu(false);

  return (
    <div className="lp">
      <nav id="nav" className={scrolled ? "s" : ""}>
        <div className="wrap nv">
          <Link href="/" className="logo" aria-label={`${BRAND} home`}><img src="/logo.jpeg" alt="Logo" width="30" height="30" />{BRAND}</Link>
          <div className={menu ? "links o" : "links"} id="links">
            <a href={anchor("#coverage")} onClick={closeMenu}>Coverage</a>
            <a href={anchor("#claims")} onClick={closeMenu}>Claims</a>
            <a href={anchor("#plans")} onClick={closeMenu}>Plans</a>
            <a href={anchor("#reviews")} onClick={closeMenu}>Reviews</a>
            <a href={anchor("#faq")} onClick={closeMenu}>FAQ</a>
            <Link href="/about" onClick={closeMenu}>About</Link>
            <Link href="/contact" onClick={closeMenu}>Contact</Link>
            {hasSession === true
              ? <Link href="/portal" onClick={closeMenu}>{me ? `Hi, ${me.full_name?.split(" ")[0] || me.email}` : "My account"}</Link>
              : hasSession === false ? <Link href="/login" onClick={closeMenu}>Sign in</Link> : null}
            <a href={anchor("#quote")} className="btn btn-p" style={{ padding: "10px 22px" }} onClick={closeMenu}>{hasSession ? "My plans" : "Get a quote"}</a>
          </div>
          <button className="burger" id="burger" aria-label="Toggle menu" aria-expanded={menu} onClick={() => setMenu(!menu)}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </div>
      </nav>

      {children}

      <footer><div className="wrap">
        <div className="fg">
          <div><Link href="/" className="logo" style={{ marginBottom: 10 }}><img src="/logo.jpeg" alt="Logo" width="26" height="26" />{BRAND}</Link><p>Modern insurance, built around people.</p></div>
          <div><h4>Cover</h4><a href={anchor("#coverage")}>Auto</a><a href={anchor("#coverage")}>Home</a><a href={anchor("#coverage")}>Health</a><a href={anchor("#coverage")}>Life</a><a href="#coverage">Investment</a></div>
          <div><h4>Company</h4><Link href="/about">About</Link><Link href="/contact">Contact</Link><a href={anchor("#reviews")}>Reviews</a><a href="#">Press</a></div>
          <div><h4>Help</h4><a href={anchor("#faq")}>FAQ</a><a href={anchor("#claims")}>Make a claim</a><Link href="/contact">Contact</Link><a href="#">Privacy</a></div>
        </div>
        <p className="fine">© {new Date().getFullYear()} {BRAND}. Quotes shown are estimates and not an offer of cover.</p>
      </div></footer>
    </div>
  );
}

/** Adds the landing page's scroll-reveal behaviour (".rv" -> ".rv.in") to a container ref. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) {
        const el = e.target as HTMLElement;
        el.style.transitionDelay = [...(el.parentNode as HTMLElement).children].indexOf(el) * 90 + "ms";
        el.classList.add("in");
        io.unobserve(el);
      }
    }), { threshold: 0.15 });
    ref.current?.querySelectorAll(".rv").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}