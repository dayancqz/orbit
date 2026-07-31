import type { PersistedAgentAction } from "@/lib/types";
import { formatRelativeTime, isRecent } from "@/lib/format";

const DOT_COLOR: Record<PersistedAgentAction["agent"], string> = {
  pulse: "bg-orbit-pulse",
  yield: "bg-orbit-yield",
  shield: "bg-orbit-shield",
};

export function Timeline({ actions }: { actions: PersistedAgentAction[] }) {
  if (actions.length === 0) {
    return <p className="text-sm text-orbit-muted">No activity yet.</p>;
  }

  return (
    <ul className="flex flex-col">
      {actions.map((action, index) => {
        const recent = isRecent(action.timestamp);
        return (
          <li
            key={action.id}
            style={{ animationDelay: `${index * 60}ms` }}
            className="flex animate-cascade-in items-center gap-2.5 border-b border-orbit-border py-3 last:border-none"
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${DOT_COLOR[action.agent]} ${recent ? "animate-pulse" : ""}`}
            />
            <span className="flex-1 truncate text-[13px] text-orbit-text">{action.description}</span>
            <span className="shrink-0 text-[11px] text-orbit-muted">{formatRelativeTime(action.timestamp)}</span>
          </li>
        );
      })}
    </ul>
  );
}
