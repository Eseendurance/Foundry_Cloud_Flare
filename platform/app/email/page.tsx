"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Search,
  Send,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  MousePointerClick,
} from "lucide-react";

type DomainAuth = {
  domain: string;
  spf: { found: boolean; record: string | null };
  dmarc: { found: boolean; record: string | null; policy: string | null };
};

type SentEmail = {
  id: string;
  to_email: string;
  subject: string;
  sent_at: string;
  opened_at: string | null;
  click_count: number;
};

export default function EmailModule() {
  // Send form
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // Domain checker
  const [domain, setDomain] = useState("");
  const [checking, setChecking] = useState(false);
  const [auth, setAuth] = useState<DomainAuth | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  // Sent history
  const [sent, setSent] = useState<SentEmail[]>([]);
  const [sentError, setSentError] = useState<string | null>(null);

  function loadSent() {
    fetch("/api/email/sent")
      .then((r) => r.json())
      .then((data) => {
        if (data.emails) setSent(data.emails);
        else if (data.error) setSentError(data.error);
      })
      .catch(() => {});
  }

  useEffect(() => {
    loadSent();
  }, []);

  async function send(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setSendResult(null);
    setSendError(null);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject,
          text,
          linkUrl: showLink ? linkUrl : undefined,
          linkLabel: showLink ? linkLabel : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendError(data.error || "Send failed.");
      } else {
        setSendResult(`Sent. Message ID: ${data.messageId}`);
        setTo("");
        setSubject("");
        setText("");
        setLinkUrl("");
        setLinkLabel("");
        loadSent();
      }
    } catch {
      setSendError("Couldn't reach the server.");
    } finally {
      setSending(false);
    }
  }

  async function checkDomain(e: FormEvent) {
    e.preventDefault();
    setChecking(true);
    setAuth(null);
    setCheckError(null);
    try {
      const res = await fetch(
        `/api/email/verify-domain?domain=${encodeURIComponent(domain.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        setCheckError(data.error || "Lookup failed.");
      } else {
        setAuth(data);
      }
    } catch {
      setCheckError("Couldn't reach the server.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
            <ArrowLeft size={16} />
            Workspace
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-moss/30 bg-moss/5 px-3 py-1 text-xs text-moss">
            <span className="h-1.5 w-1.5 rounded-full bg-moss" />
            Email — live
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Email</h1>
        <p className="mt-2 max-w-xl text-sm text-ink-soft">
          Sends over a real SMTP account you connect, with real open and
          click tracking — same pattern Resend or Mailchimp use — and
          checks a domain&apos;s SPF/DMARC over live DNS with no key needed.
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          {/* Send */}
          <section className="rounded-2xl border border-line p-6">
            <div className="flex items-center gap-2">
              <Mail className="text-moss" size={18} />
              <h2 className="font-medium text-ink">Send a tracked email</h2>
            </div>
            <p className="mt-1 text-xs text-ink-soft">Requires you to be logged in.</p>

            <form onSubmit={send} className="mt-4 flex flex-col gap-3">
              <input
                type="email"
                required
                placeholder="Recipient email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-full border border-line bg-paper px-4 py-2.5 text-sm focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
              />
              <input
                required
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-full border border-line bg-paper px-4 py-2.5 text-sm focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
              />
              <textarea
                required
                rows={4}
                placeholder="Message"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full rounded-2xl border border-line bg-paper px-4 py-2.5 text-sm focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
              />

              <button
                type="button"
                onClick={() => setShowLink((s) => !s)}
                className="self-start text-xs text-ink-soft underline hover:text-ink"
              >
                {showLink ? "Remove call-to-action link" : "+ Add a tracked link/button"}
              </button>

              {showLink && (
                <div className="flex flex-col gap-2 rounded-xl border border-line bg-paper-dim/30 p-3">
                  <input
                    placeholder="https://yoursite.com/whatever"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-full rounded-full border border-line bg-paper px-3 py-2 text-xs focus:border-moss focus:outline-none"
                  />
                  <input
                    placeholder="Button text (e.g. View details)"
                    value={linkLabel}
                    onChange={(e) => setLinkLabel(e.target.value)}
                    className="w-full rounded-full border border-line bg-paper px-3 py-2 text-xs focus:border-moss focus:outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="flex items-center justify-center gap-2 rounded-full bg-moss px-5 py-2.5 text-sm font-medium text-paper hover:bg-moss-deep disabled:opacity-60"
              >
                <Send size={14} />
                {sending ? "Sending…" : "Send"}
              </button>
            </form>

            {sendResult && (
              <p className="mt-3 flex items-start gap-2 text-sm text-moss">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                {sendResult}
              </p>
            )}
            {sendError && (
              <p className="mt-3 flex items-start gap-2 text-sm text-rust">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {sendError}
              </p>
            )}
          </section>

          {/* Domain checker */}
          <section className="rounded-2xl border border-line p-6">
            <div className="flex items-center gap-2">
              <Search className="text-moss" size={18} />
              <h2 className="font-medium text-ink">Check a domain&apos;s SPF / DMARC</h2>
            </div>
            <p className="mt-1 text-xs text-ink-soft">
              Real DNS TXT lookups, run right now — try your own domain, or
              a well-known one to see what a healthy setup looks like.
            </p>

            <form onSubmit={checkDomain} className="mt-4 flex gap-2">
              <input
                required
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full rounded-full border border-line bg-paper px-4 py-2.5 text-sm focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
              />
              <button
                type="submit"
                disabled={checking}
                className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-moss-deep disabled:opacity-60"
              >
                {checking ? "…" : "Check"}
              </button>
            </form>

            {checkError && (
              <p className="mt-3 flex items-start gap-2 text-sm text-rust">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {checkError}
              </p>
            )}

            {auth && (
              <div className="mt-4 space-y-3">
                <Row
                  ok={auth.spf.found}
                  label="SPF"
                  detail={auth.spf.record || "No v=spf1 TXT record found."}
                />
                <Row
                  ok={auth.dmarc.found}
                  label="DMARC"
                  detail={
                    auth.dmarc.record
                      ? `${auth.dmarc.record}${auth.dmarc.policy ? ` (policy: ${auth.dmarc.policy})` : ""}`
                      : "No _dmarc TXT record found."
                  }
                />
              </div>
            )}
          </section>
        </div>

        {/* Sent history with real tracking */}
        <section className="mt-10 rounded-2xl border border-line p-6">
          <h2 className="font-medium text-ink">Sent emails</h2>
          <p className="mt-1 text-xs text-ink-soft">
            Real open/click data — an invisible pixel records opens, the
            optional button routes through a tracked redirect.
          </p>

          {sentError && <p className="mt-3 text-sm text-rust">{sentError}</p>}

          {sent.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">Nothing sent yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-soft">
                    <th className="pb-2 pr-4">To</th>
                    <th className="pb-2 pr-4">Subject</th>
                    <th className="pb-2 pr-4">Sent</th>
                    <th className="pb-2 pr-4">Opened</th>
                    <th className="pb-2">Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {sent.map((e) => (
                    <tr key={e.id} className="border-b border-line/60">
                      <td className="py-2 pr-4 font-mono text-xs">{e.to_email}</td>
                      <td className="py-2 pr-4">{e.subject}</td>
                      <td className="py-2 pr-4 text-xs text-ink-soft">
                        {new Date(e.sent_at).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4">
                        {e.opened_at ? (
                          <span className="flex items-center gap-1 text-moss">
                            <Eye size={13} /> Yes
                          </span>
                        ) : (
                          <span className="text-ink-soft">Not yet</span>
                        )}
                      </td>
                      <td className="py-2">
                        <span className="flex items-center gap-1">
                          <MousePointerClick size={13} className="text-ink-soft" />
                          {e.click_count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Row({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-line bg-paper-dim/40 p-3">
      {ok ? (
        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-moss" />
      ) : (
        <XCircle size={16} className="mt-0.5 shrink-0 text-rust" />
      )}
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="break-all font-mono text-xs text-ink-soft">{detail}</p>
      </div>
    </div>
  );
}
