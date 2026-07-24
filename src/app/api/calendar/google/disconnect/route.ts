import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { disconnectGoogleCalendar } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  await disconnectGoogleCalendar(user.id);
  return NextResponse.json({ ok: true });
}
