import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAgentActionsPage } from "@/lib/db";

export const dynamic = "force-dynamic";

// Paginated read for the Notifications screen's "load more" — see
// getAgentActionsPage in src/lib/db.ts for why this doesn't re-run the
// agents on every page.
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(Math.trunc(Number(limitParam)) || 20, 1), 50) : 20;

  const page = await getAgentActionsPage(user.id, { cursor, limit });
  return NextResponse.json(page);
}
