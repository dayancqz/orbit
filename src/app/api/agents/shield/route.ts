import { NextResponse } from "next/server";
import { sarahLifeGraph } from "@/lib/mockData";
import { flagUnusedSubscriptions, activateTripMode } from "@/lib/agents/shield";

export async function GET() {
  const flagged = flagUnusedSubscriptions(sarahLifeGraph);
  const tripMode = activateTripMode(sarahLifeGraph, "Flight to Seoul");
  return NextResponse.json({ actions: [...flagged, tripMode] });
}
