"use client";
import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { BRAND, COMPANY_ADDRESS, COMPANY_PHONE, SUPPORT_EMAIL } from "@/lib/brand";
import { SiteChrome } from "./SiteChrome";

type Status = "idle" | "sending" | "sent" | "error";

const INFO: [string, React.ReactNode, React.ReactNode][] = [
  ["Visit us", <><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
    <>{COMPANY_ADDRESS.map((line) => <span key={line} style={{ display: "block" }}>{line}</span>)}</>],
  ["Email us", <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
    <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "var(--blue)", fontWeight: 600 }}>{SUPPORT_EMAIL}</a>],
  ["Call us", <><path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></>,
    <>{COMPANY_PHONE}<span style={{ display: "block", color: "var(--ink2)", fontSize: ".9rem" }}>Mon–Fri, 9:00 AM – 5:00 PM</span></>],
];

export default function ContactPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      await api("/contact", {
        method: "POST",
        body: { name: form.name, email: form.email, subject: form.subject || undefined, message: form.message },
      });
      setStatus("sent");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <SiteChrome>
      <header className="hero">
        <div className="blob b1" /><div className="blob b2" />
        <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
          <span className="pill rise"><span style={{ background: "var(--mist)", padding: "2px 10px", borderRadius: 99, fontWeight: 600, color: "var(--ink)" }}>Contact</span> We reply within one business day <i /></span>
          <h1 className="rise">Let's talk about <span className="u">your cover.</span></h1>
          <p className="lead rise">Questions about a plan, a claim or a payment? Send us a message — or find us at our office below.</p>
        </div>
      </header>

      <section style={{ paddingTop: 0 }}><div className="wrap">
        <div className="cgrid">
          <aside className="fcard">
            <h2 style={{ fontSize: "1.6rem", marginBottom: 6 }}>Get in touch</h2>
            <p style={{ color: "var(--ink2)", marginBottom: 24 }}>Prefer a direct line? Here is everything you need to reach {BRAND}.</p>
            <div className="meta">
              {INFO.map(([t, icon, body]) => (
                <div key={t}>
                  <div className="ci"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icon}</svg></div>
                  <div><h3>{t}</h3><p>{body}</p></div>
                </div>
              ))}
            </div>
          </aside>

          <form className="fcard" onSubmit={submit}>
            <h2 style={{ fontSize: "1.6rem", marginBottom: 6 }}>Send us a message</h2>
            <p style={{ color: "var(--ink2)", marginBottom: 24 }}>Fill in the form and it goes straight to our team's inbox.</p>

            {status === "sent" && <p className="note-ok" role="status">✓ Message sent — we'll get back to you within one business day.</p>}
            {status === "error" && <p className="note-err" role="alert">{error}</p>}

            <div className="frow">
              <label className="fld"><span>Your name</span>
                <input required value={form.name} onChange={set("name")} placeholder="Jane Doe" autoComplete="name" />
              </label>
              <label className="fld"><span>Your email</span>
                <input required type="email" value={form.email} onChange={set("email")} placeholder="jane@example.com" autoComplete="email" />
              </label>
            </div>
            <label className="fld"><span>Subject <em style={{ fontStyle: "normal", color: "var(--ink2)", fontWeight: 400 }}>(optional)</em></span>
              <input value={form.subject} onChange={set("subject")} placeholder="Question about my policy" />
            </label>
            <label className="fld"><span>Message</span>
              <textarea required value={form.message} onChange={set("message")} placeholder="How can we help?" />
            </label>

            <button type="submit" className="btn btn-p" disabled={status === "sending"} style={{ width: "100%", justifyContent: "center" }}>
              {status === "sending" ? "Sending…" : "Send message"}
            </button>
          </form>
        </div>
      </div></section>
    </SiteChrome>
  );
}