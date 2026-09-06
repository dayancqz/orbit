import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { NewSplitGroupForm } from "@/components/NewSplitGroupForm";

export const dynamic = "force-dynamic";

export default async function NewSplitGroupPage() {
  await requireUser();

  return (
    <AppShell withBottomNav={false}>
      <PageHeader title="New split group" backHref="/split" />
      <NewSplitGroupForm />
    </AppShell>
  );
}
