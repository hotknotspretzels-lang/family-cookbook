import { formatQuantity, unitLabel } from "@/lib/quantity";
import type { Ingredient } from "@/lib/types";

export function formatIngredient(ingredient: Ingredient, scale = 1) {
  if (ingredient.quantity == null) return ingredient.item;
  const amount = ingredient.quantity * scale;
  const quantity = formatQuantity(amount);
  const unit = unitLabel(ingredient.unit, amount);
  return [quantity, unit, ingredient.item].filter(Boolean).join(" ");
}

export function ingredientDraftLine(
  quantity: number | null,
  unit: string | null,
  item: string,
) {
  if (quantity == null) return item;
  return [formatQuantity(quantity), unitLabel(unit, quantity), item].filter(Boolean).join(" ");
}

export function publicPhotoUrl(path: string | null | undefined) {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  const encoded = path.split("/").map((part) => encodeURIComponent(part)).join("/");
  return `${base}/storage/v1/object/public/recipe-photos/${encoded}`;
}
