"use client";

import Link from "next/link";
import {
  Sparkles,
  Code2,
  Database,
  Mail,
  Globe,
  Video,
  Bot,
  LayoutTemplate,
  Key,
  LogOut,
  Workflow,
} from "lucide-react";

const MODULES = [
  {
    title: "App Builder",
    desc: "Generate full apps from raw prompts.",
    href: "/build",
    icon: Sparkles,
    badge: "Live",
  },
  {
    title: "Code Editor",
    desc: "In-browser IDE with instant preview.",
    href: "/ide",
    icon: Code2,
    badge: "Live",
  },
  {
    title: "AI Copilot",
    desc: "Context-aware code assistant & debugging.",
    href: "/copilot",
    icon: Bot,
    badge: "New",
  },
  {
    title: "Templates",
    desc: "Pre-built full-stack starter kits.",
    href: "/templates",
    icon: LayoutTemplate,
    badge: "New",
  },
  {
    title: "AI Automation",
    desc: "Visual workflow nodes & triggers.",
    href: "/workflows",
    icon: Workflow,
    badge: "v1.0",
  },
  {
    title: "Database Hub",
    desc: "Postgres schema manager & tables.",
    href: "/database",
    icon: Database,
    badge: "System",
  },
  {
    title: "Email Dispatch",
    desc: "Webhooks, SMTP & transactional logs.",
    href: "/email",
    icon: Mail,
    badge: "Keyless",
  },
  {
    title: "Domain & Hosting",
    desc: "DNS management & Vercel deployments.",
    href: "/hosting",
    icon: Globe,
    badge: "DNS",
  },
  {
    title: "AI Avatar Studio",
    desc: "Local TTS & WebRTC avatar generator.",
    href: "/avatar",
    icon: Video,
    badge: "Local",
  },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 font-mono text-sm font-bold text-emerald-400 border border-emerald-500/20">
              FC
            </span>
            <span className="font-semibold text-slate-100">Foundry Cloud</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link
              href="/settings/keys"
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200"
            >
              <Key size={14} /> API Keys
            </Link>
            <button className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200">
              <LogOut size={14} /> Exit
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Workspace Modules
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Select a suite module to open its dedicated control dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/80 hover:shadow-lg hover:shadow-emerald-500/5"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-300 group-hover:border-emerald-500/30 group-hover:text-emerald-400">
                      <Icon size={20} />
                    </div>
                    <span className="rounded-full border border-slate-800 bg-slate-950 px-2.5 py-0.5 text-[10px] font-medium text-slate-400">
                      {mod.badge}
                    </span>
                  </div>
                  <h2 className="mt-4 text-base font-semibold text-slate-100 group-hover:text-emerald-400">
                    {mod.title}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    {mod.desc}
                  </p>
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