import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { settleDebt } from "@/lib/split";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { groupId: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await request.json();
  const { fromMemberId, toMemberId, amount } = body ?? {};

  if (typeof fromMemberId !== "string" || !fromMemberId) {
    return NextResponse.json({ error: "fromMemberId is required" }, { status: 400 });
  }
  if (typeof toMemberId !== "string" || !toMemberId) {
    return NextResponse.json({ error: "toMemberId is required" }, { status: 400 });
  }
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter a valid amount" }, { status: 400 });
  }

  try {
    const settlement = await settleDebt(user.id, params.groupId, fromMemberId, toMemberId, amount);
    return NextResponse.json({ settlement });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't settle up";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
