import { syncAgentActions } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { NotificationsList } from "@/components/NotificationsList";

// Reads live DB state (agent actions change via approve/dismiss), so this
// must never be served from Next's static prerender cache.
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function NotificationsPage() {
  const user = await requireUser();
  // syncAgentActions both runs the agents and returns every action, newest
  // first — the full set is needed once to sync, but only the first page
  // is rendered; NotificationsList fetches further pages from
  // /api/actions (a plain read, no re-sync) as the user scrolls.
  const actions = await syncAgentActions(user.id);
  const initialActions = actions.slice(0, PAGE_SIZE);
  const initialCursor = actions.length > PAGE_SIZE ? initialActions[initialActions.length - 1].id : null;

  return (
    <AppShell withBottomNav={false}>
      <PageHeader title="Notifications" backHref="/dashboard" />
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <NotificationsList initialActions={initialActions} initialCursor={initialCursor} />
      </div>
    </AppShell>
  );
}
