export function TabHeader({ title }: { title: string }) {
  return (
    <header className="flex h-[72px] shrink-0 items-center bg-orbit-surface px-6">
      <h1 className="text-lg font-bold text-white">{title}</h1>
    </header>
  );
}
