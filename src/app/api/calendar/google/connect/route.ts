import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { requireUser } from "@/lib/auth";
import { buildGoogleAuthUrl, GoogleCalendarNotConfigured } from "@/lib/googleCalendar";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "google_oauth_state";

// A real browser navigation (not a fetch call) — clicking "Connect Google
// Calendar" hits this URL directly and gets redirected on to Google.
export async function GET() {
  const user = await requireUser();

  let authUrl: string;
  try {
    const state = crypto.randomBytes(16).toString("hex");
    cookies().set(STATE_COOKIE, `${user.id}.${state}`, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 10 * 60,
      path: "/",
    });
    authUrl = buildGoogleAuthUrl(state);
  } catch (err) {
    if (err instanceof GoogleCalendarNotConfigured) {
      return NextResponse.json({ error: err.message }, { status: 501 });
    }
    throw err;
  }

  return NextResponse.redirect(authUrl);
}
