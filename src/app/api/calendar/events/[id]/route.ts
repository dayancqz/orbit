import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { deleteCalendarEvent } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  await deleteCalendarEvent(user.id, params.id);
  return NextResponse.json({ ok: true });
}
