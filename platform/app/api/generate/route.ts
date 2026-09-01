import { NextRequest, NextResponse } from "next/server";
import { generateText, availableProviders } from "@/lib/llm";
import { rateLimited, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are the app builder inside Groundwork, a developer platform. A user describes something they want built. You respond with ONE self-contained HTML document that implements it as a real, working web app.

Rules:
- Output raw HTML only. No markdown fences, no commentary before or after.
- Start the response with <!DOCTYPE html> and nothing else.
- Put all CSS in a <style> tag and all JavaScript in a <script> tag, inline in the document. Do not reference external files.
- You may use React via these exact CDN script tags when the app benefits from it:
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  then a <script type="text/babel"> block. For anything simpler, plain HTML/CSS/JS is better.
- Make it actually functional: real interactivity, real state, real validation. Not a static mockup.
- Give it clean, modern styling with real spacing and a coherent color palette. Do not use a generic dark-with-neon-accent theme by default.
- Keep it to a single page/app. No routing, no backend calls, no external APIs that require keys.
- If the request is unsafe, harmful, or asks for something that cannot be a static client-side app (e.g. it requires a real database or sending real email), output a short HTML page explaining what's out of scope for a single-page generation and suggesting a simpler version, instead of pretending to build it.`;

export async function POST(req: NextRequest) {
  if (rateLimited(`generate:${clientKey(req)}`, 8, 5 * 60_000)) {
    return NextResponse.json(
      { error: "Too many generations from this connection in a short window. Wait a few minutes and try again." },
      { status: 429 }
    );
  }

  let body: { prompt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send this as JSON with a prompt field." }, { status: 400 });
  }

  const prompt = (body.prompt || "").trim();
  if (!prompt || prompt.length < 4) {
    return NextResponse.json({ error: "Describe what you want to build first." }, { status: 400 });
  }

  if (availableProviders().length === 0) {
    return NextResponse.json(
      {
        error:
          "No AI provider is configured. Set one of ANTHROPIC_API_KEY, GEMINI_API_KEY, or DEEPSEEK_API_KEY in your Vercel project's environment variables — see the README.",
      },
      { status: 500 }
    );
  }

  try {
    const { text, provider } = await generateText(SYSTEM_PROMPT, prompt.slice(0, 2000), 8000);
    return NextResponse.json({ html: text, provider });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Generation failed unexpectedly.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
