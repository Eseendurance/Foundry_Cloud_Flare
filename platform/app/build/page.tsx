"use client";

import { useState, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Copy,
  Download,
  Play,
  Check,
  AlertCircle,
  Code2,
} from "lucide-react";

const EXAMPLES = [
  "A tip calculator with a slider for tip percent and split-by-people",
  "A markdown notes app that saves notes in the page while I'm on it",
  "A pomodoro timer with work/break cycles and a sound at the end",
];

type Panel = "code" | "preview";

export default function Build() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [panel, setPanel] = useState<Panel>("code");
  const [previewSrc, setPreviewSrc] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  async function generate(e: FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setCode("");
    setPreviewSrc("");
    setPanel("code");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        setError(data?.error || `Request failed (${res.status}).`);
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setCode(full);
      }

      setPreviewSrc(full);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError("Lost connection mid-generation. Try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadCode() {
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "app.html";
    a.click();
    URL.revokeObjectURL(url);
  }

  function openInIde() {
    sessionStorage.setItem("groundwork:ide-import", code);
    router.push("/ide");
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink"
          >
            <ArrowLeft size={16} />
            Workspace
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-moss/30 bg-moss/5 px-3 py-1 text-xs text-moss">
            <span className="h-1.5 w-1.5 rounded-full bg-moss" />
            App builder — live
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-10">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">
          Describe it. Watch it get built.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          This generates a real, self-contained app — one file, running
          Claude live, no canned output. Good for single-page tools today;
          multi-file projects come with the in-browser IDE.
        </p>

        <form onSubmit={generate} className="mt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A habit tracker with a weekly grid I can click to mark days done"
              className="w-full rounded-full border border-line bg-paper px-5 py-3.5 text-sm focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-moss px-6 py-3.5 text-sm font-medium text-paper transition-colors hover:bg-moss-deep disabled:opacity-50"
            >
              <Sparkles size={16} />
              {loading ? "Building…" : "Build it"}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                type="button"
                key={ex}
                onClick={() => setPrompt(ex)}
                className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-soft hover:border-moss hover:text-ink"
              >
                {ex}
              </button>
            ))}
          </div>
        </form>

        {error && (
          <div className="mt-6 flex items-start gap-2 rounded-2xl border border-rust/30 bg-rust/5 p-4 text-sm text-rust">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {(code || loading) && (
          <div className="mt-8 flex-1 overflow-hidden rounded-2xl border border-line">
            <div className="flex items-center justify-between border-b border-line bg-paper-dim/60 px-4 py-2">
              <div className="flex gap-1">
                <button
                  onClick={() => setPanel("code")}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    panel === "code"
                      ? "bg-ink text-paper"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  Code
                </button>
                <button
                  onClick={() => setPanel("preview")}
                  disabled={!previewSrc}
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium disabled:opacity-40 ${
                    panel === "preview"
                      ? "bg-ink text-paper"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  <Play size={12} />
                  Preview
                </button>
              </div>
              {code && !loading && (
                <div className="flex gap-2">
                  <button
                    onClick={openInIde}
                    className="flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink"
                  >
                    <Code2 size={14} />
                    Open in IDE
                  </button>
                  <button
                    onClick={copyCode}
                    className="flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={downloadCode}
                    className="flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink"
                  >
                    <Download size={14} />
                    Download
                  </button>
                </div>
              )}
            </div>

            {panel === "code" ? (
              <pre className="max-h-[60vh] overflow-auto bg-ink p-4 font-mono text-xs leading-relaxed text-paper/90">
                <code>{code || "Waiting for the model…"}</code>
              </pre>
            ) : (
              <iframe
                title="preview"
                srcDoc={previewSrc}
                sandbox="allow-scripts"
                className="h-[60vh] w-full bg-white"
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
