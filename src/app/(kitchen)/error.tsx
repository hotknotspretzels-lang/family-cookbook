"use client";

export default function KitchenError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl">Something went wrong</h1>
      <button type="button" onClick={reset} className="h-12 w-fit rounded-full bg-primary px-5 font-semibold text-primary-foreground">
        Try again
      </button>
    </div>
  );
}
