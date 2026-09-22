import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const { nodes, edges, triggerPayload } = await req.json();

    if (!nodes || !Array.isArray(nodes)) {
      return NextResponse.json({ error: "Workflow node configuration is required" }, { status: 400 });
    }

    const executionLog: any[] = [];
    let currentPayload = triggerPayload || {};

    // Sequential node execution engine
    for (const node of nodes) {
      const startTime = Date.now();

      if (node.type === "trigger") {
        executionLog.push({
          nodeId: node.id,
          label: node.data.label,
          status: "SUCCESS",
          executionTimeMs: Date.now() - startTime,
          output: currentPayload,
        });
      } else if (node.type === "ai_agent") {
        if (!apiKey) {
          executionLog.push({
            nodeId: node.id,
            label: node.data.label,
            status: "FAILED",
            error: "GEMINI_API_KEY environment variable is missing",
          });
          break;
        }

        const promptText = node.data.prompt || "Summarize this payload";
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const aiResponse = await model.generateContent([
          { text: `System Instruction: You are an execution step inside an automation graph.` },
          { text: `Prompt Directive: ${promptText}\nInput Data: ${JSON.stringify(currentPayload)}` },
        ]);

        const responseText = aiResponse.response.text();
        currentPayload = { ...currentPayload, ai_output: responseText };

        executionLog.push({
          nodeId: node.id,
          label: node.data.label,
          status: "SUCCESS",
          executionTimeMs: Date.now() - startTime,
          output: currentPayload,
        });
      } else if (node.type === "http_request") {
        // Simulated HTTP node output
        currentPayload = {
          ...currentPayload,
          http_status: 200,
          delivered_at: new Date().toISOString(),
        };

        executionLog.push({
          nodeId: node.id,
          label: node.data.label,
          status: "SUCCESS",
          executionTimeMs: Date.now() - startTime,
          output: currentPayload,
        });
      }
    }

    return NextResponse.json({
      success: true,
      executionLog,
      finalPayload: currentPayload,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Workflow execution failed" }, { status: 500 });
  }
}