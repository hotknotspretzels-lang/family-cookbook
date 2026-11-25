import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { groupRecipes } from "@/lib/group";
import { publicPhotoUrl } from "@/lib/format";
import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/public";
import type {
  Category,
  Ingredient,
  NavGroup,
  Recipe,
  RecipeGroup,
  RecipeSnapshot,
  RecipeSummary,
  Revision,
  Step,
} from "@/lib/types";

const SUMMARY = `
  id, title, author_name, source_name, category_id, servings,
  prep_minutes, cook_minutes, tags, hero_photo_path, parent_recipe_id,
  created_at, deleted_at,
  category:categories (id, name, group_name)
`;

type CategoryJoin = { id: string; name: string; group_name: string };
type SummaryRow = {
  id: string;
  title: string;
  author_name: string;
  source_name: string | null;
  category_id: string;
  servings: number;
  prep_minutes: number | null;
  cook_minutes: number | null;
  tags: string[] | null;
  hero_photo_path: string | null;
  parent_recipe_id: string | null;
  created_at: string;
  deleted_at: string | null;
  category: CategoryJoin | CategoryJoin[] | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function asNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function toSummary(row: SummaryRow): RecipeSummary {
  const category = one(row.category);
  return {
    id: row.id,
    title: row.title,
    authorName: row.author_name,
    sourceName: row.source_name,
    categoryId: row.category_id,
    categoryName: category?.name ?? "Recipe",
    groupName: category?.group_name ?? "Recipes",
    servings: row.servings,
    prepMinutes: row.prep_minutes,
    cookMinutes: row.cook_minutes,
    tags: row.tags ?? [],
    heroUrl: publicPhotoUrl(row.hero_photo_path),
    parentId: row.parent_recipe_id,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
  };
}

function escapeLike(value: string) {
  return value.trim().replace(/[\\%_]/g, " ").replace(/\s+/g, " ");
}

async function fetchSummaries(idsOrFilter: {
  ids?: string[];
  parentIds?: string[];
  q?: string;
  categoryId?: string;
  deletedOnly?: boolean;
  limit?: number;
}) {
  const supabase = createPublicClient();
  let query = supabase.from("recipes").select(SUMMARY);
  if (idsOrFilter.ids) {
    if (!idsOrFilter.ids.length) return [];
    query = query.in("id", idsOrFilter.ids);
  } else if (idsOrFilter.parentIds) {
    if (!idsOrFilter.parentIds.length) return [];
    query = query.in("parent_recipe_id", idsOrFilter.parentIds).is("deleted_at", null);
  } else if (idsOrFilter.deletedOnly) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    query = query.not("deleted_at", "is", null).gte("deleted_at", since);
  } else {
    query = query.is("deleted_at", null);
    if (idsOrFilter.categoryId) query = query.eq("category_id", idsOrFilter.categoryId);
    const needle = idsOrFilter.q ? escapeLike(idsOrFilter.q) : "";
    if (needle) query = query.ilike("search_text", `%${needle}%`);
  }
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(idsOrFilter.limit ?? 200);
  if (error) {
    console.error(error);
    throw new Error("load");
  }
  return ((data ?? []) as unknown as SummaryRow[]).map(toSummary);
}

export type CatalogResult =
  | { configured: false; groups: RecipeGroup[]; error: null }
  | { configured: true; groups: RecipeGroup[]; error: string | null };

export async function listGroupedRecipes(options: {
  q?: string;
  categoryId?: string;
  limit?: number;
  groupLimit?: number;
}): Promise<CatalogResult> {
  await connection();
  if (!isSupabaseConfigured()) return { configured: false, groups: [], error: null };
  try {
    const matched = await fetchSummaries({
      q: options.q,
      categoryId: options.categoryId,
      limit: options.limit ?? 200,
    });
    const originalIds = matched.filter((recipe) => !recipe.parentId).map((recipe) => recipe.id);
    const parentIds = [
      ...new Set(matched.map((recipe) => recipe.parentId).filter((id): id is string => Boolean(id))),
    ];
    const [children, parents] = await Promise.all([
      fetchSummaries({ parentIds: originalIds, limit: 200 }),
      fetchSummaries({ ids: parentIds, limit: 200 }),
    ]);
    const visible = new Map<string, RecipeSummary>();
    for (const recipe of [...matched, ...children]) {
      if (!recipe.deletedAt) visible.set(recipe.id, recipe);
    }
    const groups = groupRecipes([...visible.values()], parents).slice(0, options.groupLimit ?? 100);
    return { configured: true, groups, error: null };
  } catch {
    return { configured: true, groups: [], error: "The cookbook could not be loaded." };
  }
}

export async function listVisibleSummaries(): Promise<
  | { configured: false; recipes: RecipeSummary[] }
  | { configured: true; recipes: RecipeSummary[]; error: string | null }
> {
  await connection();
  if (!isSupabaseConfigured()) return { configured: false, recipes: [] };
  try {
    const recipes = await fetchSummaries({ limit: 500 });
    return { configured: true, recipes, error: null };
  } catch {
    return { configured: true, recipes: [], error: "The cookbook could not be loaded." };
  }
}

export async function searchQuick(q: string) {
  await connection();
  const needle = escapeLike(q);
  if (!isSupabaseConfigured() || needle.length < 1) return [];
  try {
    return await fetchSummaries({ q: needle, limit: 8 });
  } catch {
    return [];
  }
}

