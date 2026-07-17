import type { AgentAction } from "@/lib/types";

export function Timeline({ actions }: { actions: AgentAction[] }) {
  const sorted = [...actions].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <ol className="space-y-4 border-l border-slate-700 pl-6">
      {sorted.map((action) => (
        <li key={action.id} className="relative">
          <span className="absolute -left-[29px] top-1 h-3 w-3 rounded-full bg-cyan-400" />
          <p className="text-xs uppercase tracking-wide text-slate-500">{action.agent}</p>
          <p className="text-sm text-slate-200">{action.description}</p>
        </li>
      ))}
    </ol>
  );
}
