export default function HomeLoading() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-32 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
      <div className="h-4 w-1/3 rounded bg-zinc-100 dark:bg-zinc-800" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
    </div>
  );
}
