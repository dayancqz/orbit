import { NextResponse } from "next/server";
import { sarahLifeGraph } from "@/lib/mockData";
import { detectLifeEvents, buildPreTripBriefing } from "@/lib/agents/pulse";

export async function GET() {
  const events = detectLifeEvents(sarahLifeGraph);
  const briefing = buildPreTripBriefing(sarahLifeGraph);
  return NextResponse.json({ actions: briefing ? [...events, briefing] : events });
}
