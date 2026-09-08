import { NextResponse } from "next/server";
import { clearAllNotifications } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const result = await clearAllNotifications(user.id);
  return NextResponse.json(result);
}
