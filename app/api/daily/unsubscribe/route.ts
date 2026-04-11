import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");

    if (!email) {
      return new Response("Missing email", { status: 400 });
    }

    const sql = getDb();

    await sql`
      UPDATE daily_subscribers
      SET active = false, unsubscribed_at = NOW()
      WHERE email = ${email.toLowerCase().trim()}
    `;

    return new Response(
      `<!DOCTYPE html><html><body style="background:#131313;color:#e5e2e1;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h1 style="color:#ffba20;font-size:2rem;margin-bottom:16px">WHO DIS?</h1><p style="font-size:1rem;margin-bottom:8px">You've been unsubscribed from THE DAILY.</p><p style="color:#666;font-size:0.875rem">You can resubscribe anytime.</p></div></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(message, { status: 500 });
  }
}
