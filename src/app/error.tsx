"use client";

import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";

// Route-segment error boundary — Next.js renders this instead of the page
// whenever a Server or Client Component in this tree throws during render,
// so one bad request doesn't take down the whole nav shell.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <AppShell withBottomNav={false}>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-semibold text-orbit-text">Something went wrong</p>
        <p className="text-sm text-orbit-muted">
          This page hit an unexpected error. You can try again, or head back to the dashboard.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-orbit-accent px-5 py-2 text-sm font-semibold text-orbit-accent-contrast"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="rounded-full border border-orbit-border px-5 py-2 text-sm font-medium text-orbit-text"
          >
            Go to dashboard
          </a>
        </div>
      </div>
    </AppShell>
  );
}
