import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { findUserByEmail } from "@/lib/split";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const email = new URL(request.url).searchParams.get("email") ?? "";
  if (!email.trim()) return NextResponse.json({ error: "email is required" }, { status: 400 });

  const found = await findUserByEmail(email);
  if (!found) return NextResponse.json({ error: "No Orbit user with that email" }, { status: 404 });

  return NextResponse.json({ user: found });
}
