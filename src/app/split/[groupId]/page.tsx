import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { requireUser } from "@/lib/auth";
import { getGroupDetail, getOrCreateGroupInvite } from "@/lib/split";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusChip } from "@/components/StatusChip";
import { SettleSuggestionRow } from "@/components/SettleSuggestionRow";
import { InviteQrPanel } from "@/components/InviteQrPanel";
import { GroupCurrencyPanel } from "@/components/GroupCurrencyPanel";
import { formatCurrency, formatDate } from "@/lib/format";

// Reads live DB state (expenses/settlements change balances), so this
// must never be served from Next's static prerender cache.
export const dynamic = "force-dynamic";

export default async function SplitGroupPage({
  params,
  searchParams,
}: {
  params: { groupId: string };
  searchParams: { new?: string };
}) {
  const user = await requireUser();

  let group;
  try {
    group = await getGroupDetail(user.id, params.groupId);
  } catch {
    redirect("/split");
  }

  const currentMember = group.members.find((m) => m.isCurrentUser);
  const orbitUserByMemberId = new Map(group.members.map((m) => [m.id, Boolean(m.userId)]));

  const invite = await getOrCreateGroupInvite(user.id, group.id);
  const requestHeaders = headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const joinUrl = `${protocol}://${host}/split/join/${invite.token}`;
  const qrDataUrl = await QRCode.toDataURL(joinUrl, { margin: 1, width: 220 });

  return (
    <AppShell withBottomNav={false}>
      <PageHeader title={group.name} backHref="/split" />

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        <InviteQrPanel
          groupId={group.id}
          joinUrl={joinUrl}
          qrDataUrl={qrDataUrl}
          canRegenerate={group.createdById === user.id}
          openByDefault={searchParams?.new === "1"}
        />

        <GroupCurrencyPanel
          groupId={group.id}
          currency={group.currency}
          exchangeRateToSGD={group.exchangeRateToSGD}
          rateUpdatedAt={group.rateUpdatedAt}
          canEdit={group.createdById === user.id}
        />

        <div className="rounded-2xl border border-orbit-border bg-orbit-card p-4">
          <p className="mb-2 text-xs font-medium text-orbit-muted">BALANCES</p>
          <div className="flex flex-col gap-2">
            {group.balances.map((b) => (
              <div key={b.memberId} className="flex items-center justify-between gap-2">
                <span className="truncate text-sm text-orbit-text">{b.memberName}</span>
                {Math.abs(b.net) < 0.01 ? (
                  <StatusChip tone="muted">Settled up</StatusChip>
                ) : b.net > 0 ? (
                  <StatusChip tone="green">+{formatCurrency(b.net, group.currency)}</StatusChip>
                ) : (
                  <StatusChip tone="red">-{formatCurrency(-b.net, group.currency)}</StatusChip>
                )}
              </div>
            ))}
          </div>
        </div>

        {group.suggestions.length > 0 && (
          <div className="rounded-2xl border border-orbit-border bg-orbit-card p-4">
            <p className="mb-2 text-xs font-medium text-orbit-muted">SETTLE UP</p>
            <div className="flex flex-col gap-2.5">
              {group.suggestions.map((s, i) => (
                <SettleSuggestionRow
                  key={i}
                  groupId={group.id}
                  suggestion={s}
                  currentMemberId={currentMember?.id}
                  fromIsOrbitUser={orbitUserByMemberId.get(s.fromMemberId) ?? false}
                  toIsOrbitUser={orbitUserByMemberId.get(s.toMemberId) ?? false}
                  groupCurrency={group.currency}
                  exchangeRateToSGD={group.exchangeRateToSGD}
                />
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-orbit-border bg-orbit-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-orbit-muted">EXPENSES</p>
            <Link href={`/split/${group.id}/new-expense`} className="text-xs font-medium text-orbit-accent">
              + Add expense
            </Link>
          </div>
          {group.expenses.length === 0 && (
            <p className="py-6 text-center text-sm text-orbit-muted">No expenses logged yet.</p>
          )}
          <div className="flex flex-col">
            {group.expenses.map((e) => (
              <div key={e.id} className="border-b border-orbit-border py-3 last:border-none">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-orbit-text">{e.description}</p>
                  <p className="shrink-0 text-sm font-semibold text-orbit-text">
                    {formatCurrency(e.amount, group.currency)}
                  </p>
                </div>
                <p className="mt-0.5 text-xs text-orbit-muted">
                  Paid by {e.paidByName} · {formatDate(e.occurredAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
