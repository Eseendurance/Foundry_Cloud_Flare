"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { Database, Plus, RefreshCw, Terminal } from "lucide-react";

type Column = {
  name: string;
  type: "VARCHAR" | "INTEGER" | "TIMESTAMP" | "BOOLEAN";
  nullable: boolean;
};

type TableSchema = {
  tableName: string;
  columns: Column[];
};

export default function DatabasePage() {
  const [tables, setTables] = useState<TableSchema[]>([
    {
      tableName: "users",
      columns: [
        { name: "id", type: "INTEGER", nullable: false },
        { name: "email", type: "VARCHAR", nullable: false },
        { name: "created_at", type: "TIMESTAMP", nullable: false },
      ],
    },
    {
      tableName: "deployments",
      columns: [
        { name: "id", type: "INTEGER", nullable: false },
        { name: "status", type: "VARCHAR", nullable: false },
        { name: "commit_hash", type: "VARCHAR", nullable: false },
      ],
    },
  ]);

  const [promptInput, setPromptInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusLog, setStatusLog] = useState("Schema engine ready.");

  async function handleAiSchemaGeneration(e: React.FormEvent) {
    e.preventDefault();
    if (!promptInput.trim() || isGenerating) return;

    setIsGenerating(true);
    setStatusLog(`Requesting schema definition for: "${promptInput}"...`);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptInput, type: "schema" }),
      });

      const data = await res.json();

      if (data.output) {
        setStatusLog(data.output);
        // Automatically create a new table based on the input name
        const generatedName = promptInput.trim().toLowerCase().replace(/\s+/g, "_");
        setTables((prev) => [
          ...prev,
          {
            tableName: generatedName,
            columns: [
              { name: "id", type: "INTEGER", nullable: false },
              { name: "data_payload", type: "VARCHAR", nullable: true },
              { name: "created_at", type: "TIMESTAMP", nullable: false },
            ],
          },
        ]);
        setPromptInput("");
      } else {
        setStatusLog(`Error: ${data.error || "Failed to generate schema."}`);
      }
    } catch (err: any) {
      setStatusLog(`Network Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <Header />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between border-b border-black pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Database Architecture</h1>
            <p className="mt-1 text-xs text-black/70">
              Relational schema management and keyless table generation engine.
            </p>
          </div>
        </div>

        {/* AI Schema Generator Input */}
        <div className="mt-8 border border-black p-4 bg-white">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
            <Plus size={14} /> Generate Schema via API Engine
          </h2>
          <form onSubmit={handleAiSchemaGeneration} className="flex gap-2">
            <input
              type="text"
              placeholder="Specify entity structure (e.g., organizations, payments, analytics)"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              className="w-full border border-black bg-white px-3 py-2 text-xs text-black placeholder:text-black/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isGenerating || !promptInput.trim()}
              className="border border-black bg-black px-4 py-2 text-xs font-medium text-white hover:bg-white hover:text-black transition-colors shrink-0 disabled:opacity-50"
            >
              {isGenerating ? "Compiling..." : "Generate Table"}
            </button>
          </form>

          {/* Engine Status Line */}
          <div className="mt-3 border-t border-black/10 pt-2 font-mono text-[11px] text-black/70 flex items-center gap-2">
            <Terminal size={12} />
            <span>{statusLog}</span>
          </div>
        </div>

        {/* Existing Tables View */}
        <div className="mt-8 space-y-6">
          {tables.map((table) => (
            <div key={table.tableName} className="border border-black bg-white">
              <div className="flex items-center justify-between border-b border-black bg-white px-4 py-2">
                <span className="font-mono text-xs font-bold uppercase">{table.tableName}</span>
                <span className="text-[10px] font-mono text-black/60">
                  {table.columns.length} Columns Defined
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-black bg-white text-black/70">
                      <th className="py-2 px-4 font-medium">Column Name</th>
                      <th className="py-2 px-4 font-medium">Data Type</th>
                      <th className="py-2 px-4 font-medium">Nullable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10">
                    {table.columns.map((col) => (
                      <tr key={col.name}>
                        <td className="py-2 px-4 font-bold">{col.name}</td>
                        <td className="py-2 px-4">{col.type}</td>
                        <td className="py-2 px-4">{col.nullable ? "YES" : "NO"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}