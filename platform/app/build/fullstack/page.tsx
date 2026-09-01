"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Code2,
  FileCode,
  Database,
} from "lucide-react";
import GitHubConnect from "@/components/GitHubConnect";

const EXAMPLES = [
  "A todo app where items persist between visits",
  "A guestbook where visitors leave a name and a short message",
  "A simple polling app — create a poll, others vote, see live results",
];

export default function FullstackBuild() {
  const router = useRouter();
  const [appName, setAppName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [files, setFiles] = useState<Record<string, string> | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [rejected, setRejected] = useState<string[]>([]);

  async function generate() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setFiles(null);
    setSummary("");

    try {
      const res = await fetch("/api/generate/fullstack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), appName: appName.trim() || "generated-app" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Request failed (${res.status}).`);
      } else {
        setFiles(data.files);
        setSummary(data.summary);
        setRejected(data.rejectedPaths || []);
        const firstAppFile = Object.keys(data.files).find((f) => f.startsWith("app/") && f !== "app/globals.css" && f !== "app/layout.tsx");
        setActive(firstAppFile || Object.keys(data.files)[0]);
      }
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setLoading(false);
    }
  }

  function openInIde() {
    if (!files) return;
    sessionStorage.setItem("groundwork:ide-import-files", JSON.stringify(files));
    router.push("/ide");
  }

  const fileNames = files ? Object.keys(files).sort() : [];
  const hasDbRoute = files ? Object.keys(files).some((f) => f.startsWith("app/api/")) : false;

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
            <ArrowLeft size={16} />
            Workspace
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-moss/30 bg-moss/5 px-3 py-1 text-xs text-moss">
            <span className="h-1.5 w-1.5 rounded-full bg-moss" />
            Full-stack builder — live
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">
          A real backend, not a demo
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          This generates an actual Next.js project — real API routes, real
          Postgres persistence when the app needs to remember something,
          on a scaffold I&apos;ve already built and tested. Push it to GitHub
          below and Vercel deploys it for real, same as this platform.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <input
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="App name (used for the repo/package name)"
            className="w-full rounded-full border border-line bg-paper px-5 py-3 text-sm focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the app — what does it do, what does it need to remember?"
              className="w-full rounded-full border border-line bg-paper px-5 py-3.5 text-sm focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
            />
            <button
              onClick={generate}
              disabled={loading || !prompt.trim()}
              className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-moss px-6 py-3.5 text-sm font-medium text-paper hover:bg-moss-deep disabled:opacity-50"
            >
              <Sparkles size={16} />
              {loading ? "Building… (can take a minute)" : "Generate"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setPrompt(ex)}
                className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-soft hover:border-moss hover:text-ink"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-2 rounded-2xl border border-rust/30 bg-rust/5 p-4 text-sm text-rust">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {files && (
          <div className="mt-8">
            {summary && (
              <div className="mb-4 rounded-2xl border border-line bg-paper-dim/40 p-4">
                <p className="text-sm text-ink">{summary}</p>
                {hasDbRoute && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-soft">
                    <Database size={13} className="text-amber" />
                    This app uses Postgres — after pushing, set{" "}
                    <code className="font-mono">DATABASE_URL</code> in the new
                    project&apos;s Vercel environment variables, or the API routes
                    will return a clear error instead of silently failing.
                  </p>
                )}
                {rejected.length > 0 && (
                  <p className="mt-2 text-xs text-rust">
                    Ignored {rejected.length} file(s) the model tried to write
                    outside the allowed structure: {rejected.join(", ")}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-ink-soft">
                <FileCode size={14} />
                {fileNames.length} files
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={openInIde}
                  className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-ink-soft hover:border-ink hover:text-ink"
                >
                  <Code2 size={13} />
                  Open in IDE
                </button>
                <GitHubConnect files={files} />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 overflow-hidden rounded-2xl border border-line md:grid-cols-[220px_1fr]">
              <div className="max-h-[60vh] overflow-auto border-r border-line bg-paper-dim/30">
                {fileNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => setActive(name)}
                    className={`block w-full truncate px-3 py-1.5 text-left font-mono text-xs ${
                      active === name ? "bg-moss/10 text-ink" : "text-ink-soft hover:bg-paper-dim/60"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <pre className="max-h-[60vh] overflow-auto bg-ink p-4 font-mono text-xs leading-relaxed text-paper/90">
                <code>{active ? files[active] : ""}</code>
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
