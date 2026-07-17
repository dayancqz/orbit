// Mobile-first content wrapper used by every page. Reads like a phone
// screen on an actual phone, and a centered column on desktop — no fake
// device bezel or status bar, since this is a real app, not a mockup.
export function AppShell({
  children,
  withBottomNav = true,
}: {
  children: React.ReactNode;
  withBottomNav?: boolean;
}) {
  return (
    <div className="min-h-screen bg-orbit-bg">
      <div
        className={`relative mx-auto flex min-h-screen w-full max-w-md flex-col ${
          withBottomNav ? "pb-24" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}
