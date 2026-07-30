// Orbit Pulse's visual signature — concentric orbit rings with a slowly
// orbiting satellite dot, echoing the splash screen's globe. Purely
// decorative (aria-hidden), always rendered behind real content.
export function PulseMotif({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={`pointer-events-none absolute ${className}`} aria-hidden="true">
      <circle cx="100" cy="100" r="70" stroke="#22d3ee" strokeWidth="1" opacity="0.16" fill="none" />
      <ellipse
        cx="100"
        cy="100"
        rx="92"
        ry="42"
        stroke="#22d3ee"
        strokeWidth="1"
        opacity="0.14"
        fill="none"
        className="origin-center animate-ring-pulse"
      />
      <ellipse
        cx="100"
        cy="100"
        rx="92"
        ry="42"
        stroke="#22d3ee"
        strokeWidth="1"
        opacity="0.12"
        fill="none"
        transform="rotate(60 100 100)"
        className="origin-center animate-ring-pulse-2"
      />
      <circle cx="170" cy="100" r="3" fill="#22d3ee" opacity="0.6">
        <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="12s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
