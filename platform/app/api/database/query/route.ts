import { NextResponse } from "next/server";
import { prisma } from "../../../../../raw-engine/lib/prisma";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query string is required" }, { status: 400 });
    }

    const trimmed = query.trim().toUpperCase();

    // Prevent destructive root operations like DROP DATABASE
    if (trimmed.includes("DROP DATABASE") || trimmed.includes("TRUNCATE DATABASE")) {
      return NextResponse.json({ error: "Destructive operations on root database are blocked." }, { status: 403 });
    }

    // Execute raw SQL directly against Neon PostgreSQL
    const result = await prisma.$queryRawUnsafe(query);

    // Convert BigInts or dates to standard JSON serialized values
    const serializedResult = JSON.parse(
      JSON.stringify(result, (_, value) => (typeof value === "bigint" ? value.toString() : value))
    );

    return NextResponse.json({ success: true, data: serializedResult });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to execute SQL query" }, { status: 500 });
  }
}