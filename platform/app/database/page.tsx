"use client";

import { useState, useEffect } from "react";

interface IngestedRecord {
  id: string;
  sourceId: string;
  entityKey: string;
  payload: any;
  version: number;
  createdAt: string;
}

export default function DatabasePage() {
  const [records, setRecords] = useState<IngestedRecord[]>([]);
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<IngestedRecord | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, [search]);

  async function fetchRecords() {
    setLoading(true);
    try {
      const res = await fetch(`/api/records?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.records) setRecords(data.records);
    } catch (err) {
      console.error("Failed to fetch database records", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Database Inspector</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Real-time Neon PostgreSQL records ingested and transformed by the Raw Engine gateway.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex gap-4">
        <input
          type="text"
          placeholder="Search by source ID or entity key..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          onClick={fetchRecords}
          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition"
        >
          {loading ? "Searching..." : "Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table View */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-900 dark:text-white">
            Ingested Records ({records.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase font-medium">
                  <th className="p-4">Record ID</th>
                  <th className="p-4">Source</th>
                  <th className="p-4">Entity Key</th>
                  <th className="p-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {records.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedRecord(r)}
                    className={`cursor-pointer transition ${
                      selectedRecord?.id === r.id
                        ? "bg-emerald-50 dark:bg-emerald-950/50"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    }`}
                  >
                    <td className="p-4 font-mono text-xs text-slate-600 dark:text-slate-400">{r.id.substring(0, 12)}...</td>
                    <td className="p-4 font-medium text-slate-900 dark:text-white">{r.sourceId}</td>
                    <td className="p-4 font-mono text-slate-600 dark:text-slate-400">{r.entityKey}</td>
                    <td className="p-4 text-slate-500 text-xs">{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      No database records found. Send a payload to `/v1/ingest` to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* JSON Payload Viewer */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Record Payload Details</h2>
          {selectedRecord ? (
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="text-xs text-slate-500 space-y-1 font-mono">
                <div><strong className="text-slate-700 dark:text-slate-300">ID:</strong> {selectedRecord.id}</div>
                <div><strong className="text-slate-700 dark:text-slate-300">Source:</strong> {selectedRecord.sourceId}</div>
                <div><strong className="text-slate-700 dark:text-slate-300">Entity Key:</strong> {selectedRecord.entityKey}</div>
              </div>
              <pre className="flex-1 bg-slate-950 text-emerald-400 p-4 rounded-lg font-mono text-xs overflow-auto border border-slate-800">
                {JSON.stringify(selectedRecord.payload, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Click any record on the left to inspect its transformed JSON payload.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}