import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isAccentKey, isThemeMode, parseAppearance, serializeAppearance } from "@/lib/theme";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "orbit_appearance";

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const current = parseAppearance(cookies().get(COOKIE_NAME)?.value);
  const next = {
    themeMode: typeof body.themeMode === "string" && isThemeMode(body.themeMode) ? body.themeMode : current.themeMode,
    accentColor: typeof body.accentColor === "string" && isAccentKey(body.accentColor) ? body.accentColor : current.accentColor,
  };

  cookies().set(COOKIE_NAME, serializeAppearance(next.themeMode, next.accentColor), {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    httpOnly: false,
  });

  return NextResponse.json({ ok: true, ...next });
}
