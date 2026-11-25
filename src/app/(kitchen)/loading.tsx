export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-10 w-48 animate-pulse rounded-full bg-muted" />
      <div className="h-40 animate-pulse rounded-3xl bg-muted" />
      <div className="h-40 animate-pulse rounded-3xl bg-muted" />
    </div>
  );
}
