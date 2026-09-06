import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { regenerateGroupInvite } from "@/lib/split";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: { groupId: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  try {
    const invite = await regenerateGroupInvite(user.id, params.groupId);
    return NextResponse.json({ invite });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't regenerate invite";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
