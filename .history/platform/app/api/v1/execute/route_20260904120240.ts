import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/llm";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const apiKey = authHeader?.replace("Bearer ", "");

  // 1. Verify Groundwork API Key
  if (!apiKey || apiKey !== process.env.GROUNDWORK_MASTER_KEY) {
    return NextResponse.json({ error: "Unauthorized: Invalid API Key" }, { status: 401 });
  }

  const { steps } = await req.json(); // Array of automation actions
  let context: Record<string, any> = {};

  try {
    for (const step of steps) {
      if (step.type === "ai_generate") {
        // Run AI Node through your llm.ts engine
        const result = await generateText(
          step.system || "You are an automation assistant.",
          step.prompt,
          4000
        );
        context[step.id] = result.text;
      } else if (step.type === "webhook_http") {
        // Run HTTP Action Node (Make/Zapier style fetch)
        const fetchRes = await fetch(step.url, {
          method: step.method || "POST",
          headers: step.headers || { "Content-Type": "application/json" },
          body: JSON.stringify(step.body || context),
        });
        context[step.id] = await fetchRes.json();
      }
    }

    return NextResponse.json({ success: true, result: context });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}