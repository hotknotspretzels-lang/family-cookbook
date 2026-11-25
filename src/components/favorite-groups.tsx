"use client";

import { RecipeGroups } from "@/components/recipe-groups";
import { useFavoriteIds } from "@/lib/browser-store";
import { groupRecipes } from "@/lib/group";
import type { RecipeSummary } from "@/lib/types";

export function FavoriteGroups({ recipes }: { recipes: RecipeSummary[] }) {
  const ids = useFavoriteIds();
  const chosen = new Set(ids);
  const picked = recipes.filter((recipe) => chosen.has(recipe.id));
  if (!picked.length) {
    return (
      <p className="text-lg text-muted-foreground">
        Tap the heart on a recipe and it will stay on this phone.
      </p>
    );
  }
  return <RecipeGroups groups={groupRecipes(picked, recipes)} />;
}
