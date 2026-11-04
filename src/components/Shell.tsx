"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
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
  const perms = new Set(me?.permissions ?? []);
  const allowed = (i: NavItem) => !i.perm || perms.has("*") || perms.has(i.perm);
  return (
    <div className="min-h-screen md:grid md:grid-cols-[250px_1fr]">
      <aside className={`${area === "admin" ? "bg-ink" : "bg-white border-r border-line"} p-5 md:sticky md:top-0 md:h-screen md:overflow-y-auto`}>
        <Link href={area === "admin" ? "/admin" : "/portal"}><Logo light={area === "admin"} /></Link>
        {area === "admin" && <p className="mt-1 text-xs text-white/60">Operations console</p>}
        <nav aria-label="Main" className="mt-6 flex gap-1 overflow-x-auto md:flex-col">
          {nav.filter(allowed).map((i) => {
            const on = i.exact ? path === i.href : path.startsWith(i.href);
            const base = area === "admin" ? (on ? "bg-white/15 text-white" : "text-white/70 hover:text-white") : on ? "bg-mist text-ink" : "text-ink2 hover:text-ink";
            return <Link key={i.href} href={i.href} aria-current={on ? "page" : undefined} className={`whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold ${base}`}>{i.label}</Link>;
          })}
        </nav>
        <div className="mt-6 hidden text-sm md:block">
          {me && <p className={`truncate ${area === "admin" ? "text-white/70" : "text-ink2"}`}>{me.full_name || me.email}</p>}
          {me && me.role !== "client" && area === "client" && <Link href="/admin" className="mt-2 block font-semibold text-brand-d">Open admin console</Link>}
          {area === "admin" && <Link href="/portal" className="mt-2 block font-semibold text-white">Client portal</Link>}
          <button className={`mt-2 font-semibold ${area === "admin" ? "text-white/80" : "text-ink2"}`} onClick={async () => {
            setLogoutError(null);
            try {
              await api("/auth/logout", { method: "POST" });
              clearSession();
              router.push("/login");
              router.refresh();
            } catch (e) {
              setLogoutError((e as Error).message);
            }
          }}>Sign out</button>
          <ErrorNote message={logoutError} />
        </div>
      </aside>
      <div>
        <header className="flex justify-end border-b border-line bg-white/70 px-6 py-3 backdrop-blur"><Bell /></header>
        <main className="mx-auto max-w-6xl p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
