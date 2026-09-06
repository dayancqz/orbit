import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getGroupsForUser } from "@/lib/split";
import { AppShell } from "@/components/AppShell";
import { TabHeader } from "@/components/TabHeader";
import { BottomNav } from "@/components/BottomNav";
import { StatusChip } from "@/components/StatusChip";
import { formatSGD } from "@/lib/format";

// Reads live DB state (balances change via expenses/settlements), so this
// must never be served from Next's static prerender cache.
export const dynamic = "force-dynamic";

export default async function SplitPage() {
  const user = await requireUser();
  const groups = await getGroupsForUser(user.id);

  return (
    <AppShell>
      <TabHeader title="Split" />
      <div className="flex flex-col gap-3 px-6 py-4">
        {groups.length === 0 && (
          <p className="py-10 text-center text-sm text-orbit-muted">
            No split groups yet — create one to track who owes what on a shared bill or trip.
          </p>
        )}
        {groups.map((g) => (
          <Link
            key={g.id}
            href={`/split/${g.id}`}
            className="flex items-center justify-between gap-3 rounded-2xl border border-orbit-border bg-orbit-card p-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-orbit-text">{g.name}</p>
              <p className="mt-0.5 text-xs text-orbit-muted">
                {g.memberCount} member{g.memberCount === 1 ? "" : "s"}
              </p>
            </div>
            {Math.abs(g.myNet) < 0.01 ? (
              <StatusChip tone="muted">Settled up</StatusChip>
            ) : g.myNet > 0 ? (
              <StatusChip tone="green">You&apos;re owed {formatSGD(g.myNet)}</StatusChip>
            ) : (
              <StatusChip tone="red">You owe {formatSGD(-g.myNet)}</StatusChip>
            )}
          </Link>
        ))}
        <Link
          href="/split/new"
          className="rounded-2xl border border-dashed border-orbit-border py-4 text-center text-sm font-medium text-orbit-muted"
        >
          + New group
        </Link>
      </div>
      <BottomNav />
    </AppShell>
  );
}
