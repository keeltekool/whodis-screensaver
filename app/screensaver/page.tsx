"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Celebrity } from "@/lib/types";
import { useSettings } from "@/hooks/useSettings";
import { useSlideshow } from "@/hooks/useSlideshow";
import SlideView from "@/components/SlideView";
import SettingsPanel from "@/components/SettingsPanel";

const R2_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://pub-19f678b6a57845a7bafc5e706541ab76.r2.dev";

export default function ScreensaverPage() {
  const [celebrities, setCelebrities] = useState<Celebrity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { settings, update } = useSettings();
  const { current, paused, next, prev, togglePause } = useSlideshow(celebrities, settings, R2_BASE);

  // Fetch celebrities
  useEffect(() => {
    fetch("/api/celebrities")
      .then((res) => res.json())
      .then((data) => {
        setCelebrities(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch celebrities:", err);
        setLoading(false);
      });
  }, []);

  // Auto-hide controls after 3s of no mouse movement
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (!showSettings) {
      hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [showSettings]);

  useEffect(() => {
    const handler = () => resetHideTimer();
    window.addEventListener("mousemove", handler);
    resetHideTimer();
    return () => window.removeEventListener("mousemove", handler);
  }, [resetHideTimer]);

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showSettings) return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePause();
          break;
        case "ArrowRight":
          next();
          break;
        case "ArrowLeft":
          prev();
          break;
        case "Escape":
          window.location.href = "/";
          break;
        case "f":
        case "F":
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, togglePause, showSettings]);

  if (loading || !current) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-surface">
        <span className="font-headline text-xl text-primary-fixed-dim animate-pulse">Loading...</span>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex flex-col bg-surface relative overflow-hidden"
      style={{ cursor: showControls ? "default" : "none" }}
    >
      {/* Slide */}
      <div className={`flex-1 flex transition-opacity ${settings.transition === "crossfade" ? "duration-1000" : "duration-0"}`}>
        <SlideView celebrity={current} photoBaseUrl={R2_BASE} showFact={settings.showFacts} />
      </div>

      {/* Overlay controls */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
        {/* Bottom bar */}
        <div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-6 p-6 pointer-events-auto">
          <button onClick={prev} className="text-on-surface-variant hover:text-primary-fixed-dim transition-colors">
            <span className="font-headline text-2xl">&#9664;</span>
          </button>
          <button onClick={togglePause} className="text-on-surface-variant hover:text-primary-fixed-dim transition-colors">
            <span className="font-headline text-2xl">{paused ? "\u25B6" : "\u23F8"}</span>
          </button>
          <button onClick={next} className="text-on-surface-variant hover:text-primary-fixed-dim transition-colors">
            <span className="font-headline text-2xl">&#9654;</span>
          </button>
        </div>

        {/* Top-right gear icon */}
        <button
          onClick={() => setShowSettings(true)}
          className="absolute top-4 right-4 pointer-events-auto text-on-surface-variant/50 hover:text-primary-fixed-dim transition-colors"
        >
          <span className="font-headline text-2xl">&#9881;</span>
        </button>

        {/* Top-left back link */}
        <a
          href="/"
          className="absolute top-4 left-4 pointer-events-auto text-on-surface-variant/50 hover:text-primary-fixed-dim transition-colors font-label text-[10px] uppercase tracking-widest"
        >
          &#8592; Back
        </a>

        {/* Bottom-right ESC hint */}
        <span className="absolute bottom-6 right-6 text-on-surface-variant/30 font-label text-[10px] uppercase tracking-widest pointer-events-none">
          ESC to exit &middot; F fullscreen
        </span>
      </div>

      {/* Settings panel overlay */}
      {showSettings && (
        <SettingsPanel settings={settings} onUpdate={update} onClose={() => setShowSettings(false)} />
      )}
    </main>
  );
}
