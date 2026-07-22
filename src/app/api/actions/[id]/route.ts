import { NextResponse } from "next/server";
import { setActionStatus } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await request.json();
  const status = body?.status;

  if (status !== "approved" && status !== "dismissed") {
    return NextResponse.json({ error: "status must be 'approved' or 'dismissed'" }, { status: 400 });
  }

  try {
    const action = await setActionStatus(user.id, params.id, status);
    return NextResponse.json({ action });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't update that action";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
