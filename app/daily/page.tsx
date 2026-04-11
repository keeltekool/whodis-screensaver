"use client";

import { useState } from "react";

export default function DailyLandingPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/daily/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed to subscribe");
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-surface flex flex-col">
      <section className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-16">
        <a
          href="/"
          className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/50 hover:text-primary-fixed-dim transition-colors mb-12"
        >
          ← Back to Hub
        </a>

        <span className="font-label text-[10px] uppercase tracking-[0.3em] text-primary-fixed-dim/60 mb-4">
          WHO DIS? — THE DAILY
        </span>

        <h1 className="font-headline font-black text-4xl sm:text-5xl md:text-6xl text-primary-fixed-dim tracking-tighter text-center">
          THE DAILY
        </h1>

        <div className="mt-6 w-12 h-1 bg-primary-fixed-dim" />

        <p className="mt-6 text-on-surface-variant text-center max-w-md font-body text-lg font-light">
          One challenge. Every day. Same for everyone.
        </p>
        <p className="mt-2 text-on-surface-variant/60 text-center max-w-lg font-body text-sm font-light">
          One deathmatch delivered to your inbox every morning. Two legends. Seven questions. Your knowledge decides who wins. No algorithms. No feeds. Just you and the icons.
        </p>

        {/* How it works */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl w-full">
          <div className="bg-surface-container-low p-6 text-center">
            <span className="font-headline font-black text-2xl text-primary-fixed-dim">1</span>
            <p className="mt-2 font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
              Subscribe
            </p>
            <p className="mt-1 font-body text-xs text-on-surface-variant/50">
              Enter your email below
            </p>
          </div>
          <div className="bg-surface-container-low p-6 text-center">
            <span className="font-headline font-black text-2xl text-primary-fixed-dim">2</span>
            <p className="mt-2 font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
              Get the email
            </p>
            <p className="mt-1 font-body text-xs text-on-surface-variant/50">
              Every morning at 7 AM
            </p>
          </div>
          <div className="bg-surface-container-low p-6 text-center">
            <span className="font-headline font-black text-2xl text-primary-fixed-dim">3</span>
            <p className="mt-2 font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
              Play
            </p>
            <p className="mt-1 font-body text-xs text-on-surface-variant/50">
              Fight today's deathmatch
            </p>
          </div>
        </div>

        {/* Subscribe form */}
        <div className="mt-12 w-full max-w-md">
          {status === "success" ? (
            <div className="bg-surface-container-low p-8 text-center">
              <span className="font-headline font-bold text-xl text-primary-fixed-dim">You're in.</span>
              <p className="mt-2 font-body text-sm text-on-surface-variant">
                Your first daily challenge arrives tomorrow morning.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 bg-surface-container-high text-on-surface font-body text-sm px-4 py-4 outline-none placeholder:text-on-surface-variant/30 focus:outline-2 focus:outline-primary-fixed-dim"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="bg-primary-container text-on-primary font-label font-bold text-sm py-4 px-8 tracking-[0.1em] uppercase transition-all hover:brightness-110 disabled:opacity-50"
              >
                {status === "loading" ? "..." : "SUBSCRIBE"}
              </button>
            </form>
          )}
          {status === "error" && (
            <p className="mt-2 text-red-400 font-body text-xs text-center">{errorMsg}</p>
          )}
        </div>

        {/* What you'll get */}
        <div className="mt-16 max-w-md text-center">
          <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/40 mb-4">
            What you'll get
          </p>
          <div className="space-y-3 text-on-surface-variant font-body text-sm font-light">
            <p>Every day: one <span className="text-primary-fixed-dim font-bold">DEATHMATCH</span> — two legends, seven questions, one winner</p>
            <p>Same matchup for everyone. Compare scores with friends.</p>
            <p className="text-on-surface-variant/40 text-xs">50 unique matchups before anything repeats. Unsubscribe anytime.</p>
          </div>
        </div>
      </section>

      <footer className="py-8 text-center">
        <p className="text-on-surface-variant/30 font-label text-[10px] uppercase tracking-[0.3em]">
          WHO DIS? · THE DAILY · 2026
        </p>
      </footer>
    </main>
  );
}
