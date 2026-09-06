import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { joinGroupViaInvite } from "@/lib/split";
import { AppShell } from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function JoinSplitGroupPage({ params }: { params: { token: string } }) {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/split/join/${params.token}`)}`);
  }

  let groupId: string;
  try {
    const result = await joinGroupViaInvite(user.id, params.token);
    groupId = result.groupId;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't join that group";
    return (
      <AppShell withBottomNav={false}>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          <p className="text-sm text-orbit-text">{message}</p>
          <Link href="/split" className="text-sm text-orbit-accent">
            Back to Split
          </Link>
        </div>
      </AppShell>
    );
  }

  redirect(`/split/${groupId}`);
}
