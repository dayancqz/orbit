import { getGuardrails } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { GuardrailsForm } from "@/components/GuardrailsForm";

// Reads live DB state (the user's saved guardrails), so this must never be
// served from Next's static prerender cache.
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const settings = await getGuardrails(user.id);

  return (
    <AppShell withBottomNav={false}>
      <PageHeader title="Guardrails" backHref="/dashboard" />
      <p className="px-6 pb-2 pt-1 text-center text-[13px] text-orbit-muted">
        Orbit acts within these rules. Change anytime.
      </p>
      <GuardrailsForm initial={settings} />
    </AppShell>
  );
}
