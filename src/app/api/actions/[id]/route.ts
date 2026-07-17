import { NextResponse } from "next/server";
import { setActionStatus } from "@/lib/db";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const status = body?.status;

  if (status !== "approved" && status !== "dismissed") {
    return NextResponse.json({ error: "status must be 'approved' or 'dismissed'" }, { status: 400 });
  }

  const action = await setActionStatus(params.id, status);
  return NextResponse.json({ action });
}
