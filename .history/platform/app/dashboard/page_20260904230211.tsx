"use client";

import Link from "next/link";
import Header from "@/components/Header";
import { Sparkles, Code2, Database, Mail, Globe, Video, Bot, LayoutTemplate, Workflow } from "lucide-react";

const MODULES = [
  { title: "App Builder", desc: "Generate modular applications.", href: "/build", icon: Sparkles, badge: "Engine Ready", badgeColor: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  { title: "Code Editor", desc: "In-browser workspace IDE.", href: "/ide", icon: Code2, badge: "Active Workspace", badgeColor: "border-slate-700 bg-slate-800 text-slate-300" },
  { title: "AI Copilot", desc: "Context-aware code assistant.", href: "/copilot", icon: Bot, badge: "Copilot Active", badgeColor: "border-blue-500/30 bg-blue-500/10 text-blue-400" },
  { title: "Templates", desc: "Starter kits and boilerplates.", href: "/templates", icon: LayoutTemplate, badge: "12 Loaded", badgeColor: "border-purple-500/30 bg-purple-500/10 text-purple-400" },
  { title: "AI Automation", desc: "Visual automation pipelines.", href: "/workflows", icon: Workflow, badge: "System Idle", badgeColor: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
  { title: "Database Hub", desc: "Postgres structure and tables.", href: "/database", icon: Database, badge: "Postgres Online", badgeColor: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  { title: "Email Dispatch", desc: "Transactional email engine.", href: "/email", icon: Mail, badge: "Keyless Local", badgeColor: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  { title: "Domain & Hosting", desc: "DNS and Vercel routing.", href: "/hosting", icon: Globe, badge: "DNS Active", badgeColor: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  { title: "AI Avatar Studio", desc: "Local speech avatar generator.", href: "/avatar", icon: Video, badge: "Keyless WebSpeech", badgeColor: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Workspace Modules</h1>
          <p className="mt-1 text-sm text-slate-400">Select a module to manage its configuration.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition-all hover:border-slate-700 hover:bg-slate-900"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-300 group-hover:border-emerald-500/30 group-hover:text-emerald-400">
                      <Icon size={20} />
                    </div>
                    {/* Top-Right Status Badge */}
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${mod.badgeColor}`}>
                      {mod.badge}
                    </span>
                  </div>
                  <h2 className="mt-4 text-base font-semibold text-slate-100 group-hover:text-emerald-400">
                    {mod.title}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{mod.desc}</p>
                </div>
                <div className="mt-6 flex items-center text-xs font-medium text-slate-500 group-hover:text-slate-300">
                  Open module &rarr;
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}