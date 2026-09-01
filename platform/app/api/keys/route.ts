import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { databaseConfigured } from "@/lib/db";
import { createApiKey, listApiKeys } from "@/lib/api-keys";
import { rateLimited, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET() {
  if (!databaseConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL isn't set." }, { status: 500 });
  }
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }
  const keys = await listApiKeys(session.userId);
  return NextResponse.json({ keys });
}

export async function POST(req: NextRequest) {
  if (!databaseConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL isn't set." }, { status: 500 });
  }

  if (rateLimited(`create-key:${clientKey(req)}`, 10, 10 * 60_000)) {
    return NextResponse.json(
      { error: "Too many keys created in a short window. Wait a bit and try again." },
      { status: 429 }
    );
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }

  let body: { name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send this as JSON." }, { status: 400 });
  }

  const name = (body.name || "").trim().slice(0, 100);
  if (!name) {
    return NextResponse.json({ error: "Give the key a name." }, { status: 400 });
  }

  const created = await createApiKey(session.userId, name);
  return NextResponse.json(created);
}
