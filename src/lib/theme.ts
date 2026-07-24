// The user-customizable side of the app's look: an accent color picked from
// a fixed set of presets, and a light/dark surface palette. This is
// deliberately separate from the Pulse/Yield/Shield agent colors (teal/
// green/red in tailwind.config.ts), which stay fixed brand identifiers
// regardless of what a user picks here — otherwise choosing e.g. a green
// accent would make Shield's "danger" red chips indistinguishable from
// Yield's brand color.

export const ACCENT_PRESETS = {
  red: { label: "Red", hex: "#FF3B30", contrast: "#FFFFFF" },
  orange: { label: "Orange", hex: "#F97316", contrast: "#0A0A0A" },
  yellow: { label: "Yellow", hex: "#EAB308", contrast: "#0A0A0A" },
  green: { label: "Green", hex: "#22C55E", contrast: "#0A0A0A" },
  teal: { label: "Teal", hex: "#14B8A6", contrast: "#0A0A0A" },
  blue: { label: "Blue", hex: "#3B82F6", contrast: "#FFFFFF" },
  purple: { label: "Purple", hex: "#A855F7", contrast: "#FFFFFF" },
  pink: { label: "Pink", hex: "#EC4899", contrast: "#FFFFFF" },
  black: { label: "Black", hex: "#0A0A0A", contrast: "#FFFFFF" },
  white: { label: "White", hex: "#FFFFFF", contrast: "#0A0A0A" },
} as const;

export type AccentKey = keyof typeof ACCENT_PRESETS;
export const DEFAULT_ACCENT: AccentKey = "red";
export const ACCENT_KEYS = Object.keys(ACCENT_PRESETS) as AccentKey[];

export function isAccentKey(value: string): value is AccentKey {
  return value in ACCENT_PRESETS;
}

export const THEME_PALETTE = {
  dark: {
    bg: "#060606",
    surface: "#0d0d0d",
    card: "#161616",
    card2: "#1f1f1f",
    border: "#2c2c2c",
    muted: "#9a9a9a",
    text: "#ffffff",
  },
  light: {
    bg: "#f5f5f7",
    surface: "#ffffff",
    card: "#ffffff",
    card2: "#f0f0f2",
    border: "#e2e2e6",
    muted: "#68686f",
    text: "#0a0a0a",
  },
} as const;

export type ThemeMode = keyof typeof THEME_PALETTE;
export const DEFAULT_THEME: ThemeMode = "dark";

export function isThemeMode(value: string): value is ThemeMode {
  return value === "dark" || value === "light";
}

function hexToRgbChannels(hex: string): string {
  const clean = hex.replace("#", "");
  const int = parseInt(clean, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `${r} ${g} ${b}`;
}

// The full set of CSS custom properties for a given theme/accent
// combination — injected inline by the root layout so every page (and
// every visitor, logged in or not) renders with the right look server-side,
// no flash of the wrong theme on load.
export function buildThemeVars(mode: ThemeMode, accent: AccentKey): Record<string, string> {
  const palette = THEME_PALETTE[mode];
  const accentDef = ACCENT_PRESETS[accent];

  return {
    "--orbit-bg": palette.bg,
    "--orbit-surface": palette.surface,
    "--orbit-card": palette.card,
    "--orbit-card2": palette.card2,
    "--orbit-border": palette.border,
    "--orbit-muted": palette.muted,
    "--orbit-text": palette.text,
    "--orbit-accent-rgb": hexToRgbChannels(accentDef.hex),
    "--orbit-accent-contrast": accentDef.contrast,
  };
}
