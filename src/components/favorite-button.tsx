"use client";

import { Heart } from "lucide-react";
import { toggleFavorite, useFavoriteIds } from "@/lib/browser-store";
import { cn } from "@/lib/utils";

export function FavoriteButton({ id, className }: { id: string; className?: string }) {
  const ids = useFavoriteIds();
  const on = ids.includes(id);

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Remove from saved recipes" : "Save this recipe on this phone"}
      onClick={() => toggleFavorite(id)}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-full bg-card/90 text-primary shadow-sm",
        className,
      )}
    >
      <Heart className={cn("size-5", on && "fill-current")} />
    </button>
  );
}
