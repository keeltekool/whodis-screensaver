"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type ColorCelebrity = {
  id: number;
  name: string;
  category: string;
  era: string;
  photo_key: string;
};

const R2_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://pub-19f678b6a57845a7bafc5e706541ab76.r2.dev";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function GalleryPage() {
  const [celebrities, setCelebrities] = useState<ColorCelebrity[]>([]);
  const [playlist, setPlaylist] = useState<ColorCelebrity[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch color celebrities
  useEffect(() => {
    fetch("/api/color")
      .then((res) => res.json())
      .then((data) => {
        setCelebrities(data);
        setPlaylist(shuffleArray(data));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch color celebrities:", err);
        setLoading(false);
      });
  }, []);

  // Auto-advance
  useEffect(() => {
    if (paused || playlist.length === 0) return;
    intervalRef.current = setInterval(() => {
      setIndex((prev) => {
        if (prev >= playlist.length - 1) {
          setPlaylist(shuffleArray(celebrities));
          return 0;
        }
        return prev + 1;
      });
    }, 8000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, playlist, celebrities]);

  // Preload next image
  useEffect(() => {
    if (playlist.length > 0 && index < playlist.length - 1) {
      const img = new Image();
      img.src = `${R2_BASE}/photos/${playlist[index + 1].photo_key}`;
    }
  }, [index, playlist]);

  const next = useCallback(() => {
    setIndex((prev) => {
      if (prev >= playlist.length - 1) {
        setPlaylist(shuffleArray(celebrities));
        return 0;
      }
      return prev + 1;
    });
  }, [playlist, celebrities]);

  const prev = useCallback(() => {
    setIndex((prev) => (prev <= 0 ? playlist.length - 1 : prev - 1));
  }, [playlist]);

  const togglePause = useCallback(() => setPaused((p) => !p), []);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    const handler = () => resetHideTimer();
    window.addEventListener("mousemove", handler);
    resetHideTimer();
    return () => window.removeEventListener("mousemove", handler);
  }, [resetHideTimer]);

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case " ": e.preventDefault(); togglePause(); break;
        case "ArrowRight": next(); break;
        case "ArrowLeft": prev(); break;
        case "Escape": window.location.href = "/"; break;
        case "f": case "F":
          if (!document.fullscreenElement) document.documentElement.requestFullscreen();
          else document.exitFullscreen();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, togglePause]);

  if (loading || playlist.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-surface">
        <span className="font-headline text-xl text-primary-fixed-dim animate-pulse">Loading...</span>
      </main>
    );
  }

  const current = playlist[index];
  const photoUrl = `${R2_BASE}/photos/${current.photo_key}`;

  return (
    <main className="min-h-screen flex flex-col bg-black relative overflow-hidden">
      {/* Full-bleed photo */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-3xl px-4 py-4">
          <div className="relative overflow-hidden" style={{ maxHeight: "calc(100vh - 40px)" }}>
            <img
              src={photoUrl}
              alt={current.name}
              className="w-full h-auto object-contain"
              style={{ maxHeight: "calc(100vh - 40px)" }}
            />
            {/* Name overlay at bottom */}
            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
              <h2 className="font-headline font-black text-3xl md:text-4xl text-white tracking-tighter leading-[0.85]">
                {current.name.toUpperCase()}
              </h2>
              <div className="mt-2 flex gap-2">
                <span className="bg-white/20 text-white/80 px-2 py-0.5 font-label text-[9px] font-bold uppercase tracking-widest">
                  {current.category}
                </span>
                <span className="bg-white/10 text-white/60 px-2 py-0.5 font-label text-[9px] font-bold uppercase tracking-widest">
                  {current.era}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay controls */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
        <div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-6 p-6 pointer-events-auto">
          <button onClick={prev} className="text-white/50 hover:text-white transition-colors">
            <span className="font-headline text-2xl">&#9664;</span>
          </button>
          <button onClick={togglePause} className="text-white/50 hover:text-white transition-colors">
            <span className="font-headline text-2xl">{paused ? "\u25B6" : "\u23F8"}</span>
          </button>
          <button onClick={next} className="text-white/50 hover:text-white transition-colors">
            <span className="font-headline text-2xl">&#9654;</span>
          </button>
        </div>

        <a
          href="/"
          className="absolute top-4 left-4 pointer-events-auto text-white/30 hover:text-white transition-colors font-label text-[10px] uppercase tracking-widest"
        >
          &#8592; Back
        </a>

        <span className="absolute bottom-6 right-6 text-white/20 font-label text-[10px] uppercase tracking-widest pointer-events-none">
          ESC to exit &middot; F fullscreen
        </span>
      </div>
    </main>
  );
}
