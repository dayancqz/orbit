import { loadLifeGraph } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { BottomNav } from "@/components/BottomNav";
import { TabHeader } from "@/components/TabHeader";
import { PayForm } from "@/components/PayForm";
import { formatSGD, formatRelativeTime } from "@/lib/format";

// Reads live DB state (balance/transactions change when a payment is sent),
// so this must never be served from Next's static prerender cache.
export const dynamic = "force-dynamic";

export default async function PayPage() {
  const user = await requireUser();
  const graph = await loadLifeGraph(user.id);
  const account = graph.accounts[0];

  return (
    <AppShell>
      <TabHeader title="Pay" />
      <div className="flex flex-col gap-4 px-6 py-4">
        {account ? (
          <>
            <div className="rounded-2xl bg-orbit-card2 p-4">
              <p className="text-xs text-orbit-muted">Available balance · {account.name}</p>
              <p className="mt-1 text-2xl font-bold text-white">{formatSGD(account.balance)}</p>
            </div>
            <PayForm accountId={account.id} balance={account.balance} />
          </>
        ) : (
          <p className="py-10 text-center text-sm text-orbit-muted">No account to pay from yet.</p>
        )}

        <div>
          <p className="mb-2 text-sm font-semibold text-white">Recent</p>
          {graph.transactions.length === 0 ? (
            <p className="text-sm text-orbit-muted">No transactions yet.</p>
          ) : (
            <ul className="flex flex-col">
              {graph.transactions.slice(0, 8).map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between border-b border-orbit-border py-2.5 last:border-none"
                >
                  <span className="text-sm text-white">{t.merchant}</span>
                  <span className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-white">-{formatSGD(t.amount)}</span>
                    <span className="text-[11px] text-orbit-muted">{formatRelativeTime(t.occurredAt)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <BottomNav />
    </AppShell>
  );
}
