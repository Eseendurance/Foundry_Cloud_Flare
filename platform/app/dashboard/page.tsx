"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import {
  Plus,
  Folder,
  Database,
  Code2,
  Mail,
  Globe,
  Video,
  Sparkles,
  Lock,
  ArrowLeft,
  LogOut,
  Search,
} from "lucide-react";

type Module = {
  key: string;
  name: string;
  icon: typeof Sparkles;
  status: "live" | "soon";
  href?: string;
};

const modules: Module[] = [
  {
    key: "builder",
    name: "App builder",
    icon: Sparkles,
    status: "live",
    href: "/build",
  },
  { key: "ide", name: "Code editor", icon: Code2, status: "live", href: "/ide" },
  { key: "db", name: "Database", icon: Database, status: "soon" },
  { key: "email", name: "Email", icon: Mail, status: "live", href: "/email" },
  { key: "domain", name: "Domain", icon: Globe, status: "live", href: "/domains" },
  { key: "avatar", name: "AI avatar", icon: Video, status: "live", href: "/voice" },
  { key: "search", name: "Search", icon: Search, status: "live", href: "/search" },
];

type Project = { id: string; name: string; created_at: string };
type LocalProject = { id: string; name: string; createdAt: string };
type AuthState = "checking" | "out" | "in";

export default function Dashboard() {
  const [auth, setAuth] = useState<AuthState>("checking");
  const [email, setEmail] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [localProjects, setLocalProjects] = useState<LocalProject[]>([]);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setAuth("in");
          setEmail(data.user.email);
          fetch("/api/projects")
            .then((r) => r.json())
            .then((pdata) => {
              if (pdata.projects) setProjects(pdata.projects);
              else if (pdata.error) setProjectsError(pdata.error);
            })
            .catch(() => setProjectsError("Couldn't load your projects."));
        } else {
          setAuth("out");
        }
      })
      .catch(() => setAuth("out"));
  }, []);

  async function createProject(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    if (auth === "in") {
      setSaving(true);
      setProjectsError(null);
      try {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        });
        const data = await res.json();
        if (!res.ok) {
          setProjectsError(data.error || "Couldn't save the project.");
        } else {
          setProjects((prev) => [data.project, ...prev]);
          setName("");
          setShowForm(false);
        }
      } catch {
        setProjectsError("Couldn't reach the database.");
      } finally {
        setSaving(false);
      }
    } else {
      setLocalProjects((prev) => [
        { id: crypto.randomUUID(), name: trimmed, createdAt: new Date().toISOString() },
        ...prev,
      ]);
      setName("");
      setShowForm(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuth("out");
    setEmail(null);
    setProjects([]);
  }

  function touchModule(mod: Module) {
    if (mod.status === "live") return;
    setNote(
      `${mod.name} isn't wired up yet — check the build log on the home page for real status.`
    );
    window.clearTimeout((touchModule as unknown as { t?: number }).t);
    (touchModule as unknown as { t?: number }).t = window.setTimeout(
      () => setNote(null),
      4000
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink"
          >
            <ArrowLeft size={16} />
            Groundwork
          </Link>

          {auth === "in" ? (
            <div className="flex items-center gap-3">
              <Link
                href="/settings/developer"
                className="text-xs text-ink-soft hover:text-ink"
              >
                API keys
              </Link>
              <span className="text-xs text-ink-soft">{email}</span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-ink-soft hover:border-ink hover:text-ink"
              >
                <LogOut size={12} />
                Log out
              </button>
            </div>
          ) : (
            <Link
              href="/account"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-paper hover:bg-moss-deep"
            >
              <Lock size={12} />
              Log in to save for real
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl text-ink sm:text-3xl">
              Your workspace
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              {auth === "in"
                ? "These projects are real rows in your Postgres database."
                : "Browsing without an account — projects here live only in this tab. Log in to persist them for real."}
            </p>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-2 self-start rounded-full bg-moss px-5 py-2.5 text-sm font-medium text-paper hover:bg-moss-deep"
          >
            <Plus size={16} />
            New project
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={createProject}
            className="mt-6 flex flex-col gap-3 rounded-2xl border border-line bg-paper-dim/60 p-5 sm:flex-row"
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name, e.g. Client waitlist page"
              className="w-full rounded-full border border-line bg-paper px-5 py-3 text-sm focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
            />
            <button
              type="submit"
              disabled={saving}
              className="shrink-0 rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper hover:bg-moss-deep disabled:opacity-60"
            >
              {saving ? "Saving…" : "Create"}
            </button>
          </form>
        )}

        {projectsError && (
          <p className="mt-4 text-sm text-rust">{projectsError}</p>
        )}

        <div className="mt-8">
          {auth === "checking" ? (
            <p className="text-sm text-ink-soft">Checking your session…</p>
          ) : auth === "in" && projects.length === 0 ? (
            <EmptyState text="No projects yet. Create one — it's saved to your account." />
          ) : auth === "out" && localProjects.length === 0 ? (
            <EmptyState text="No projects yet. Create one to try the shell, or log in to keep it." />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(auth === "in" ? projects : []).map((p) => (
                <li key={p.id} className="rounded-2xl border border-line bg-paper p-5">
                  <p className="font-medium text-ink">{p.name}</p>
                  <p className="mt-1 text-xs text-ink-soft">
                    Saved {new Date(p.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
              {(auth === "out" ? localProjects : []).map((p) => (
                <li key={p.id} className="rounded-2xl border border-dashed border-line bg-paper p-5">
                  <p className="font-medium text-ink">{p.name}</p>
                  <p className="mt-1 text-xs text-ink-soft">
                    Not saved — created {new Date(p.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-14">
          <h2 className="font-display text-xl text-ink">Modules</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Tap one — we&apos;ll tell you honestly whether it&apos;s ready.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
            {modules.map((m) =>
              m.status === "live" && m.href ? (
                <Link
                  key={m.key}
                  href={m.href}
                  className="relative flex flex-col items-center gap-2 rounded-2xl border border-moss/40 bg-moss/5 px-4 py-6 text-center transition-colors hover:border-moss"
                >
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-moss" />
                  <m.icon className="text-moss" size={20} strokeWidth={1.75} />
                  <span className="text-xs font-medium text-ink">{m.name}</span>
                </Link>
              ) : (
                <button
                  key={m.key}
                  onClick={() => touchModule(m)}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-paper-dim/40 px-4 py-6 text-center transition-colors hover:border-moss"
                >
                  <m.icon className="text-moss" size={20} strokeWidth={1.75} />
                  <span className="text-xs font-medium text-ink">{m.name}</span>
                </button>
              )
            )}
          </div>
        </div>

        {note && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-line bg-ink px-5 py-3 text-sm text-paper shadow-lg">
            {note}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center">
      <Folder className="mx-auto text-ink-soft" size={28} />
      <p className="mt-3 text-sm text-ink-soft">{text}</p>
    </div>
  );
}
