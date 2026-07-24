import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { syncGoogleCalendarEvents } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  try {
    const count = await syncGoogleCalendarEvents(user.id, true);
    return NextResponse.json({ ok: true, tripsFound: count });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
