// Signed session cookie — no external session/auth library. The cookie
// holds the userId plus an HMAC signature, so it can't be forged without
// SESSION_SECRET, but nothing is encrypted (there's no secret data in it).

import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "orbit_session";
const SECRET = process.env.SESSION_SECRET;

if (!SECRET) {
  throw new Error("SESSION_SECRET is not set — add it to .env (see .env.example)");
}

function sign(userId: string): string {
  return crypto.createHmac("sha256", SECRET as string).update(userId).digest("hex");
}

function verify(userId: string, signature: string): boolean {
  const expected = sign(userId);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function setSessionCookie(userId: string) {
  const token = `${userId}.${sign(userId)}`;
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export function clearSessionCookie() {
  cookies().set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

export function getSessionUserId(): string | null {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return null;

  const userId = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);
  return verify(userId, signature) ? userId : null;
}
