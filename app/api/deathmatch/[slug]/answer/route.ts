import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { round_number, answer } = body;

    if (!round_number || !answer || !["a", "b"].includes(answer)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const sql = getDb();

    const [round] = await sql`
      SELECT mr.correct_answer, mr.explanation, mr.fun_fact
      FROM matchup_rounds mr
      JOIN matchups m ON m.id = mr.matchup_id
      WHERE m.slug = ${slug} AND mr.round_number = ${round_number}
    `;

    if (!round) {
      return NextResponse.json({ error: "Round not found" }, { status: 404 });
    }

    return NextResponse.json({
      correct: answer === round.correct_answer,
      correct_answer: round.correct_answer,
      explanation: round.explanation,
      fun_fact: round.fun_fact,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Deathmatch answer API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
