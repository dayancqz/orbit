import Link from "next/link";
import type { AgentName } from "@/lib/types";

const AGENT_LABEL: Record<AgentName, { text: string; className: string }> = {
  pulse: { text: "ORBIT PULSE", className: "text-orbit-pulse" },
  yield: { text: "ORBIT YIELD", className: "text-orbit-yield" },
  shield: { text: "ORBIT SHIELD", className: "text-orbit-shield" },
};

export function PageHeader({
  title,
  backHref,
  agent,
}: {
  title: string;
  backHref: string;
  agent?: AgentName;
}) {
  const agentMeta = agent ? AGENT_LABEL[agent] : null;

  return (
    <header className="relative flex h-14 shrink-0 items-center bg-orbit-surface px-5">
      <Link href={backHref} className="mr-2 text-[22px] text-white" aria-label="Back">
        ‹
      </Link>
      <span className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-white">
        {title}
      </span>
      {agentMeta && (
        <span className={`ml-auto text-xs font-medium ${agentMeta.className}`}>
          {agentMeta.text}
        </span>
      )}
    </header>
  );
}
