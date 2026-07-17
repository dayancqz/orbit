import { NextResponse } from "next/server";
import { getDemoUser, syncAgentActions } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getDemoUser();
  const actions = await syncAgentActions(user.id);
  return NextResponse.json({ actions: actions.filter((a) => a.agent === "shield") });
}
