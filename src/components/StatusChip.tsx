const TONES = {
  teal: "bg-orbit-pulse/15 text-orbit-pulse",
  green: "bg-orbit-yield/15 text-orbit-yield",
  red: "bg-orbit-shield/15 text-orbit-shield",
  amber: "bg-amber-500/15 text-amber-500",
  muted: "bg-orbit-border/40 text-orbit-muted",
} as const;

export function StatusChip({
  tone,
  children,
}: {
  tone: keyof typeof TONES;
  children: React.ReactNode;
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${TONES[tone]}`}>
      {children}
    </span>
  );
}
