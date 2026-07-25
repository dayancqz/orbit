import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createAccount } from "@/lib/db";

export const dynamic = "force-dynamic";

const ACCOUNT_TYPES = ["savings", "current", "fixed_deposit"];

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { name, type, balance, interestRate } = body ?? {};

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Enter an account name" }, { status: 400 });
  }
  if (typeof type !== "string" || !ACCOUNT_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid account type" }, { status: 400 });
  }
  if (typeof balance !== "number" || !Number.isFinite(balance) || balance < 0) {
    return NextResponse.json({ error: "Enter a valid starting balance" }, { status: 400 });
  }
  if (typeof interestRate !== "number" || !Number.isFinite(interestRate) || interestRate < 0) {
    return NextResponse.json({ error: "Enter a valid interest rate" }, { status: 400 });
  }

  const account = await createAccount(user.id, { name: name.trim(), type, balance, interestRate: interestRate / 100 });
  return NextResponse.json({ account });
}
