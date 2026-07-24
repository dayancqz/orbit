import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";
import { exchangeCodeForTokens, fetchGoogleEmail } from "@/lib/googleCalendar";
import { upsertCalendarConnection, syncGoogleCalendarEvents } from "@/lib/db";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "google_oauth_state";

export async function GET(request: Request) {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);

  const error = searchParams.get("error");
  if (error) {
    return NextResponse.redirect(new URL(`/settings?calendar=error&reason=${error}`, request.url));
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expectedState = cookies().get(STATE_COOKIE)?.value;
  cookies().set(STATE_COOKIE, "", { path: "/", maxAge: 0 });

  if (!code || !state || !expectedState || expectedState !== `${user.id}.${state}`) {
    return NextResponse.redirect(new URL("/settings?calendar=error&reason=state_mismatch", request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const email = await fetchGoogleEmail(tokens.accessToken);
    await upsertCalendarConnection(user.id, tokens, email);
    await syncGoogleCalendarEvents(user.id, true);
  } catch {
    return NextResponse.redirect(new URL("/settings?calendar=error&reason=exchange_failed", request.url));
  }

  return NextResponse.redirect(new URL("/settings?calendar=connected", request.url));
}
