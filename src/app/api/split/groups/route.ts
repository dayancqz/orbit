import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSplitGroup, getGroupsForUser, SUPPORTED_TRIP_CURRENCIES } from "@/lib/split";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const groups = await getGroupsForUser(user.id);
  return NextResponse.json({ groups });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await request.json();
  const { name, members, currency } = body ?? {};

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Enter a group name" }, { status: 400 });
  }
  if (!Array.isArray(members)) {
    return NextResponse.json({ error: "members must be an array" }, { status: 400 });
  }
  for (const m of members) {
    if (typeof m?.name !== "string" || !m.name.trim()) {
      return NextResponse.json({ error: "Every member needs a name" }, { status: 400 });
    }
    if (m.userId !== undefined && typeof m.userId !== "string") {
      return NextResponse.json({ error: "Invalid member userId" }, { status: 400 });
    }
  }
  if (currency !== undefined && (typeof currency !== "string" || !SUPPORTED_TRIP_CURRENCIES.includes(currency as never))) {
    return NextResponse.json({ error: "Unsupported currency" }, { status: 400 });
  }

  try {
    const group = await createSplitGroup(user.id, name, members, currency);
    return NextResponse.json({ group });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't create group";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
