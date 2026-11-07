"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { Logo } from "./Logo";
import { useQuery, api } from "@/lib/api";
import { clearSession } from "@/lib/session";
import type { Me, Notification } from "@/lib/types";
import { dateTime } from "@/lib/format";
import { ErrorNote } from "./ui";

export type NavItem = { href: string; label: string; perm?: string; exact?: boolean };

function Bell() {
  const { data, reload } = useQuery<Notification[]>("/notifications");
  const [open, setOpen] = useState(false);
  const unread = (data ?? []).filter((n) => !n.read_at).length;
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} aria-label={`Notifications, ${unread} unread`} className="relative rounded-full border border-line bg-white px-3 py-2 text-sm font-semibold">
        Notifications{unread > 0 && <span className="ml-2 rounded-full bg-coral px-1.5 py-0.5 text-xs text-white">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-2xl border border-line bg-white p-2 shadow-xl">
          {(data ?? []).length === 0 && <p className="p-4 text-sm text-ink2">Nothing new.</p>}
          <div className="max-h-96 overflow-auto">
            {(data ?? []).map((n) => (
              <Link key={n.id} href={n.link ?? "#"} onClick={async () => { await api(`/notifications/${n.id}/read`, { method: "POST" }); setOpen(false); reload(); }}
                className={`block rounded-xl p-3 text-sm hover:bg-mist ${n.read_at ? "text-ink2" : "font-semibold"}`}>
                {n.title}<span className="block text-xs font-normal text-ink2">{n.body} · {dateTime(n.created_at)}</span>
              </Link>
            ))}
          </div>
          {unread > 0 && <button className="w-full rounded-xl p-2 text-xs font-semibold text-brand-d hover:bg-mist" onClick={async () => { await api("/notifications/read-all", { method: "POST" }); reload(); }}>Mark all as read</button>}
        </div>
      )}
    </div>
  );
}

export function Shell({ nav, children, area }: { nav: NavItem[]; children: ReactNode; area: "client" | "admin" }) {
  const path = usePathname();
  const router = useRouter();
  const { data: me } = useQuery<Me>("/me");
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const perms = new Set(me?.permissions ?? []);
  const allowed = (i: NavItem) => !i.perm || perms.has("*") || perms.has(i.perm);
  const items = nav.filter(allowed).map((i) => ({ ...i, on: i.exact ? path === i.href : path.startsWith(i.href) }));
  const home = area === "admin" ? "/admin" : "/portal";

  useEffect(() => { setMenuOpen(false); }, [path]);

  const tone = (on: boolean) =>
    area === "admin" ? (on ? "bg-white/15 text-white" : "text-white/70 hover:text-white") : on ? "bg-mist text-ink" : "text-ink2 hover:text-ink";

  const logout = async () => {
    setLogoutError(null);
    try {
      await api("/auth/logout", { method: "POST" });
      clearSession();
      router.push("/login");
      router.refresh();
    } catch (e) {
      setLogoutError((e as Error).message);
    }
  };

  const navLinks = (extra: string) => items.map((i) => (
    <Link key={i.href} href={i.href} aria-current={i.on ? "page" : undefined} onClick={() => setMenuOpen(false)}
      className={`rounded-xl px-3.5 py-2.5 text-sm font-semibold ${tone(i.on)} ${extra}`}>
      {i.label}
    </Link>
  ));

  const accountBlock = (
    <>
      {me && <p className={`truncate ${area === "admin" ? "text-white/70" : "text-ink2"}`}>{me.full_name || me.email}</p>}
      {me && me.role !== "client" && area === "client" && <Link href="/admin" onClick={() => setMenuOpen(false)} className="mt-2 block font-semibold text-brand-d">Open admin console</Link>}
      {area === "admin" && <Link href="/portal" onClick={() => setMenuOpen(false)} className="mt-2 block font-semibold text-white">Client portal</Link>}
      <button className={`mt-2 font-semibold ${area === "admin" ? "text-white/80" : "text-ink2"}`} onClick={logout}>Sign out</button>
      <ErrorNote message={logoutError} />
    </>
  );

  return (
    <div className="min-h-screen md:grid md:grid-cols-[250px_1fr]">
      <div className={`sticky top-0 z-30 md:hidden ${area === "admin" ? "bg-ink" : "border-b border-line bg-white"}`}>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Link href={home} onClick={() => setMenuOpen(false)}><Logo light={area === "admin"} /></Link>
          <button type="button" onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen} aria-controls="mobile-nav" aria-label={menuOpen ? "Close menu" : "Open menu"}
            className={`rounded-xl p-2.5 ${area === "admin" ? "text-white hover:bg-white/10" : "text-ink hover:bg-mist"}`}>
            {menuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            )}
          </button>
        </div>
        {menuOpen && (
          <div id="mobile-nav" className={`max-h-[calc(100dvh-4.25rem)] overflow-y-auto border-t px-4 py-3 ${area === "admin" ? "border-white/10" : "border-line"}`}>
            <nav aria-label="Main" className="flex flex-col gap-1">{navLinks("block")}</nav>
            <div className={`mt-4 border-t pt-3 text-sm ${area === "admin" ? "border-white/10" : "border-line"}`}>{accountBlock}</div>
          </div>
        )}
      </div>
      <aside className={`hidden p-5 md:sticky md:top-0 md:block md:h-screen md:overflow-y-auto ${area === "admin" ? "bg-ink" : "bg-white border-r border-line"}`}>
        <Link href={home}><Logo light={area === "admin"} /></Link>
        {area === "admin" && <p className="mt-1 text-xs text-white/60">Operations console</p>}
        <nav aria-label="Main" className="mt-6 flex flex-col gap-1">{navLinks("whitespace-nowrap")}</nav>
        <div className="mt-6 text-sm">{accountBlock}</div>
      </aside>
      <div>
        <header className="flex justify-end border-b border-line bg-white/70 px-6 py-3 backdrop-blur"><Bell /></header>
        <main className="mx-auto max-w-6xl p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
