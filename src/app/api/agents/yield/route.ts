import { NextResponse } from "next/server";
import { sarahLifeGraph } from "@/lib/mockData";
import { findIdleMoney } from "@/lib/agents/yieldAgent";

export async function GET() {
  const actions = findIdleMoney(sarahLifeGraph);
  return NextResponse.json({ actions });
}
