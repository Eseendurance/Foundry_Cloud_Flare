"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { Database, Plus, RefreshCw, Trash2 } from "lucide-react";

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

  const [newTableName, setNewTableName] = useState("");

  function handleCreateTable(e: React.FormEvent) {
    e.preventDefault();
    if (!newTableName.trim()) return;

    setTables((prev) => [
      ...prev,
      {
        tableName: newTableName.trim().toLowerCase().replace(/\s+/g, "_"),
        columns: [
          { name: "id", type: "INTEGER", nullable: false },
          { name: "created_at", type: "TIMESTAMP", nullable: false },
        ],
      },
    ]);
    setNewTableName("");
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <Header />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between border-b border-black pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Database Architecture</h1>
            <p className="mt-1 text-xs text-black/70">
              Client-side relational schema control and table definitions.
            </p>
          </div>
        </div>

        {/* Create Table Section */}
        <div className="mt-8 border border-black p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-2">Create New Table</h2>
          <form onSubmit={handleCreateTable} className="flex gap-2">
            <input
              type="text"
              placeholder="Table name (e.g., organizations)"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              className="w-full border border-black bg-white px-3 py-2 text-xs text-black placeholder:text-black/40 focus:outline-none"
            />
            <button
              type="submit"
              className="border border-black bg-black px-4 py-2 text-xs font-medium text-white hover:bg-white hover:text-black transition-colors shrink-0"
            >
              Add Table
            </button>
          </form>
        </div>

        {/* Existing Tables */}
        <div className="mt-8 space-y-6">
          {tables.map((table) => (
            <div key={table.tableName} className="border border-black">
              <div className="flex items-center justify-between border-b border-black bg-white px-4 py-2">
                <span className="font-mono text-xs font-bold uppercase">{table.tableName}</span>
                <span className="text-[10px] font-mono text-black/60">
                  {table.columns.length} Columns
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