export default function BadgesLoading() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-4 w-1/4 rounded bg-zinc-100 dark:bg-zinc-800" />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
    </div>
  );
}
