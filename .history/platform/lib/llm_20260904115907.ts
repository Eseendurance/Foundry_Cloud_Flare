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
      max_tokens: Math.min(maxTokens, 4096), // Groq enforces max 4096 output tokens
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
      "HTTP-Referer": "https://platform-gamma-neon.vercel.app", // Required by OpenRouter for free tier ranking
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

// Helper function to prevent preview breaking due to markdown wrappers
function cleanOutput(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```html")) {
    cleaned = cleaned.replace(/^```html/, "").replace(/```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```/, "").replace(/```$/, "");
  }
  return cleaned.trim();
}