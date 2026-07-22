import Link from "next/link";
import { loadLifeGraph } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { BottomNav } from "@/components/BottomNav";
import { TabHeader } from "@/components/TabHeader";
import { formatSGD } from "@/lib/format";

// Reads live DB state (account balances change via Pay/Yield), so this
// must never be served from Next's static prerender cache.
export const dynamic = "force-dynamic";

export default async function CardsPage() {
  const user = await requireUser();
  const graph = await loadLifeGraph(user.id);

  return (
    <AppShell>
      <TabHeader title="Cards" />
      <div className="flex flex-col gap-4 px-6 py-4">
        {graph.accounts.length === 0 && (
          <p className="py-10 text-center text-sm text-orbit-muted">No linked accounts yet.</p>
        )}
        {graph.accounts.map((account) => (
          <div
            key={account.id}
            className="rounded-2xl border border-orbit-border bg-gradient-to-br from-orbit-card2 to-orbit-card p-5"
          >
            <p className="text-xs font-medium text-orbit-muted">{account.currency} ACCOUNT</p>
            <p className="mt-1 text-lg font-semibold text-white">{account.name}</p>
            <p className="mt-4 text-[28px] font-bold text-white">{formatSGD(account.balance)}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="rounded-full bg-orbit-card2 px-2.5 py-1 text-[11px] text-orbit-muted">
                {(account.interestRate * 100).toFixed(2)}% p.a.
              </span>
              <Link href="/yield" className="text-xs font-medium text-orbit-yield">
                Optimise with Orbit Yield ›
              </Link>
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </AppShell>
  );
}
