import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { setGroupCurrency, SUPPORTED_TRIP_CURRENCIES } from "@/lib/split";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { groupId: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await request.json();
  const { currency } = body ?? {};

  if (typeof currency !== "string" || !SUPPORTED_TRIP_CURRENCIES.includes(currency as never)) {
    return NextResponse.json({ error: "Unsupported currency" }, { status: 400 });
  }

  try {
    const result = await setGroupCurrency(user.id, params.groupId, currency as (typeof SUPPORTED_TRIP_CURRENCIES)[number]);
    return NextResponse.json({ group: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't update the currency";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
