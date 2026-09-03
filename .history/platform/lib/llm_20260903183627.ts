type LlmResult = { text: string; provider: string };

type GeminiPart = { text?: string };
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message?: string };
};
type DeepSeekResponse = {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
};
type OpenAiStyleResponse = {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
};

async function callAnthropic(
  system: string,
  prompt: string,
  maxTokens: number
): Promise<LlmResult> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const res = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  const block = res.content.find((b) => b.type === "text");
  const text = block && "text" in block ? block.text : "";
  return { text, provider: "anthropic (claude-sonnet-5)" };
}

async function callGemini(
  system: string,
  prompt: string,
  maxTokens: number
): Promise<LlmResult> {
  const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": process.env.GEMINI_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    }
  );

  const raw = await res.text();
  let data: GeminiResponse;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Gemini ${res.status}: ${raw.slice(0, 200) || "empty response"}`);
  }
  if (!res.ok) {
    throw new Error(`Gemini ${res.status}: ${data.error?.message || "request failed"}`);
  }

  const text = (data.candidates?.[0]?.content?.parts || [])
    .map((p) => p.text || "")
    .join("");
  return { text, provider: `gemini (${model})` };
}

async function callDeepSeek(
  system: string,
  prompt: string,
  maxTokens: number
): Promise<LlmResult> {
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
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
  let data: DeepSeekResponse;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`DeepSeek ${res.status}: ${raw.slice(0, 200) || "empty response"}`);
  }
  if (!res.ok) {
    throw new Error(`DeepSeek ${res.status}: ${data.error?.message || "request failed"}`);
  }

  const text = data.choices?.[0]?.message?.content || "";
  return { text, provider: `deepseek (${model})` };
}

async function callGroq(
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
      max_tokens: maxTokens,
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
  return { text, provider: `groq (${model})` };
}

async function callOpenRouter(
  system: string,
  prompt: string,
  maxTokens: number
): Promise<LlmResult> {
  const model = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
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
  return { text, provider: `openrouter (${model})` };
}

/** Providers in priority order, filtered to only ones you've configured. */
export function availableProviders(): string[] {
  const providers: string[] = [];
  if (process.env.ANTHROPIC_API_KEY) providers.push("anthropic");
  if (process.env.GEMINI_API_KEY) providers.push("gemini");
  if (process.env.DEEPSEEK_API_KEY) providers.push("deepseek");
  if (process.env.GROQ_API_KEY) providers.push("groq");
  if (process.env.OPENROUTER_API_KEY) providers.push("openrouter");
  return providers;
}

/**
 * Generates text using whichever provider is configured, trying each in
 * priority order (anthropic → gemini → deepseek → groq → openrouter) and falling through to
 * the next on failure — so a rejected card, an expired key, or a
 * provider outage on one doesn't take the whole feature down as long as
 * you have at least one other key set.
 */
export async function generateText(
  system: string,
  prompt: string,
  maxTokens = 8000
): Promise<LlmResult> {
  const providers = availableProviders();

  if (providers.length === 0) {
    throw new Error(
      "No AI provider is configured. Set one of ANTHROPIC_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY in your Vercel project's environment variables — see the README."
    );
  }

  const errors: string[] = [];

  for (const provider of providers) {
    try {
      if (provider === "anthropic") return await callAnthropic(system, prompt, maxTokens);
      if (provider === "gemini") return await callGemini(system, prompt, maxTokens);
      if (provider === "deepseek") return await callDeepSeek(system, prompt, maxTokens);
      if (provider === "groq") return await callGroq(system, prompt, maxTokens);
      if (provider === "openrouter") return await callOpenRouter(system, prompt, maxTokens);
    } catch (err) {
      errors.push(`${provider}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  throw new Error(`Every configured AI provider failed:\n${errors.join("\n")}`);
}