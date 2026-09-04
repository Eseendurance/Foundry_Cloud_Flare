"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, Play, Plus, Cpu, Globe, Key } from "lucide-react";

const initialNodes: Node[] = [
  {
    id: "1",
    data: { label: "⚡ Trigger: Webhook Inbound" },
    position: { x: 100, y: 150 },
    style: {
      background: "#0f172a",
      color: "#f8fafc",
      border: "1px solid #334155",
      borderRadius: "12px",
      padding: "12px 20px",
      fontSize: "13px",
      fontWeight: "500",
    },
  },
  {
    id: "2",
    data: { label: "🤖 AI Step: Groundwork LLM" },
    position: { x: 400, y: 150 },
    style: {
      background: "#059669",
      color: "#ffffff",
      border: "1px solid #10b981",
      borderRadius: "12px",
      padding: "12px 20px",
      fontSize: "13px",
      fontWeight: "500",
    },
  },
];

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true },
];

export default function WorkflowsPage() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [apiKey, setApiKey] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<string | null>(null);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    []
  );

  const addAiNode = () => {
    const newNode: Node = {
      id: `${nodes.length + 1}`,
      data: { label: `🤖 AI Action Step ${nodes.length + 1}` },
      position: { x: 250, y: 250 },
      style: {
        background: "#1e293b",
        color: "#f8fafc",
        border: "1px solid #475569",
        borderRadius: "12px",
        padding: "12px 20px",
        fontSize: "13px",
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const executeWorkflow = async () => {
    if (!apiKey.trim()) {
      alert("Please enter your GROUNDWORK_MASTER_KEY to execute.");
      return;
    }

    setIsExecuting(true);
    setLogs("Initiating automation run sequence...\n");

    try {
      const res = await fetch("/api/v1/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          steps: [
            {
              id: "step_1",
              type: "ai_generate",
              prompt: "Generate a summary JSON payload for an incoming order.",
            },
          ],
        }),
      });

      const data = await res.json();
      setLogs(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setLogs(`Execution failed: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-slate-950 text-slate-100">
      {/* Top Header Controls */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 py-3">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft size={14} />
            Workspace
          </Link>
          <span className="h-4 w-px bg-slate-800" />
          <h1 className="text-sm font-semibold text-slate-100">
            Workflow Automation Builder
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5">
            <Key size={14} className="text-emerald-500" />
            <input
              type="password"
              placeholder="Groundwork Master Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={addAiNode}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            <Plus size={14} /> Add Step
          </button>

          <button
            type="button"
            onClick={executeWorkflow}
            disabled={isExecuting}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            <Play size={14} />
            {isExecuting ? "Running..." : "Test Workflow"}
          </button>
        </div>
      </header>

      {/* Main Flow Canvas & Log Output Area */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <Background color="#334155" gap={20} size={1} />
            <Controls />
          </ReactFlow>
        </div>

        {/* Execution Output Panel */}
        {logs && (
          <div className="w-80 border-l border-slate-800 bg-slate-900/90 p-4 font-mono text-xs overflow-auto">
            <div className="mb-2 font-semibold text-emerald-400">Execution Output:</div>
            <pre className="whitespace-pre-wrap text-slate-300">{logs}</pre>
          </div>
        )}
      </div>
    </div>
  );
}