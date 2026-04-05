"use client";

import { ScreensaverSettings, TransitionStyle } from "@/lib/settings";

interface SettingsPanelProps {
  settings: ScreensaverSettings;
  onUpdate: (patch: Partial<ScreensaverSettings>) => void;
  onClose: () => void;
}

const ALL_CATEGORIES = ["FILM", "MUSIC", "ATHLETE"];
const ALL_ERAS = ["60s", "70s", "80s", "90s", "00s"];
const TRANSITIONS: { value: TransitionStyle; label: string }[] = [
  { value: "crossfade", label: "Crossfade" },
  { value: "kenburns", label: "Ken Burns" },
  { value: "cut", label: "Hard Cut" },
];

export default function SettingsPanel({ settings, onUpdate, onClose }: SettingsPanelProps) {
  function toggleInArray(arr: string[], value: string): string[] {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
  }

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-surface-container w-full max-w-md p-6 space-y-6 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-bold text-xl text-on-surface">Settings</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-primary-fixed-dim transition-colors font-headline text-2xl">
            &times;
          </button>
        </div>

        {/* Duration slider */}
        <div>
          <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2">
            Slide Duration: {settings.duration}s
          </label>
          <input
            type="range"
            min={5}
            max={30}
            value={settings.duration}
            onChange={(e) => onUpdate({ duration: Number(e.target.value) })}
            className="w-full accent-primary-fixed-dim"
          />
        </div>

        {/* Transition style */}
        <div>
          <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2">
            Transition
          </label>
          <div className="flex gap-2">
            {TRANSITIONS.map((t) => (
              <button
                key={t.value}
                onClick={() => onUpdate({ transition: t.value })}
                className={`flex-1 py-2 font-label text-xs uppercase tracking-wider transition-colors ${
                  settings.transition === t.value
                    ? "bg-primary-container text-on-primary"
                    : "bg-surface-container-low text-on-surface-variant"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2">
            Categories
          </label>
          <div className="flex gap-2">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => onUpdate({ categories: toggleInArray(settings.categories, cat) })}
                className={`flex-1 py-2 font-label text-xs uppercase tracking-wider transition-colors ${
                  settings.categories.includes(cat)
                    ? "bg-secondary-container text-on-secondary-container"
                    : "bg-surface-container-low text-on-surface-variant/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Eras */}
        <div>
          <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2">
            Eras
          </label>
          <div className="flex gap-2 flex-wrap">
            {ALL_ERAS.map((era) => (
              <button
                key={era}
                onClick={() => onUpdate({ eras: toggleInArray(settings.eras, era) })}
                className={`px-4 py-2 font-label text-xs uppercase tracking-wider transition-colors ${
                  settings.eras.includes(era)
                    ? "bg-secondary-container text-on-secondary-container"
                    : "bg-surface-container-low text-on-surface-variant/50"
                }`}
              >
                {era}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-label text-xs uppercase tracking-wider text-on-surface-variant">Shuffle</span>
            <input
              type="checkbox"
              checked={settings.shuffle}
              onChange={() => onUpdate({ shuffle: !settings.shuffle })}
              className="accent-primary-fixed-dim w-5 h-5"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-label text-xs uppercase tracking-wider text-on-surface-variant">Show Facts</span>
            <input
              type="checkbox"
              checked={settings.showFacts}
              onChange={() => onUpdate({ showFacts: !settings.showFacts })}
              className="accent-primary-fixed-dim w-5 h-5"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
