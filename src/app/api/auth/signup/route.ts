import { NextResponse } from "next/server";
import { signUp, AuthError } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { name, email, password } = body ?? {};

  if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Missing name, email, or password" }, { status: 400 });
  }

  try {
    const user = await signUp(name, email, password);
    setSessionCookie(user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
