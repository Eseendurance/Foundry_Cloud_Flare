"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { Bot, Send, Sparkles, Code, Terminal, CheckCircle2 } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function CopilotPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your AI Copilot. How can I help you construct or optimize your platform features today?",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Simulated copilot response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I've analyzed your request regarding "${userMsg.content}". Your architecture is ready to generate keyless frontend and backend modules seamlessly.`,
        },
      ]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-800 flex flex-col">
      <Header />

      <main className="mx-auto max-w-5xl px-6 py-10 flex-1 flex flex-col w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              AI Copilot
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Interactive assistant for code generation, backend architecture, and platform debugging.
            </p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-700">
            <Sparkles size={14} /> Active Engine
          </span>
        </div>

        {/* Chat Container */}
        <div className="mt-8 flex-1 flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[450px]">
          {/* Message History */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shrink-0">
                    <Bot size={16} />
                  </div>
                )}
                <div
                  className={`max-w-xl rounded-xl px-4 py-3 text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-800 border border-slate-200/60"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Bot size={16} className="animate-spin" /> Thinking...
              </div>
            )}
          </div>

          {/* Prompt Form */}
          <form onSubmit={handleSend} className="border-t border-slate-200 bg-[#faf8f5] p-4 flex gap-2">
            <input
              type="text"
              placeholder="Ask Copilot to build a component, generate schema, or write APIs..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 focus:border-slate-400 focus:outline-none shadow-sm"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send size={14} /> Send
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}