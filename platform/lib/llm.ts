export type LlmResult = {
  text: string;
  provider: string;
};

interface OpenAiStyleResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

function cleanOutput(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```html")) {
    cleaned = cleaned.replace(/^```html/i, "").replace(/```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-z]*/i, "").replace(/```$/, "");
  }
  return cleaned.trim();
}

export async function callGroq(
  system: string,
  prompt: string,
  maxTokens: number
): Promise<LlmResult> {
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      max_tokens: Math.min(maxTokens, 4096),
      temperature: 0.2,
    }),
  });

  const raw = await res.text();
  let data: OpenAiStyleResponse;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Groq ${res.status}: ${raw.slice(0, 200) || "empty response"}`);
  }
  if (!res.ok) {
    throw new Error(`Groq ${res.status}: ${data.error?.message || "request failed"}`);
  }

  const text = data.choices?.[0]?.message?.content || "";
  return { text: cleanOutput(text), provider: `groq (${model})` };
}

export async function callOpenRouter(
  system: string,
  prompt: string,
  maxTokens: number
): Promise<LlmResult> {
  const model = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://platform-gamma-neon.vercel.app",
      "X-Title": "Groundwork IDE",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens,
    }),
  });

  const raw = await res.text();
  let data: OpenAiStyleResponse;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`OpenRouter ${res.status}: ${raw.slice(0, 200) || "empty response"}`);
  }
  if (!res.ok) {
    throw new Error(`OpenRouter ${res.status}: ${data.error?.message || "request failed"}`);
  }

  const text = data.choices?.[0]?.message?.content || "";
  return { text: cleanOutput(text), provider: `openrouter (${model})` };
}

export function availableProviders(): string[] {
  const providers: string[] = [];
  if (process.env.ANTHROPIC_API_KEY) providers.push("anthropic");
  if (process.env.GEMINI_API_KEY) providers.push("gemini");
  if (process.env.DEEPSEEK_API_KEY) providers.push("deepseek");
  if (process.env.GROQ_API_KEY) providers.push("groq");
  if (process.env.OPENROUTER_API_KEY) providers.push("openrouter");
  return providers;
}

export async function generateText(
  system: string,
  prompt: string,
  maxTokens = 8000
): Promise<LlmResult> {
  const providers = availableProviders();

  if (providers.length === 0) {
    throw new Error("No AI provider key is configured in environment variables.");
  }

  const errors: string[] = [];

  for (const provider of providers) {
    try {
      if (provider === "groq") return await callGroq(system, prompt, maxTokens);
      if (provider === "openrouter") return await callOpenRouter(system, prompt, maxTokens);
    } catch (err) {
      errors.push(`${provider}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  throw new Error(`Every configured AI provider failed:\n${errors.join("\n")}`);
}