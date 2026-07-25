import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const endpoint = body?.endpoint;

  if (typeof endpoint === "string") {
    await prisma.pushSubscription.deleteMany({ where: { userId: user.id, endpoint } });
  } else {
    // No specific endpoint given — treat as "turn off notifications on this account".
    await prisma.pushSubscription.deleteMany({ where: { userId: user.id } });
  }

  return NextResponse.json({ ok: true });
}
