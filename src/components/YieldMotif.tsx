// Orbit Yield's visual signature — an ascending trend line with a few
// growth bars behind it. Purely decorative (aria-hidden).
export function YieldMotif({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" className={`pointer-events-none absolute ${className}`} aria-hidden="true">
      <g opacity="0.12">
        <rect x="16" y="78" width="10" height="32" fill="#2dd4bf" />
        <rect x="58" y="56" width="10" height="54" fill="#2dd4bf" />
        <rect x="100" y="36" width="10" height="74" fill="#2dd4bf" />
        <rect x="142" y="16" width="10" height="94" fill="#2dd4bf" />
      </g>
      <polyline
        points="12,96 55,80 97,55 139,32 184,10"
        fill="none"
        stroke="#2dd4bf"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.22"
        className="animate-glow-pulse"
      />
    </svg>
  );
}
