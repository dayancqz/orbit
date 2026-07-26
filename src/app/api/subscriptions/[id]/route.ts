import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateSubscription } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { merchant, monthlyAmount } = body ?? {};

  if (typeof merchant !== "string" || !merchant.trim()) {
    return NextResponse.json({ error: "Enter a subscription name" }, { status: 400 });
  }
  if (typeof monthlyAmount !== "number" || !Number.isFinite(monthlyAmount) || monthlyAmount <= 0) {
    return NextResponse.json({ error: "Enter a valid monthly amount" }, { status: 400 });
  }

  try {
    const subscription = await updateSubscription(user.id, params.id, {
      merchant: merchant.trim(),
      monthlyAmount,
    });
    return NextResponse.json({ subscription });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't save changes";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
