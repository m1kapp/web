export default function StoreLoading() {
  return (
    <div className="p-4 space-y-3 animate-pulse">
      <div className="h-4 w-1/4 rounded bg-zinc-100 dark:bg-zinc-800" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
    </div>
  );
}
