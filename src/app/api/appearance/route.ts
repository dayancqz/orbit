import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { isAccentKey, isThemeMode } from "@/lib/theme";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const data: { themeMode?: string; accentColor?: string } = {};

  if (typeof body.themeMode === "string" && isThemeMode(body.themeMode)) {
    data.themeMode = body.themeMode;
  }
  if (typeof body.accentColor === "string" && isAccentKey(body.accentColor)) {
    data.accentColor = body.accentColor;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing valid to update" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ ok: true });
}
