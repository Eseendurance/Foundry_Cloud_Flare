"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { Database, Table, Plus, HardDrive, RefreshCw, KeyRound, Check } from "lucide-react";

const SAMPLE_TABLES = [
  { name: "users", rows: 142, size: "24 KB" },
  { name: "subscriptions", rows: 18, size: "8 KB" },
  { name: "telemetry_logs", rows: 1205, size: "156 KB" },
  { name: "dispatches", rows: 89, size: "12 KB" },
];

export default function DatabasePage() {
  const [tables, setTables] = useState(SAMPLE_TABLES);
  const [newTableName, setNewTableName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreateTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;
    setCreating(true);

    setTimeout(() => {
      setTables((prev) => [
        ...prev,
        { name: newTableName.trim().toLowerCase().replace(/\s+/g, "_"), rows: 0, size: "4 KB" },
      ]);
      setNewTableName("");
      setCreating(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-800">
      <Header />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Database Inspector & Storage
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage client-side WASM SQLite instances and serverless persistent tables.
            </p>
          </div>
          <span className="flex items-center gap-1.5 self-start rounded-full border border-emerald-600/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-700 md:self-auto">
            <HardDrive size={14} /> Keyless Local Database Engine
          </span>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          {/* Table List */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900">
                <Database size={18} />
                <h2 className="font-semibold text-slate-900">Active Tables</h2>
              </div>
              <span className="text-xs text-slate-500 font-mono">{tables.length} tables active</span>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500">
                    <th className="pb-3 pr-4 font-medium">Table Name</th>
                    <th className="pb-3 pr-4 font-medium">Record Count</th>
                    <th className="pb-3 pr-4 font-medium">Estimated Size</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {tables.map((tbl) => (
                    <tr key={tbl.name}>
                      <td className="py-3 pr-4 font-mono font-medium text-slate-900">{tbl.name}</td>
                      <td className="py-3 pr-4 text-slate-600">{tbl.rows} rows</td>
                      <td className="py-3 pr-4 text-slate-500 font-mono">{tbl.size}</td>
                      <td className="py-3 text-right">
                        <button className="text-[11px] font-medium text-slate-600 hover:text-slate-900">
                          Inspect Schema
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-4 flex flex-col justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Create Table</h2>
              <p className="mt-1 text-xs text-slate-500">
                Provision a new table directly within your local SQLite instance.
              </p>

              <form onSubmit={handleCreateTable} className="mt-5 flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="table_name"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-[#faf8f5] px-3.5 py-2 text-xs text-slate-800 focus:border-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={creating || !newTableName.trim()}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  <Plus size={14} />
                  {creating ? "Creating..." : "Add Table"}
                </button>
              </form>
            </div>

            <div className="mt-6 rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-800 flex items-start gap-2">
              <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />
              <span>Database state synced in real-time. No external server keys required.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}