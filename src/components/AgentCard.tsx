import type { AgentAction, AgentName } from "@/lib/types";

const AGENT_META: Record<AgentName, { label: string; color: string }> = {
  pulse: { label: "Orbit Pulse", color: "border-cyan-400 text-cyan-400" },
  yield: { label: "Orbit Yield", color: "border-emerald-400 text-emerald-400" },
  shield: { label: "Orbit Shield", color: "border-red-400 text-red-400" },
};

export function AgentCard({
  agent,
  actions,
}: {
  agent: AgentName;
  actions: AgentAction[];
}) {
  const meta = AGENT_META[agent];

  return (
    <div className={`rounded-xl border ${meta.color} bg-slate-900/60 p-5`}>
      <h3 className={`text-sm font-semibold ${meta.color}`}>{meta.label}</h3>
      <ul className="mt-3 space-y-3">
        {actions.length === 0 && (
          <li className="text-sm text-slate-400">No actions right now.</li>
        )}
        {actions.map((action) => (
          <li key={action.id} className="text-sm text-slate-200">
            <p>{action.description}</p>
            {action.requiresApproval && (
              <span className="mt-1 inline-block rounded-full border border-slate-600 px-2 py-0.5 text-xs text-slate-400">
                needs your approval
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
