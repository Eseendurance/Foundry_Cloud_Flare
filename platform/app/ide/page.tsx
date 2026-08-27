"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Play, Download, RotateCcw } from "lucide-react";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type FileName = "index.html" | "styles.css" | "script.js";

const DEFAULTS: Record<FileName, string> = {
  "index.html": `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>My app</title>
  </head>
  <body>
    <h1>Edit me</h1>
    <p>Change any file on the left, then hit Run.</p>
    <button id="count-btn">Clicked 0 times</button>
  </body>
</html>
`,
  "styles.css": `body {
  font-family: system-ui, sans-serif;
  padding: 2.5rem;
  background: #faf7f1;
  color: #202b24;
}

button {
  padding: 0.6rem 1.2rem;
  border-radius: 999px;
  border: 1px solid #dfd6c4;
  background: #33513c;
  color: white;
  cursor: pointer;
}
`,
  "script.js": `let count = 0;
const btn = document.getElementById("count-btn");
btn.addEventListener("click", () => {
  count += 1;
  btn.textContent = \`Clicked \${count} times\`;
});
`,
};

const TABS: { name: FileName; language: string }[] = [
  { name: "index.html", language: "html" },
  { name: "styles.css", language: "css" },
  { name: "script.js", language: "javascript" },
];

const IMPORT_KEY = "groundwork:ide-import";

function compose(files: Record<FileName, string>): string {
  const imported = files["index.html"].includes("<html")
    ? files["index.html"]
    : `<!DOCTYPE html><html><head></head><body>${files["index.html"]}</body></html>`;

  return imported
    .replace("</head>", `<style>${files["styles.css"]}</style></head>`)
    .replace("</body>", `<script>${files["script.js"]}<\/script></body>`);
}

function initialState(): {
  files: Record<FileName, string>;
  importedFlat: boolean;
} {
  if (typeof window === "undefined") {
    return { files: DEFAULTS, importedFlat: false };
  }
  const imported = window.sessionStorage.getItem(IMPORT_KEY);
  if (imported) {
    window.sessionStorage.removeItem(IMPORT_KEY);
    return { files: { ...DEFAULTS, "index.html": imported }, importedFlat: true };
  }
  return { files: DEFAULTS, importedFlat: false };
}

export default function Ide() {
  const [{ files, importedFlat }, setState] = useState(initialState);
  const [active, setActive] = useState<FileName>("index.html");
  const [preview, setPreview] = useState(() => compose(initialState().files));
  const editorRef = useRef<HTMLDivElement>(null);

  function setFiles(updater: (f: Record<FileName, string>) => Record<FileName, string>) {
    setState((s) => ({ ...s, files: updater(s.files) }));
  }

  function run() {
    setPreview(compose(files));
  }

  function reset() {
    setState({ files: DEFAULTS, importedFlat: false });
    setPreview(compose(DEFAULTS));
  }

  function download() {
    const blob = new Blob([compose(files)], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "app.html";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-screen flex-col bg-paper">
      <header className="flex items-center justify-between border-b border-line px-6 py-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={16} />
          Workspace
        </Link>
        <span className="inline-flex items-center gap-2 rounded-full border border-moss/30 bg-moss/5 px-3 py-1 text-xs text-moss">
          <span className="h-1.5 w-1.5 rounded-full bg-moss" />
          Code editor — live
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-ink-soft hover:border-ink hover:text-ink"
          >
            <RotateCcw size={13} />
            Reset
          </button>
          <button
            onClick={download}
            className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-ink-soft hover:border-ink hover:text-ink"
          >
            <Download size={13} />
            Download
          </button>
          <button
            onClick={run}
            className="flex items-center gap-1.5 rounded-full bg-moss px-4 py-1.5 text-xs font-medium text-paper hover:bg-moss-deep"
          >
            <Play size={13} />
            Run
          </button>
        </div>
      </header>

      {importedFlat && (
        <p className="border-b border-line bg-amber/10 px-6 py-2 text-xs text-ink-soft">
          Imported a single-file app from the builder into{" "}
          <code className="font-mono">index.html</code>. Its CSS/JS are
          already inline — the styles.css and script.js tabs are extra
          scratch space.
        </p>
      )}

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
        <div className="flex flex-col border-r border-line" ref={editorRef}>
          <div className="flex border-b border-line bg-paper-dim/40">
            {TABS.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActive(tab.name)}
                className={`border-r border-line px-4 py-2 font-mono text-xs ${
                  active === tab.name
                    ? "bg-paper text-ink"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
          <div className="flex-1">
            <Editor
              key={active}
              path={active}
              language={TABS.find((t) => t.name === active)?.language}
              value={files[active]}
              onChange={(val) =>
                setFiles((f) => ({ ...f, [active]: val ?? "" }))
              }
              theme="vs-dark"
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                automaticLayout: true,
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>

        <iframe
          title="preview"
          srcDoc={preview}
          sandbox="allow-scripts"
          className="h-full w-full bg-white"
        />
      </div>
    </div>
  );
}
