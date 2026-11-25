import { RecipeCard } from "@/components/recipe-card";
import type { RecipeGroup } from "@/lib/types";

export function RecipeGroups({ groups }: { groups: RecipeGroup[] }) {
  if (!groups.length) return null;
  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.key} className="flex flex-col gap-3">
          {group.removed ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/60 px-4 py-4">
              <h2 className="font-heading text-xl">Original recipe removed</h2>
              {group.removedTitle ? (
                <p className="text-sm text-muted-foreground">{group.removedTitle}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  The original is no longer in the cookbook. These twists are still here.
                </p>
              )}
            </div>
          ) : group.original ? (
            <RecipeCard recipe={group.original} />
          ) : null}
          {group.variations.map((variation) => (
            <RecipeCard key={variation.id} recipe={variation} nested />
          ))}
        </section>
      ))}
    </div>
  );
}
