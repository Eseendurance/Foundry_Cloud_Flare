import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/llm";

const SYSTEM_PROMPT = `
You are an expert full-stack web developer.
Your task is to generate a single-file, fully functional web application based on the user's prompt.

Guidelines:
1. Output ONLY valid, raw executable HTML code inside a single standard HTML wrapper.
2. Do NOT wrap your output in markdown code fences (do NOT use \`\`\`html or \`\`\`).
3. Include all required CSS directly using embedded Tailwind CSS (<script src="https://cdn.tailwindcss.com"></script>).
4. Include all JavaScript logic within inline <script> tags.
5. Make sure the application is interactive, beautifully designed, and handles runtime state properly.
`;

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "A valid prompt is required." },
        { status: 400 }
      );
    }

    // Call your LLM fallback chain (Anthropic -> Gemini -> DeepSeek -> Groq -> OpenRouter)
    const result = await generateText(SYSTEM_PROMPT, prompt, 8000);

    return NextResponse.json({
      html: result.text,
      provider: result.provider,
    });
  } catch (error: any) {
    console.error("Generation route error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during generation." },
      { status: 500 }
    );
  }
}