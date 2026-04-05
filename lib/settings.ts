export type TransitionStyle = "crossfade" | "kenburns" | "cut";

export type ScreensaverSettings = {
  duration: number;
  transition: TransitionStyle;
  categories: string[];
  eras: string[];
  shuffle: boolean;
  showFacts: boolean;
};

export const DEFAULT_SETTINGS: ScreensaverSettings = {
  duration: 10,
  transition: "crossfade",
  categories: ["FILM", "MUSIC", "ATHLETE"],
  eras: ["60s", "70s", "80s", "90s", "00s"],
  shuffle: true,
  showFacts: true,
};

const STORAGE_KEY = "whodis-screensaver-settings";

export function loadSettings(): ScreensaverSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: ScreensaverSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
