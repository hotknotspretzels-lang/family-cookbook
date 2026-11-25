import type { RecipeGroup, RecipeSummary } from "@/lib/types";

function dedupe(recipes: RecipeSummary[]) {
  const map = new Map<string, RecipeSummary>();
  for (const recipe of recipes) map.set(recipe.id, recipe);
  return [...map.values()];
}

/** Original first, its twists indented under it. Variations are never their own top-level row. */
export function groupRecipes(
  recipes: RecipeSummary[],
  extraParents: RecipeSummary[] = [],
): RecipeGroup[] {
  const visible = dedupe(recipes);
  const inList = new Set(visible.map((recipe) => recipe.id));
  const byId = new Map<string, RecipeSummary>();
  for (const recipe of visible) byId.set(recipe.id, recipe);
  for (const parent of extraParents) {
    if (!byId.has(parent.id)) byId.set(parent.id, parent);
  }

  const variationsOf = new Map<string, RecipeSummary[]>();
  const missing = new Map<string, RecipeSummary[]>();
  const originals: RecipeSummary[] = [];

  for (const recipe of visible) {
    if (!recipe.parentId) {
      originals.push(recipe);
      continue;
    }
    const parent = byId.get(recipe.parentId);
    if (!parent) {
      const list = missing.get(recipe.parentId) ?? [];
      list.push(recipe);
      missing.set(recipe.parentId, list);
      continue;
    }
    const list = variationsOf.get(parent.id) ?? [];
    list.push(recipe);
    variationsOf.set(parent.id, list);
  }

  const groups: (RecipeGroup & { sortAt: string })[] = [];
  const seen = new Set<string>();

  function sortKey(parent: RecipeSummary | null, variations: RecipeSummary[]) {
    const members = [
      ...(parent && inList.has(parent.id) ? [parent] : []),
      ...variations,
    ];
    return members.reduce((max, recipe) => (recipe.createdAt > max ? recipe.createdAt : max), "");
  }

  function push(
    parent: RecipeSummary | null,
    key: string,
    variations: RecipeSummary[],
    removed: boolean,
  ) {
    const deleted = Boolean(parent?.deletedAt);
    variations.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    groups.push({
      key,
      original: parent && !deleted ? parent : null,
      removed: removed || deleted,
      removedTitle: deleted ? (parent?.title ?? null) : null,
      variations,
      sortAt: sortKey(parent, variations),
    });
  }

  for (const original of originals) {
    seen.add(original.id);
    push(original, original.id, variationsOf.get(original.id) ?? [], false);
  }

  for (const [parentId, variations] of variationsOf) {
    if (seen.has(parentId)) continue;
    seen.add(parentId);
    push(byId.get(parentId) ?? null, parentId, variations, false);
  }

  for (const [parentId, variations] of missing) {
    push(null, parentId, variations, true);
  }

  return groups
    .sort((a, b) => b.sortAt.localeCompare(a.sortAt))
    .map(({ key, original, removed, removedTitle, variations }) => ({
      key,
      original,
      removed,
      removedTitle,
      variations,
    }));
}
