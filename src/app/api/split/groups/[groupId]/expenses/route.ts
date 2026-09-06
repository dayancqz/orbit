import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { addSplitExpense } from "@/lib/split";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { groupId: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await request.json();
  const { description, amount, paidById, splitType, shares } = body ?? {};

  if (typeof description !== "string" || !description.trim()) {
    return NextResponse.json({ error: "Enter a description" }, { status: 400 });
  }
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter a valid amount" }, { status: 400 });
  }
  if (typeof paidById !== "string" || !paidById) {
    return NextResponse.json({ error: "paidById is required" }, { status: 400 });
  }
  if (splitType !== "equal" && splitType !== "exact" && splitType !== "percentage") {
    return NextResponse.json({ error: "Invalid splitType" }, { status: 400 });
  }
  if (!Array.isArray(shares) || shares.length === 0) {
    return NextResponse.json({ error: "shares must be a non-empty array" }, { status: 400 });
  }
  for (const s of shares) {
    if (typeof s?.memberId !== "string" || typeof s?.amount !== "number") {
      return NextResponse.json({ error: "Invalid share entry" }, { status: 400 });
    }
  }

  try {
    const expense = await addSplitExpense(user.id, params.groupId, {
      description: description.trim(),
      amount,
      paidById,
      splitType,
      shares,
    });
    return NextResponse.json({ expense });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't add expense";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
