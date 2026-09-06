import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getGroupDetail } from "@/lib/split";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { AddExpenseForm } from "@/components/AddExpenseForm";

export const dynamic = "force-dynamic";

export default async function NewExpensePage({ params }: { params: { groupId: string } }) {
  const user = await requireUser();

  let group;
  try {
    group = await getGroupDetail(user.id, params.groupId);
  } catch {
    redirect("/split");
  }

  return (
    <AppShell withBottomNav={false}>
      <PageHeader title="Add expense" backHref={`/split/${group.id}`} />
      <AddExpenseForm
        groupId={group.id}
        members={group.members.map((m) => ({ id: m.id, name: m.name }))}
        groupCurrency={group.currency}
      />
    </AppShell>
  );
}
