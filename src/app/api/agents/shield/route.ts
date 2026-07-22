import { NextResponse } from "next/server";
import { syncAgentActions } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const actions = await syncAgentActions(user.id);
  return NextResponse.json({ actions: actions.filter((a) => a.agent === "shield") });
}
