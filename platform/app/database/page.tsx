"use client";

import { useState, useEffect } from "react";

export default function DatabaseStudioPage() {
  const [activeTab, setActiveTab] = useState<"tables" | "sql" | "api">("tables");
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // SQL Studio State
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM \"IngestedRecord\" LIMIT 10;");
  const [sqlResult, setSqlResult] = useState<any[] | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [executingSql, setExecutingSql] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadTableData(selectedTable);
    }
  }, [selectedTable]);

  async function fetchTables() {
    try {
      const res = await fetch("/api/database/tables");
      const data = await res.json();
      if (data.tables && data.tables.length > 0) {
        setTables(data.tables);
        setSelectedTable(data.tables[0]);
      }
    } catch (err) {
      console.error("Failed to load database tables", err);
    }
  }

  async function loadTableData(tableName: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/database/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: `SELECT * FROM "${tableName}" LIMIT 50;` }),
      });
      const data = await res.json();
      if (data.data) {
        setTableData(data.data);
      } else {
        setTableData([]);
      }
    } catch (err) {
      console.error("Failed to fetch table data", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRunSql() {
    if (!sqlQuery.trim()) return;

    setExecutingSql(true);
    setSqlError(null);
    setSqlResult(null);

    try {
      const res = await fetch("/api/database/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: sqlQuery }),
      });
      const data = await res.json();

      if (data.success) {
        setSqlResult(Array.isArray(data.data) ? data.data : [data.data]);
      } else {
        setSqlError(data.error || "Query execution failed");
      }
    } catch (err: any) {
      setSqlError(err.message || "An error occurred");
    } finally {
      setExecutingSql(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Database Studio</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage schemas, browse PostgreSQL tables, execute raw SQL queries, and inspect raw engine auto-APIs.
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab("tables")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === "tables"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            📊 Table Browser
          </button>
          <button
            onClick={() => setActiveTab("sql")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === "sql"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            ⚡ SQL Query Runner
          </button>
          <button
            onClick={() => setActiveTab("api")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === "api"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            🔌 Auto REST & DSL APIs
          </button>
        </div>
      </div>

      {/* TAB 1: Table Browser */}
      {activeTab === "tables" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table Sidebar List */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">PostgreSQL Tables</h2>
            <div className="space-y-1">
              {tables.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTable(t)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-mono transition flex justify-between items-center ${
                    selectedTable === t
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{t}</span>
                  <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                    tbl
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Table Data Grid */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40">
              <span className="font-semibold text-slate-900 dark:text-white text-sm">
                Table: <span className="font-mono text-emerald-600 dark:text-emerald-400">{selectedTable}</span>
              </span>
              <button
                onClick={() => loadTableData(selectedTable)}
                className="text-xs px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300"
              >
                {loading ? "Refreshing..." : "↻ Refresh Data"}
              </button>
            </div>

            <div className="overflow-x-auto flex-1 max-h-[500px]">
              {tableData.length > 0 ? (
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                      {Object.keys(tableData[0]).map((key) => (
                        <th key={key} className="p-3 whitespace-nowrap">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {tableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        {Object.values(row).map((val: any, vIdx) => (
                          <td key={vIdx} className="p-3 max-w-xs truncate">
                            {typeof val === "object" ? JSON.stringify(val) : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-slate-400 text-sm">
                  {loading ? "Loading table records..." : "No records found in this table."}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SQL Query Runner */}
      {activeTab === "sql" && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-mono font-semibold text-slate-400">SQL Query Editor</label>
              <button
                onClick={handleRunSql}
                disabled={executingSql}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition"
              >
                {executingSql ? "Executing..." : "▶ Execute Query"}
              </button>
            </div>
            <textarea
              rows={5}
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              className="w-full p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-lg border border-slate-800 focus:outline-none leading-relaxed"
              spellCheck={false}
            />
          </div>

          {/* Results Output */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm min-h-[250px]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Query Execution Output</h3>

            {sqlError && (
              <div className="p-4 bg-red-950/40 border border-red-800 text-red-400 text-xs font-mono rounded-lg">
                ❌ {sqlError}
              </div>
            )}

            {sqlResult && (
              <div className="overflow-x-auto">
                {sqlResult.length > 0 && typeof sqlResult[0] === "object" ? (
                  <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                        {Object.keys(sqlResult[0]).map((key) => (
                          <th key={key} className="p-3 whitespace-nowrap">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                      {sqlResult.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          {Object.values(row).map((val: any, vIdx) => (
                            <td key={vIdx} className="p-3 max-w-xs truncate">
                              {typeof val === "object" ? JSON.stringify(val) : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-lg overflow-auto">
                    {JSON.stringify(sqlResult, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {!sqlError && !sqlResult && (
              <div className="text-center py-12 text-slate-400 text-sm">
                Write a SQL query above and click "Execute Query" to inspect output rows.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Auto REST & DSL API Documentation */}
      {activeTab === "api" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Auto-Generated Database Ingestion Endpoint</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Your raw engine ingestion gateway automatically maps inbound JSON payloads directly to your database tables via bearer tokens.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-950 rounded-lg font-mono text-xs text-slate-200 border border-slate-800 space-y-2">
              <div className="text-emerald-400 font-bold">POST /v1/ingest</div>
              <div className="text-slate-400">Headers: Authorization: Bearer fg_live_...</div>
              <pre className="text-emerald-300 mt-2">
{`{
  "pipeline": "sample.pipe",
  "payload": {
    "id": "usr_1001",
    "name": "Alex Smith",
    "role": "ADMIN"
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}