export const getCategories = cache(async (): Promise<Category[]> => {
  await connection();
  if (!isSupabaseConfigured()) return [];
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, group_name, name, group_sort, sort_order")
    .order("group_sort")
    .order("sort_order");
  if (error) {
    console.error(error);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    groupName: row.group_name,
    name: row.name,
    groupSort: row.group_sort,
    sortOrder: row.sort_order,
  }));
});

export const getCategoryNav = cache(async (): Promise<NavGroup[]> => {
  await connection();
  if (!isSupabaseConfigured()) return [];
  const supabase = createPublicClient();
  const [categories, counts] = await Promise.all([
    getCategories(),
    supabase.rpc("category_counts"),
  ]);
  const countOf = new Map<string, number>();
  if (!counts.error) {
    for (const row of (counts.data ?? []) as { category_id: string; recipe_count: number }[]) {
      countOf.set(row.category_id, Number(row.recipe_count) || 0);
    }
  } else {
    console.error(counts.error);
  }
  const groups = new Map<string, NavGroup>();
  for (const category of categories) {
    const group = groups.get(category.groupName) ?? {
      name: category.groupName,
      sort: category.groupSort,
      single: false,
      items: [],
    };
    group.items.push({
      id: category.id,
      name: category.name,
      count: countOf.get(category.id) ?? 0,
      sort: category.sortOrder,
    });
    groups.set(category.groupName, group);
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      single: group.items.length === 1 && group.items[0]?.name === group.name,
      items: group.items.sort((a, b) => a.sort - b.sort),
    }))
    .sort((a, b) => a.sort - b.sort);
});

export async function getRecipe(id: string): Promise<
  | { configured: false; recipe: null }
  | { configured: true; recipe: Recipe | null; variations: RecipeSummary[]; parent: RecipeSummary | null }
> {
  await connection();
  if (!isSupabaseConfigured()) return { configured: false, recipe: null };
  const supabase = createPublicClient();
  const [{ data, error }, { data: variationRows }] = await Promise.all([
    supabase
      .from("recipes")
      .select(
        `${SUMMARY}, notes, card_photo_path, updated_at,
         recipe_ingredients (quantity, unit, item, note, position),
         recipe_steps (id, position, instruction, photo_path)`,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("recipes")
      .select(SUMMARY)
      .eq("parent_recipe_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
  ]);
  if (error) {
    console.error(error);
    return { configured: true, recipe: null, variations: [], parent: null };
  }
  if (!data) return { configured: true, recipe: null, variations: [], parent: null };

  const row = data as unknown as SummaryRow & {
    notes: string | null;
    card_photo_path: string | null;
    updated_at: string;
    recipe_ingredients: {
      quantity: number | string | null;
      unit: string | null;
      item: string;
      note: string | null;
      position: number;
    }[];
    recipe_steps: {
      id: string;
      position: number;
      instruction: string;
      photo_path: string | null;
    }[];
  };
  const summary = toSummary(row);
  const ingredients: Ingredient[] = (row.recipe_ingredients ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((ingredient) => ({
      quantity: asNumber(ingredient.quantity),
      unit: ingredient.unit,
      item: ingredient.item,
      note: ingredient.note,
    }));
  const steps: Step[] = (row.recipe_steps ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((step) => ({
      id: step.id,
      instruction: step.instruction,
      photoPath: step.photo_path,
      photoUrl: publicPhotoUrl(step.photo_path),
    }));
  let parent: RecipeSummary | null = null;
  if (summary.parentId) {
    const found = await fetchSummaries({ ids: [summary.parentId], limit: 1 });
    parent = found[0] ?? null;
  }
  const recipe: Recipe = {
    ...summary,
    notes: row.notes,
    heroPath: row.hero_photo_path,
    cardPath: row.card_photo_path,
    cardUrl: publicPhotoUrl(row.card_photo_path),
    ingredients,
    steps,
    updatedAt: row.updated_at,
  };
  return {
    configured: true,
    recipe,
    variations: ((variationRows ?? []) as unknown as SummaryRow[]).map(toSummary),
    parent,
  };
}

export async function listDeleted(): Promise<
  | { configured: false; recipes: RecipeSummary[] }
  | { configured: true; recipes: RecipeSummary[]; error: string | null }
> {
  await connection();
  if (!isSupabaseConfigured()) return { configured: false, recipes: [] };
  try {
    const recipes = await fetchSummaries({ deletedOnly: true, limit: 100 });
    return { configured: true, recipes, error: null };
  } catch {
    return { configured: true, recipes: [], error: "Recently deleted recipes could not be loaded." };
  }
}

function asSnapshot(value: unknown): RecipeSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const snapshot = value as RecipeSnapshot;
  if (typeof snapshot.title !== "string" || !Array.isArray(snapshot.ingredients)) return null;
  return snapshot;
}

export async function listRevisions(recipeId: string): Promise<Revision[]> {
  await connection();
  if (!isSupabaseConfigured()) return [];
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("recipe_revisions")
    .select("id, editor_name, created_at, snapshot")
    .eq("recipe_id", recipeId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    console.error(error);
    return [];
  }
  return (data ?? []).flatMap((row) => {
    const snapshot = asSnapshot(row.snapshot);
    if (!snapshot) return [];
    return [
      {
        id: row.id,
        editorName: row.editor_name,
        createdAt: row.created_at,
        snapshot,
      },
    ];
  });
}
