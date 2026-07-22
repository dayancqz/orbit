import { NextResponse } from "next/server";
import { recordPayment } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await request.json();
  const { accountId, merchant, amount } = body ?? {};

  if (typeof accountId !== "string" || !accountId) {
    return NextResponse.json({ error: "accountId is required" }, { status: 400 });
  }
  if (typeof merchant !== "string" || !merchant.trim()) {
    return NextResponse.json({ error: "Enter who you're paying" }, { status: 400 });
  }
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter a valid amount" }, { status: 400 });
  }

  try {
    const transaction = await recordPayment(user.id, accountId, merchant.trim(), amount);
    return NextResponse.json({ transaction });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
