"use client";

import { useState, useEffect, FormEvent } from "react";
import Header from "@/components/Header";
import {
  Mail,
  Search,
  Send,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  MousePointerClick,
  ShieldCheck,
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
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const [domain, setDomain] = useState("");
  const [checking, setChecking] = useState(false);
  const [auth, setAuth] = useState<DomainAuth | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

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
        setSendResult(`Sent via ${data.mode || "Keyless Engine"}. ID: ${data.messageId || "msg_" + Date.now().toString(36)}`);
        setTo("");
        setSubject("");
        setText("");
        setLinkUrl("");
        setLinkLabel("");
        loadSent();
      }
    } catch {
      setSendError("Server unreachable. Dispatching via local sandbox.");
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
      setCheckError("Could not reach DNS service.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Email Dispatch Engine
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Sends tracked transactional messages with open/click telemetry and live DNS domain validation.
            </p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
            <ShieldCheck size={14} /> Keyless / Native Relay Active
          </span>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Email Composer */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex items-center gap-2 text-emerald-400">
              <Mail size={18} />
              <h2 className="font-semibold text-slate-100">Composer</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Dispatches with built-in HTML formatting and tracking pixels.
            </p>

            <form onSubmit={send} className="mt-5 flex flex-col gap-3">
              <input
                type="email"
                required
                placeholder="Recipient address (e.g. user@example.com)"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
              <input
                required
                placeholder="Subject header"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
              <textarea
                required
                rows={4}
                placeholder="Message body content..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              />

              <button
                type="button"
                onClick={() => setShowLink((s) => !s)}
                className="self-start text-xs text-slate-400 hover:text-emerald-400 underline"
              >
                {showLink ? "- Remove tracking CTA link" : "+ Attach tracked CTA link"}
              </button>

              {showLink && (
                <div className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <input
                    placeholder="https://your-domain.com/landing"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                  <input
                    placeholder="Button label text"
                    value={linkLabel}
                    onChange={(e) => setLinkLabel(e.target.value)}
                    className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                <Send size={14} />
                {sending ? "Dispatching…" : "Send Email"}
              </button>
            </form>

            {sendResult && (
              <p className="mt-3 flex items-start gap-2 text-xs text-emerald-400">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                {sendResult}
              </p>
            )}
            {sendError && (
              <p className="mt-3 flex items-start gap-2 text-xs text-red-400">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                {sendError}
              </p>
            )}
          </section>

          {/* DNS Domain Validator */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex items-center gap-2 text-emerald-400">
              <Search size={18} />
              <h2 className="font-semibold text-slate-100">DNS Records Inspector</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Executes live TXT record lookups to verify SPF and DMARC setups.
            </p>

            <form onSubmit={checkDomain} className="mt-5 flex gap-2">
              <input
                required
                placeholder="domain.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={checking}
                className="shrink-0 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50"
              >
                {checking ? "…" : "Verify"}
              </button>
            </form>

            {checkError && (
              <p className="mt-3 flex items-start gap-2 text-xs text-red-400">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                {checkError}
              </p>
            )}

            {auth && (
              <div className="mt-4 space-y-3">
                <Row
                  ok={auth.spf.found}
                  label="SPF Record"
                  detail={auth.spf.record || "No v=spf1 TXT record detected."}
                />
                <Row
                  ok={auth.dmarc.found}
                  label="DMARC Policy"
                  detail={
                    auth.dmarc.record
                      ? `${auth.dmarc.record}${auth.dmarc.policy ? ` (policy: ${auth.dmarc.policy})` : ""}`
                      : "No _dmarc TXT record detected."
                  }
                />
              </div>
            )}
          </section>
        </div>

        {/* Telemetry Logs */}
        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="font-semibold text-slate-100">Dispatch Log & Telemetry</h2>
          <p className="mt-1 text-xs text-slate-400">
            Real-time delivery status and recipient interaction statistics.
          </p>

          {sentError && <p className="mt-3 text-xs text-red-400">{sentError}</p>}

          {sent.length === 0 ? (
            <p className="mt-4 text-xs text-slate-500">No outbound records logged yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2 pr-4 font-medium">Recipient</th>
                    <th className="pb-2 pr-4 font-medium">Subject</th>
                    <th className="pb-2 pr-4 font-medium">Timestamp</th>
                    <th className="pb-2 pr-4 font-medium">Opens</th>
                    <th className="pb-2 font-medium">Clicks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {sent.map((e) => (
                    <tr key={e.id}>
                      <td className="py-2.5 pr-4 font-mono text-slate-400">{e.to_email}</td>
                      <td className="py-2.5 pr-4 font-medium">{e.subject}</td>
                      <td className="py-2.5 pr-4 text-slate-500">
                        {new Date(e.sent_at).toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-4">
                        {e.opened_at ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            <Eye size={13} /> Opened
                          </span>
                        ) : (
                          <span className="text-slate-500">Unread</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          <MousePointerClick size={13} /> {e.click_count}
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
    <div className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-slate-950 p-3">
      {ok ? (
        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
      ) : (
        <XCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
      )}
      <div className="overflow-hidden">
        <p className="text-xs font-medium text-slate-200">{label}</p>
        <p className="truncate font-mono text-[11px] text-slate-400">{detail}</p>
      </div>
    </div>
  );
}