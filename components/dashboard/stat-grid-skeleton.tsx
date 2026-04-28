export function StatGridSkeleton() {
  return (
    <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <div className="col-span-2 h-28 animate-pulse rounded-xl bg-dc-raised" />
      <div className="col-span-2 h-28 animate-pulse rounded-xl bg-dc-raised" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl bg-dc-raised" />
      ))}
    </section>
  );
}
