import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const sql = getDb();

    await sql`
      INSERT INTO daily_subscribers (email, active)
      VALUES (${email.toLowerCase().trim()}, true)
      ON CONFLICT (email) DO UPDATE SET
        active = true,
        unsubscribed_at = NULL,
        subscribed_at = NOW()
    `;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Subscribe error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
