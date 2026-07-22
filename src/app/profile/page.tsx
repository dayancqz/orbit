import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { BottomNav } from "@/components/BottomNav";
import { TabHeader } from "@/components/TabHeader";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

function ProfileLink({ href, label, sub }: { href: string; label: string; sub: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-orbit-border bg-orbit-card px-4 py-3.5"
    >
      <span>
        <span className="block text-sm font-semibold text-white">{label}</span>
        <span className="block text-xs text-orbit-muted">{sub}</span>
      </span>
      <span className="text-lg text-orbit-muted">›</span>
    </Link>
  );
}

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <AppShell>
      <TabHeader title="Profile" />

      <div className="flex flex-col items-center gap-1.5 px-6 py-6">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-orbit-card2 text-lg font-semibold text-white">
          {user.name.slice(0, 2).toUpperCase()}
        </span>
        <p className="mt-1 text-lg font-semibold text-white">{user.name}</p>
        <p className="text-sm text-orbit-muted">{user.email}</p>
      </div>

      <div className="flex flex-col gap-2 px-4">
        <ProfileLink href="/settings" label="Guardrails" sub="Thresholds each agent must stay within" />
        <ProfileLink href="/approvals" label="Approval Hub" sub="Review pending and past agent decisions" />
        <ProfileLink href="/notifications" label="Notifications" sub="Everything Orbit has done or flagged" />
      </div>

      <div className="mt-auto px-6 py-4">
        <LogoutButton />
      </div>

      <BottomNav />
    </AppShell>
  );
}
