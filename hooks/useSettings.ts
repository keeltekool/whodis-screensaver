"use client";

import { useState, useCallback } from "react";
import { ScreensaverSettings, loadSettings, saveSettings } from "@/lib/settings";

export function useSettings() {
  const [settings, setSettings] = useState<ScreensaverSettings>(loadSettings);

  const update = useCallback((patch: Partial<ScreensaverSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  return { settings, update };
}
