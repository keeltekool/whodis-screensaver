"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Celebrity } from "@/lib/types";
import { ScreensaverSettings } from "@/lib/settings";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useSlideshow(celebrities: Celebrity[], settings: ScreensaverSettings, photoBaseUrl: string) {
  const [playlist, setPlaylist] = useState<Celebrity[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build filtered + ordered playlist when celebrities or settings change
  useEffect(() => {
    let filtered = celebrities.filter(
      (c) => settings.categories.includes(c.category) && settings.eras.includes(c.era)
    );
    if (filtered.length === 0) filtered = celebrities;
    const ordered = settings.shuffle ? shuffleArray(filtered) : filtered;
    setPlaylist(ordered);
    setCurrentIndex(0);
  }, [celebrities, settings.categories, settings.eras, settings.shuffle]);

  // Preload next image
  useEffect(() => {
    if (playlist.length < 2) return;
    const nextIndex = (currentIndex + 1) % playlist.length;
    const img = new Image();
    img.src = `${photoBaseUrl}/photos/${playlist[nextIndex].photo_key}`;
  }, [currentIndex, playlist, photoBaseUrl]);

  // Auto-advance timer
  useEffect(() => {
    if (paused || playlist.length === 0) return;
    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= playlist.length) {
          if (settings.shuffle) {
            setPlaylist((p) => shuffleArray(p));
          }
          return 0;
        }
        return next;
      });
    }, settings.duration * 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, paused, playlist.length, settings.duration, settings.shuffle]);

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % playlist.length);
  }, [playlist.length]);

  const prev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
  }, [playlist.length]);

  const togglePause = useCallback(() => setPaused((p) => !p), []);

  return {
    current: playlist[currentIndex] ?? null,
    currentIndex,
    total: playlist.length,
    paused,
    next,
    prev,
    togglePause,
  };
}
