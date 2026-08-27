"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Search, AlertCircle, CheckCircle2, XCircle, Lock } from "lucide-react";

type CheckResult = {
  domain: string;
  registered: boolean;
  note?: string;
  registrar?: string | null;
  registeredOn?: string | null;
  expiresOn?: string | null;
  nameservers?: string[];
  status?: string[];
};

type DnsResult = {
  domain: string;
  a: string[];
  mx: { priority: number; exchange: string }[];
  ns: string[];
  txt: string[];
};

export default function DomainsModule() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [dns, setDns] = useState<DnsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function check(e: FormEvent) {
    e.preventDefault();
    const d = domain.trim().toLowerCase();
    if (!d) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setDns(null);

    try {
      const [checkRes, dnsRes] = await Promise.all([
        fetch(`/api/domains/check?domain=${encodeURIComponent(d)}`),
        fetch(`/api/domains/dns?domain=${encodeURIComponent(d)}`),
      ]);
      const checkData = await checkRes.json();
      const dnsData = await dnsRes.json();

      if (!checkRes.ok) {
        setError(checkData.error || "Lookup failed.");
      } else {
        setResult(checkData);
      }
      if (dnsRes.ok) setDns(dnsData);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
            <ArrowLeft size={16} />
            Workspace
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-moss/30 bg-moss/5 px-3 py-1 text-xs text-moss">
            <span className="h-1.5 w-1.5 rounded-full bg-moss" />
            Domain lookup — live
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Domains</h1>
        <p className="mt-2 max-w-xl text-sm text-ink-soft">
          Real registry lookups over RDAP (the modern WHOIS) — no API key.
          Buying a domain needs a registrar account connected on our side,
          which isn&apos;t wired up yet; see the note below.
        </p>

        <form onSubmit={check} className="mt-8 flex gap-2">
          <input
            required
            placeholder="yourcoolidea.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full rounded-full border border-line bg-paper px-5 py-3 text-sm focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex shrink-0 items-center gap-2 rounded-full bg-moss px-6 py-3 text-sm font-medium text-paper hover:bg-moss-deep disabled:opacity-60"
          >
            <Search size={15} />
            {loading ? "Checking…" : "Check"}
          </button>
        </form>

        {error && (
          <p className="mt-4 flex items-start gap-2 text-sm text-rust">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        {result && (
          <div className="mt-8 rounded-2xl border border-line p-6">
            <div className="flex items-center gap-2">
              {result.registered ? (
                <XCircle className="text-rust" size={20} />
              ) : (
                <CheckCircle2 className="text-moss" size={20} />
              )}
              <h2 className="font-medium text-ink">
                {result.domain} —{" "}
                {result.registered ? "already registered" : "possibly available"}
              </h2>
            </div>

            {result.registered ? (
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Field label="Registrar" value={result.registrar || "Not published"} />
                <Field label="Status" value={(result.status || []).join(", ") || "—"} />
                <Field
                  label="Registered"
                  value={result.registeredOn ? new Date(result.registeredOn).toLocaleDateString() : "—"}
                />
                <Field
                  label="Expires"
                  value={result.expiresOn ? new Date(result.expiresOn).toLocaleDateString() : "—"}
                />
              </dl>
            ) : (
              <p className="mt-3 text-sm text-ink-soft">{result.note}</p>
            )}

            {!result.registered && (
              <div className="mt-5 flex items-start gap-2 rounded-xl border border-line bg-paper-dim/40 p-3 text-sm text-ink-soft">
                <Lock size={16} className="mt-0.5 shrink-0" />
                Buying it here needs a registrar account connected on our
                end — not live yet. For now, take this name to any
                registrar directly.
              </div>
            )}
          </div>
        )}

        {dns && (dns.a.length > 0 || dns.mx.length > 0 || dns.ns.length > 0 || dns.txt.length > 0) && (
          <div className="mt-6 rounded-2xl border border-line p-6">
            <h3 className="font-medium text-ink">Live DNS records</h3>
            <div className="mt-4 space-y-3 text-sm">
              {dns.ns.length > 0 && <Field label="Nameservers" value={dns.ns.join(", ")} />}
              {dns.a.length > 0 && <Field label="A records" value={dns.a.join(", ")} />}
              {dns.mx.length > 0 && (
                <Field
                  label="MX records"
                  value={dns.mx.map((m) => `${m.exchange} (${m.priority})`).join(", ")}
                />
              )}
              {dns.txt.length > 0 && <Field label="TXT records" value={dns.txt.join(" | ")} />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink-soft">{label}</dt>
      <dd className="mt-0.5 break-all font-mono text-xs text-ink">{value}</dd>
    </div>
  );
}
