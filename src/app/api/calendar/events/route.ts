import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createManualCalendarEvent } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { title, startsAt, endsAt, location } = body ?? {};

  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Enter a title" }, { status: 400 });
  }
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: "Enter valid dates" }, { status: 400 });
  }
  if (end < start) {
    return NextResponse.json({ error: "End must be after start" }, { status: 400 });
  }

  const event = await createManualCalendarEvent(user.id, {
    title: title.trim(),
    startsAt: start,
    endsAt: end,
    location: typeof location === "string" && location.trim() ? location.trim() : undefined,
  });

  return NextResponse.json({ event });
}
