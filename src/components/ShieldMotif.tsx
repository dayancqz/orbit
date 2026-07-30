// Orbit Shield's visual signature — a tiled hex lattice, like plate armor.
// Purely decorative (aria-hidden). The pattern id is fixed rather than
// generated per-instance (this stays a plain server-renderable component,
// no useId/hooks) — safe here since every instance defines the exact same
// pattern content, so a duplicate id just resolves to an identical result.
export function ShieldMotif({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" className={`pointer-events-none absolute ${className}`} aria-hidden="true">
      <defs>
        <pattern id="orbit-shield-hex" width="28" height="24.25" patternUnits="userSpaceOnUse">
          <polygon
            points="14,0 28,7 28,17.25 14,24.25 0,17.25 0,7"
            fill="none"
            stroke="#ef4444"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="200" height="160" fill="url(#orbit-shield-hex)" opacity="0.14" />
    </svg>
  );
}
