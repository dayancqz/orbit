import { NextResponse } from "next/server";
import { getGuardrails, updateGuardrails } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import type { GuardrailSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

const RISK_LEVELS = ["Conservative", "Moderate", "Aggressive"];

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const settings = await getGuardrails(user.id);
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await request.json();

  const data: Partial<GuardrailSettings> = {};
  if (typeof body.minBalance === "number") data.minBalance = body.minBalance;
  if (typeof body.monthlyAllocation === "number") data.monthlyAllocation = body.monthlyAllocation;
  if (typeof body.riskComfort === "string" && RISK_LEVELS.includes(body.riskComfort)) {
    data.riskComfort = body.riskComfort;
  }
  if (typeof body.connectCalendar === "boolean") data.connectCalendar = body.connectCalendar;
  if (typeof body.detectLifeEvents === "boolean") data.detectLifeEvents = body.detectLifeEvents;
  if (typeof body.preTripDays === "number") data.preTripDays = body.preTripDays;
  if (typeof body.flagAfterDays === "number") data.flagAfterDays = body.flagAfterDays;
  if (typeof body.autoTripMode === "boolean") data.autoTripMode = body.autoTripMode;
  if (typeof body.allowNegotiation === "boolean") data.allowNegotiation = body.allowNegotiation;

  const settings = await updateGuardrails(user.id, data);
  return NextResponse.json({ settings });
}
