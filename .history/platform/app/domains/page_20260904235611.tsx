"use client";

import { useState, FormEvent } from "react";
import Header from "@/components/Header";
import { Globe, ShieldCheck, CheckCircle2, ArrowUpRight, Search } from "lucide-react";

export default function DomainPage() {
  const [customDomain, setCustomDomain] = useState("");
  const [activeDomains, setActiveDomains] = useState([
    { name: "platform-gamma-neon.vercel.app", type: "Vercel Default", status: "Active SSL" },
  ]);

  function handleAddDomain(e: FormEvent) {
    e.preventDefault();
    if (!customDomain.trim()) return;

    setActiveDomains((prev) => [
      ...prev,
      { name: customDomain.trim(), type: "Custom CNAME", status: "Propagating DNS" },
    ]);
    setCustomDomain("");
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900">
      <Header />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Domains & Network Config
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage custom domains, edge routing, and automated SSL certificate assignment.
            </p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-600/20 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <ShieldCheck size={14} /> Edge Router Connected
          </span>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          {/* Domain Form */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5">
            <h2 className="font-semibold text-slate-900">Attach Custom Domain</h2>
            <p className="mt-1 text-xs text-slate-600">
              Enter your registered domain to route edge traffic directly to your deployment.
            </p>

            <form onSubmit={handleAddDomain} className="mt-5 flex flex-col gap-3">
              <input
                type="text"
                placeholder="app.yourdomain.com"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-[#faf8f5] px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-medium text-white hover:bg-emerald-800"
              >
                Add Domain
              </button>
            </form>
          </div>

          {/* Active Domains Table */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7">
            <h2 className="font-semibold text-slate-900">Active Routing List</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {activeDomains.map((d) => (
                <div key={d.name} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2.5">
                    <Globe size={16} className="text-emerald-700" />
                    <div>
                      <p className="font-mono text-xs font-semibold text-slate-900">{d.name}</p>
                      <span className="text-[10px] text-slate-500">{d.type}</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    <CheckCircle2 size={12} /> {d.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}