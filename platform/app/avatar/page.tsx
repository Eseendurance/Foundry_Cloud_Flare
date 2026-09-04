"use client";

import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import { Play, Square, Video, Volume2, Sparkles, User, RefreshCw } from "lucide-react";

export default function AvatarModule() {
  const [script, setScript] = useState(
    "Welcome to Foundry Cloud. This AI avatar operates completely locally in your browser without external API keys."
  );
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [avatarStyle, setAvatarStyle] = useState<"cyan" | "emerald" | "purple">("emerald");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Load browser TTS voices
  useEffect(() => {
    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
      if (available.length > 0 && !selectedVoice) {
        setSelectedVoice(available[0].name);
      }
    };

    updateVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [selectedVoice]);

  // Canvas visualizer rendering lip movement
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const themeColor =
        avatarStyle === "emerald"
          ? "#10b981"
          : avatarStyle === "cyan"
          ? "#06b6d4"
          : "#a855f7";

      // Outer glowing frame
      ctx.beginPath();
      ctx.arc(150, 120, 75, 0, Math.PI * 2);
      ctx.fillStyle = "#0f172a";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = themeColor;
      ctx.stroke();

      // Eyes
      const blink = Math.sin(tick * 0.05) > 0.98 ? 1 : 12;
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.ellipse(125, 105, 8, blink, 0, 0, Math.PI * 2);
      ctx.ellipse(175, 105, 8, blink, 0, 0, Math.PI * 2);
      ctx.fill();

      // Mouth animation during speech
      ctx.beginPath();
      if (isSpeaking) {
        const mouthMouthOpen = 8 + Math.abs(Math.sin(tick * 0.25)) * 14;
        ctx.ellipse(150, 145, 16, mouthMouthOpen, 0, 0, Math.PI * 2);
        ctx.fillStyle = themeColor;
        ctx.fill();
      } else {
        ctx.arc(150, 140, 14, 0.1 * Math.PI, 0.9 * Math.PI, false);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#94a3b8";
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isSpeaking, avatarStyle]);

  const startSpeaking = () => {
    if (!script.trim() || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(script);

    if (selectedVoice) {
      const voiceObj = voices.find((v) => v.name === selectedVoice);
      if (voiceObj) utterance.voice = voiceObj;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              AI Avatar Studio
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Generates spoken avatar feeds directly inside the client engine using native WebSpeech API.
            </p>
          </div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
            Keyless Browser TTS
          </span>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          {/* Avatar Canvas Stage */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 p-6 lg:col-span-5">
            <div className="relative flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={300}
                height={240}
                className="rounded-xl border border-slate-800 bg-slate-950 shadow-inner"
              />
              <div className="absolute bottom-3 right-3 rounded-md bg-slate-900/80 px-2 py-1 text-[10px] font-mono text-slate-400 backdrop-blur">
                {isSpeaking ? "rendering audio feed" : "idle status"}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <span className="text-xs text-slate-400">Theme:</span>
              {(["emerald", "cyan", "purple"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setAvatarStyle(style)}
                  className={`h-5 w-5 rounded-full border transition-all ${
                    style === "emerald"
                      ? "bg-emerald-500 border-emerald-400"
                      : style === "cyan"
                      ? "bg-cyan-500 border-cyan-400"
                      : "bg-purple-500 border-purple-400"
                  } ${avatarStyle === style ? "scale-125 ring-2 ring-white/20" : "opacity-60"}`}
                />
              ))}
            </div>
          </div>

          {/* Script & Voice Controls */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-6 lg:col-span-7">
            <div>
              <div className="flex items-center gap-2 text-emerald-400">
                <Sparkles size={18} />
                <h2 className="font-semibold text-slate-100">Avatar Script & Voice Settings</h2>
              </div>

              <div className="mt-4 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-400">Speech Script</label>
                  <textarea
                    rows={5}
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    placeholder="Enter transcript for the avatar to speak..."
                    className="mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400">Voice Profile</label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                  >
                    {voices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              {!isSpeaking ? (
                <button
                  onClick={startSpeaking}
                  disabled={!script.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  <Play size={16} /> Render & Speak
                </button>
              ) : (
                <button
                  onClick={stopSpeaking}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-500"
                >
                  <Square size={16} /> Halt Playback
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}