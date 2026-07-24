// Thin, dependency-free client for the pieces of Google's OAuth2 + Calendar
// APIs Orbit Pulse needs: enough to connect an account, keep the access
// token fresh, and pull upcoming events. Deliberately plain fetch() calls
// rather than the full googleapis SDK — it's a handful of REST calls, not
// worth a heavy dependency for.

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

// Read-only: Orbit only ever needs to see events, never create or modify
// them in the user's real calendar.
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

export class GoogleCalendarNotConfigured extends Error {
  constructor() {
    super(
      "Google Calendar isn't configured yet — set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in .env"
    );
  }
}

function getCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) throw new GoogleCalendarNotConfigured();
  return { clientId, clientSecret, redirectUri };
}

export function isGoogleCalendarConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI
  );
}

export function buildGoogleAuthUrl(state: string): string {
  const { clientId, redirectUri } = getCredentials();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline", // request a refresh token
    prompt: "consent", // ensure a refresh token is issued even on repeat connects
    state,
  });

  return `${AUTH_URL}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const { clientId, clientSecret, redirectUri } = getCredentials();

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as TokenResponse;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  const { clientId, clientSecret } = getCredentials();

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error(`Google token refresh failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as TokenResponse;
  return {
    accessToken: data.access_token,
    // Google doesn't re-issue a refresh token on refresh — keep the old one.
    refreshToken,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

export async function fetchGoogleEmail(accessToken: string): Promise<string | null> {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { email?: string };
  return data.email ?? null;
}

export interface GoogleCalendarEvent {
  id: string;
  title: string;
  location?: string;
  startsAt: string;
  endsAt: string;
}

// Upcoming events over the next ~90 days — far enough out to catch trips
// being planned, without pulling a user's entire calendar history.
export async function fetchUpcomingEvents(accessToken: string): Promise<GoogleCalendarEvent[]> {
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 90 * 86_400_000).toISOString();

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });

  const res = await fetch(`${EVENTS_URL}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Google Calendar events fetch failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as {
    items?: Array<{
      id: string;
      summary?: string;
      location?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
    }>;
  };

  return (data.items ?? [])
    .filter((item) => item.start?.dateTime || item.start?.date)
    .map((item) => ({
      id: item.id,
      title: item.summary ?? "(untitled event)",
      location: item.location,
      startsAt: (item.start!.dateTime ?? item.start!.date) as string,
      endsAt: (item.end?.dateTime ?? item.end?.date ?? item.start!.dateTime ?? item.start!.date) as string,
    }));
}
