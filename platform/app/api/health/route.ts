import { NextResponse } from "next/server";
import { databaseConfigured } from "@/lib/db";
import { authConfigured } from "@/lib/auth";
import { smtpConfigured } from "@/lib/email";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    time: new Date().toISOString(),
    modules: {
      appBuilder: Boolean(process.env.ANTHROPIC_API_KEY),
      accountsAndDatabase: databaseConfigured() && authConfigured(),
      email: smtpConfigured(),
      voice: Boolean(process.env.ELEVENLABS_API_KEY),
      search: databaseConfigured() && authConfigured(),
      domainLookup: true,
      ide: true,
    },
  });
}
