"use client";

import { useState } from "react";

interface WorkflowNode {
  id: string;
  type: "trigger" | "ai_agent" | "http_request";
  data: {
    label: string;
    prompt?: string;
    targetUrl?: string;
  };
}

const INITIAL_NODES: WorkflowNode[] = [
  {
    id: "node_1",
    type: "trigger",
    data: { label: "1. Webhook Ingestion Trigger" },
  },
  {
    id: "node_2",
    type: "ai_agent",
    data: {
      label: "2. Gemini AI Data Transformation",
      prompt: "Extract customer intent and compute order risk score.",
    },
  },
  {
    id: "node_3",
    type: "http_request",
    data: {
      label: "3. Forward to Raw Engine Gateway",
      targetUrl: "https://platform.briefgroup.net/v1/ingest",
    },
  },
];

export default function WorkflowsPage() {
  const [nodes, setNodes] = useState<WorkflowNode[]>(INITIAL_NODES);
  const [triggerPayload, setTriggerPayload] = useState(
    JSON.stringify({ order_id: "ORD_7891", amount: 240, customer: "user@example.com" }, null, 2)
  );
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [executing, setExecuting] = useState(false);

  function handleAddNode(type: "ai_agent" | "http_request") {
    const newNode: WorkflowNode = {
      id: `node_${nodes.length + 1}`,
      type,
      data: {
        label: `${nodes.length + 1}. ${type === "ai_agent" ? "Gemini AI Agent" : "HTTP Action Dispatch"}`,
        prompt: type === "ai_agent" ? "Analyze payload" : undefined,
      },
    };
    setNodes([...nodes, newNode]);
  }

  function handleRemoveNode(id: string) {
    if (nodes.length <= 1) return;
    setNodes(nodes.filter((n) => n.id !== id));
  }

  async function handleRunWorkflow() {
    setExecuting(true);
    setExecutionResult(null);

    let parsedPayload = {};
    try {
      parsedPayload = JSON.parse(triggerPayload);
    } catch (e) {
      alert("Invalid trigger JSON payload.");
      setExecuting(false);
      return;
    }

    try {
      const res = await fetch("/api/workflows/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, triggerPayload: parsedPayload }),
      });
      const data = await res.json();
      setExecutionResult(data);
    } catch (err) {
      console.error("Workflow Execution Error", err);
    } fontally {
      setExecuting(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">AI Automation Canvas</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Build node-based automation graphs (n8n & Make.com style) compiled to your raw engine execution layer.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleAddNode("ai_agent")}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition"
          >
            + Add AI Node
          </button>
          <button
            onClick={() => handleAddNode("http_request")}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition"
          >
            + Add Action Node
          </button>
          <button
            onClick={handleRunWorkflow}
            disabled={executing}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg shadow-sm transition"
          >
            {executing ? "Running Execution..." : "▶ Test Canvas Run"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Node Automation Canvas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-sm space-y-6">
            <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              Visual Execution Graph
            </h2>

            <div className="space-y-4">
              {nodes.map((node, index) => (
                <div key={node.id} className="relative">
                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 relative group">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold font-mono text-emerald-400">{node.data.label}</span>
                      <button
                        onClick={() => handleRemoveNode(node.id)}
                        className="text-xs text-slate-500 hover:text-red-400 transition"
                      >
                        ✕ Remove
                      </button>
                    </div>

                    {node.type === "ai_agent" && (
                      <div>
                        <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                          Gemini Prompt Directive
                        </label>
                        <input
                          type="text"
                          value={node.data.prompt || ""}
                          onChange={(e) => {
                            const updated = [...nodes];
                            updated[index].data.prompt = e.target.value;
                            setNodes(updated);
                          }}
                          className="w-full p-2 bg-slate-950 text-slate-200 border border-slate-800 rounded text-xs focus:outline-none"
                        />
                      </div>
                    )}

                    {node.type === "http_request" && (
                      <div className="text-xs font-mono text-slate-400">
                        Target Protocol: <span className="text-emerald-400">HTTP/POST Gateway</span>
                      </div>
                    )}
                  </div>

                  {/* Flow Connector Arrow */}
                  {index < nodes.length - 1 && (
                    <div className="flex justify-center my-2">
                      <div className="w-0.5 h-6 bg-emerald-500/50"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payload & Debug Viewer */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Trigger Event Payload</h3>
            <textarea
              rows={6}
              value={triggerPayload}
              onChange={(e) => setTriggerPayload(e.target.value)}
              className="w-full p-3 bg-slate-950 text-slate-200 font-mono text-xs rounded-lg border border-slate-800 focus:outline-none resize-none"
              spellCheck={false}
            />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm min-h-[220px]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Execution Logs & Step Traces
            </h3>

            {executionResult && executionResult.executionLog ? (
              <div className="space-y-3">
                {executionResult.executionLog.map((log: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded border border-slate-800 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-400 font-bold">{log.label}</span>
                      <span className="text-[10px] text-slate-500">{log.executionTimeMs}ms</span>
                    </div>
                    {log.error ? (
                      <div className="text-red-400 mt-1">{log.error}</div>
                    ) : (
                      <div className="text-slate-400 text-[11px] truncate mt-1">
                        Output: {JSON.stringify(log.output)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 text-center py-8">
                Click "Test Canvas Run" to execute step-by-step automation traces.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}