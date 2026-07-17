import { sarahLifeGraph } from "@/lib/mockData";
import { detectLifeEvents, buildPreTripBriefing } from "@/lib/agents/pulse";
import { findIdleMoney } from "@/lib/agents/yieldAgent";
import { flagUnusedSubscriptions, activateTripMode } from "@/lib/agents/shield";
import { AgentCard } from "@/components/AgentCard";
import { Timeline } from "@/components/Timeline";

export default function DashboardPage() {
  // For the MVP this runs the agent logic directly at render time against
  // mock data. Once the backend track wires up src/lib/db.ts, swap these
  // calls for fetches to /api/agents/* (already stubbed) or server actions.
  const pulseActions = detectLifeEvents(sarahLifeGraph);
  const briefing = buildPreTripBriefing(sarahLifeGraph);
  const yieldActions = findIdleMoney(sarahLifeGraph);
  const shieldActions = [
    ...flagUnusedSubscriptions(sarahLifeGraph),
    activateTripMode(sarahLifeGraph, "Flight to Seoul"),
  ];

  const allActions = [
    ...pulseActions,
    ...(briefing ? [briefing] : []),
    ...yieldActions,
    ...shieldActions,
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-white">ORBIT</h1>
        <p className="mt-1 text-slate-400 italic">Your money. Always working.</p>
      </header>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Sarah&apos;s Korea Trip — live demo
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <AgentCard agent="pulse" actions={[...pulseActions, ...(briefing ? [briefing] : [])]} />
          <AgentCard agent="yield" actions={yieldActions} />
          <AgentCard agent="shield" actions={shieldActions} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Timeline</h2>
        <Timeline actions={allActions} />
      </section>
    </main>
  );
}
