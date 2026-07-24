"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ACCENT_PRESETS, ACCENT_KEYS, applyThemeVars, type AccentKey, type ThemeMode } from "@/lib/theme";

export function AppearancePicker({
  initialThemeMode,
  initialAccentColor,
}: {
  initialThemeMode: ThemeMode;
  initialAccentColor: AccentKey;
}) {
  const router = useRouter();
  const [themeMode, setThemeMode] = useState(initialThemeMode);
  const [accentColor, setAccentColor] = useState(initialAccentColor);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    applyThemeVars(themeMode, accentColor);
  }, [themeMode, accentColor]);

  async function save(next: { themeMode?: ThemeMode; accentColor?: AccentKey }) {
    try {
      const response = await fetch("/api/appearance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });

      if (response.ok) {
        startTransition(() => router.refresh());
      }
    } catch {
      // ignore and keep the local UI change
    }
  }

  function selectTheme(mode: ThemeMode) {
    setThemeMode(mode);
    void save({ themeMode: mode });
  }

  function selectAccent(accent: AccentKey) {
    setAccentColor(accent);
    void save({ accentColor: accent });
  }

  return (
    <div className={`rounded-2xl border border-orbit-border bg-orbit-card p-4 ${isPending ? "opacity-70" : ""}`}>
      <p className="mb-3 text-[11px] font-semibold text-orbit-muted">APPEARANCE</p>

      <p className="mb-2 text-sm text-orbit-text">Theme</p>
      <div className="mb-4 flex gap-1.5">
        {(["dark", "light"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => selectTheme(mode)}
            className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium capitalize ${
              themeMode === mode
                ? "border border-orbit-accent bg-orbit-accent/15 text-orbit-accent"
                : "border border-orbit-border text-orbit-muted"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      <p className="mb-2 text-sm text-orbit-text">Accent color</p>
      <div className="grid grid-cols-5 gap-3">
        {ACCENT_KEYS.map((key) => {
          const preset = ACCENT_PRESETS[key];
          const selected = accentColor === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => selectAccent(key)}
              aria-label={preset.label}
              title={preset.label}
              className="flex flex-col items-center gap-1"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                  selected ? "border-orbit-accent" : "border-transparent"
                }`}
                style={{ backgroundColor: preset.hex }}
              >
                {selected && (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke={preset.contrast} strokeWidth={3}>
                    <path d="M5 12l4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
