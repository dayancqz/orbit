// The animated wireframe globe from the splash screen. Pure CSS/SVG
// animation, no interactivity — safe as a server component.
const PARTICLES = [
  { left: "18%", top: "28%", delay: "0s" },
  { left: "78%", top: "22%", delay: "0.7s" },
  { left: "12%", top: "52%", delay: "1.4s" },
  { left: "82%", top: "58%", delay: "0.4s" },
  { left: "50%", top: "18%", delay: "1.1s" },
  { left: "34%", top: "70%", delay: "1.8s" },
  { left: "68%", top: "72%", delay: "0.9s" },
];

export function GlobeAnimation() {
  return (
    <div className="relative flex flex-1 items-center justify-center">
      <div className="absolute h-[300px] w-[300px] animate-glow-pulse rounded-full bg-[radial-gradient(circle,rgba(0,194,199,0.18)_0%,transparent_70%)]" />
      <div className="absolute inset-0">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="absolute h-[3px] w-[3px] animate-float-particle rounded-full bg-orbit-pulse"
            style={{ left: p.left, top: p.top, animationDelay: p.delay }}
          />
        ))}
      </div>
      <div className="relative h-[260px] w-[260px]">
        <svg viewBox="0 0 260 260" fill="none" className="h-full w-full">
          <ellipse cx="130" cy="130" rx="124" ry="36" stroke="#00C2C7" strokeWidth="1" opacity="0.1" className="origin-center animate-ring-pulse" />
          <ellipse cx="130" cy="130" rx="100" ry="28" stroke="#00C2C7" strokeWidth="1" opacity="0.1" transform="rotate(40,130,130)" className="origin-center animate-ring-pulse-2" />
          <ellipse cx="130" cy="130" rx="110" ry="32" stroke="#00C896" strokeWidth="1" opacity="0.1" transform="rotate(-30,130,130)" className="origin-center animate-ring-pulse-3" />
          <circle cx="130" cy="130" r="88" fill="rgba(0,194,199,0.06)" stroke="#00C2C7" strokeWidth="1.5" opacity="0.6" />
          <ellipse cx="130" cy="130" rx="88" ry="22" stroke="#00C2C7" strokeWidth="0.8" opacity="0.25" />
          <ellipse cx="130" cy="130" rx="88" ry="44" stroke="#00C2C7" strokeWidth="0.8" opacity="0.2" />
          <ellipse cx="130" cy="130" rx="88" ry="66" stroke="#00C2C7" strokeWidth="0.8" opacity="0.15" />
          <g className="origin-center animate-globe-spin">
            <ellipse cx="130" cy="130" rx="30" ry="88" stroke="#00C2C7" strokeWidth="0.9" opacity="0.3" />
            <ellipse cx="130" cy="130" rx="60" ry="88" stroke="#00C2C7" strokeWidth="0.9" opacity="0.2" />
          </g>
          <g className="origin-center animate-globe-spin-reverse">
            <ellipse cx="130" cy="130" rx="45" ry="88" stroke="#00C896" strokeWidth="0.8" opacity="0.2" transform="rotate(60,130,130)" />
          </g>
          <line x1="130" y1="42" x2="130" y2="218" stroke="#00C2C7" strokeWidth="0.8" opacity="0.2" />
          <line x1="42" y1="130" x2="218" y2="130" stroke="#00C2C7" strokeWidth="0.8" opacity="0.2" />
          <circle cx="105" cy="105" r="22" fill="rgba(255,255,255,0.04)" />
          <circle cx="218" cy="130" r="5" fill="#00C2C7" opacity="0.9">
            <animateTransform attributeName="transform" type="rotate" from="0 130 130" to="360 130 130" dur="6s" repeatCount="indefinite" />
          </circle>
          <circle cx="42" cy="130" r="3.5" fill="#00C896" opacity="0.7">
            <animateTransform attributeName="transform" type="rotate" from="0 130 130" to="-360 130 130" dur="9s" repeatCount="indefinite" />
          </circle>
          <circle cx="130" cy="130" r="10" fill="rgba(0,194,199,0.3)" />
          <circle cx="130" cy="130" r="5" fill="#00C2C7" opacity="0.8" />
        </svg>
      </div>
    </div>
  );
}
