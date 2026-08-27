import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendEmail, smtpConfigured } from "@/lib/email";
import { rateLimited, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  if (rateLimited(`email:${clientKey(req)}`, 10, 10 * 60_000)) {
    return NextResponse.json(
      { error: "Too many sends from this connection in a short window. Wait a bit and try again." },
      { status: 429 }
    );
  }

  if (!smtpConfigured()) {
    return NextResponse.json(
      {
        error:
          "This module needs SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM set in your Vercel project's environment variables. Nothing is sent until they're connected — see the README.",
      },
      { status: 500 }
    );
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Log in first — sending real email is gated to your account." },
      { status: 401 }
    );
  }

  let body: { to?: string; subject?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send this as JSON." }, { status: 400 });
  }

  const to = (body.to || "").trim();
  const subject = (body.subject || "").trim().slice(0, 200);
  const text = (body.text || "").trim().slice(0, 5000);

  if (!EMAIL_RE.test(to)) {
    return NextResponse.json(
      { error: "That recipient address doesn't look valid." },
      { status: 400 }
    );
  }
  if (!subject || !text) {
    return NextResponse.json(
      { error: "Give it a subject and a message body." },
      { status: 400 }
    );
  }

  try {
    const result = await sendEmail({ to, subject, text });
    return NextResponse.json({ sent: true, messageId: result.messageId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Send failed.";
    return NextResponse.json(
      { error: `Your SMTP provider rejected this: ${msg}` },
      { status: 502 }
    );
  }
}
