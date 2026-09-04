"use client";

import { useState, useRef, FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Download, Play, Check, AlertCircle, Code2 } from "lucide-react";
import Preview from "@/components/preview";

type Panel = "code" | "preview";

export default function Build() {
  const [prompt, setPrompt] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [panel, setPanel] = useState<Panel>("preview");

  async function generate(e: FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setCode("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setCode(data.html || data.text || "");
      setPanel("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error generating build.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
            <ArrowLeft size={16} /> Workspace
          </Link>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
            Engine Ready
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Application Builder</h1>

        <form onSubmit={generate} className="mt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the application features..."
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {loading ? "Building..." : "Generate"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {(code || loading) && (
          <div className="mt-6 flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setPanel("code")}
                  className={`rounded-md px-3 py-1 text-xs font-medium ${panel === "code" ? "bg-slate-800 text-white" : "text-slate-400"}`}
                >
                  Code
                </button>
                <button
                  onClick={() => setPanel("preview")}
                  className={`rounded-md px-3 py-1 text-xs font-medium ${panel === "preview" ? "bg-slate-800 text-white" : "text-slate-400"}`}
                >
                  Preview
                </button>
              </div>
            </div>
            <div className="h-[500px] w-full bg-slate-950">
              {panel === "code" ? (
                <pre className="h-full overflow-auto p-4 font-mono text-xs text-slate-300">{code}</pre>
              ) : (
                <Preview code={code} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}