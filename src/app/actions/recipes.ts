"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { friendlyDbError } from "@/lib/db-error";
import { parseQuantity } from "@/lib/quantity";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import type { ActionState } from "@/lib/types";
import { isUuid } from "@/lib/utils";
import { noticeFor, uploadRecipePhoto } from "@/lib/uploads";

const PHOTO_PATH = /^recipes\/[A-Za-z0-9._/-]+\.(jpg|jpeg|png|webp|gif)$/;

function cleanName(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 80);
}

function optionalPath(value: unknown) {
  if (typeof value !== "string") return null;
  const path = value.trim();
  if (!path) return null;
  return PHOTO_PATH.test(path) ? path : null;
}

function readJson(formData: FormData, key: string) {
  const raw = formData.get(key);
  if (typeof raw !== "string" || !raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function filesNamed(formData: FormData, name: string) {
  return formData
    .getAll(name)
    .filter((value): value is File => value instanceof File && value.size > 0);
}

type IngredientInput = {
  quantity: number | null;
  unit: string | null;
  item: string;
  note: string | null;
};

type StepInput = { instruction: string; photo_path: string | null };

function parsePayload(formData: FormData) {
  if (String(formData.get("company") ?? "").trim()) {
    return { error: "That did not save. Try again in a moment." } as const;
  }
  const yourName = cleanName(String(formData.get("yourName") ?? ""));
  if (!yourName) return { error: "Add your name." } as const;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Add a title." } as const;
  if (title.length > 200) return { error: "The title is too long." } as const;
  const sourceName = String(formData.get("sourceName") ?? "").trim();
  if (sourceName.length > 120) return { error: "Who it is from is too long." } as const;
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  if (!/^[a-z0-9-]{1,40}$/.test(categoryId)) return { error: "Pick a category." } as const;
  const servings = Number(formData.get("servings"));
  if (!Number.isInteger(servings) || servings < 1 || servings > 1000) {
    return { error: "Servings has to be at least 1." } as const;
  }
  const prepRaw = String(formData.get("prepMinutes") ?? "").trim();
  const cookRaw = String(formData.get("cookMinutes") ?? "").trim();
  const prepMinutes = prepRaw ? Number(prepRaw) : null;
  const cookMinutes = cookRaw ? Number(cookRaw) : null;
  if (prepMinutes != null && (!Number.isInteger(prepMinutes) || prepMinutes < 0 || prepMinutes > 10000)) {
    return { error: "Prep time looks off." } as const;
  }
  if (cookMinutes != null && (!Number.isInteger(cookMinutes) || cookMinutes < 0 || cookMinutes > 10000)) {
    return { error: "Cook time looks off." } as const;
  }
  const notes = String(formData.get("notes") ?? "").trim();
  if (notes.length > 8000) return { error: "The story is too long." } as const;
  const tagValue = readJson(formData, "tags");
  const tags: string[] = [];
  const seenTags = new Set<string>();
  if (Array.isArray(tagValue)) {
    for (const entry of tagValue) {
      const tag = String(entry).trim().slice(0, 40);
      const key = tag.toLowerCase();
      if (!tag || seenTags.has(key)) continue;
      seenTags.add(key);
      tags.push(tag);
      if (tags.length >= 20) break;
    }
  }
  if (tags.some((tag) => tag.length > 40)) return { error: "A tag is too long." } as const;

  const ingredientValue = readJson(formData, "ingredients");
  if (!Array.isArray(ingredientValue)) return { error: "Add at least one ingredient." } as const;
  const ingredients: IngredientInput[] = [];
  for (const entry of ingredientValue) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const item = String(record.item ?? "").trim();
    if (!item) continue;
    const quantity =
      record.quantity == null || record.quantity === ""
        ? null
        : parseQuantity(String(record.quantity));
    if (record.quantity != null && record.quantity !== "" && quantity == null) {
      return { error: "Check the ingredient amounts." } as const;
    }
    ingredients.push({
      quantity,
      unit: String(record.unit ?? "").trim() || null,
      item: item.slice(0, 300),
      note: String(record.note ?? "").trim().slice(0, 200) || null,
    });
  }
  if (!ingredients.length) return { error: "Add at least one ingredient." } as const;
  if (ingredients.length > 80) return { error: "That is a lot of ingredient lines." } as const;

  const stepValue = readJson(formData, "steps");
  if (!Array.isArray(stepValue)) return { error: "Add at least one step." } as const;
  const steps: StepInput[] = [];
  for (const entry of stepValue) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const instruction = String(record.instruction ?? "").trim();
    if (!instruction) continue;
    steps.push({
      instruction: instruction.slice(0, 4000),
      photo_path: optionalPath(record.photoPath),
    });
  }
  if (!steps.length) return { error: "Add at least one step." } as const;
  if (steps.length > 40) return { error: "That is a lot of steps." } as const;

  const mode = String(formData.get("mode") ?? "");
  const id = String(formData.get("id") ?? "");
  const parentId = String(formData.get("parentId") ?? "");
  if (mode === "edit" && !isUuid(id)) return { error: "Recipe not found." } as const;
  if (mode === "variation" && !isUuid(parentId)) return { error: "Original recipe not found." } as const;
  if (mode !== "create" && mode !== "edit" && mode !== "variation") {
    return { error: "That did not save. Try again in a moment." } as const;
  }

  return {
    data: {
      mode,
      id: mode === "edit" ? id : null,
      parentId: mode === "variation" ? parentId : null,
      yourName,
      title,
      sourceName,
      categoryId,
      servings,
      prepMinutes,
      cookMinutes,
      notes,
      tags,
      ingredients,
      steps,
      heroPath: optionalPath(formData.get("heroPath")),
      cardPath: optionalPath(formData.get("cardPath")),
    },
  } as const;
}

function refresh(id: string) {
  revalidatePath("/", "layout");
  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
  revalidatePath(`/recipes/${id}/cook`);
  revalidatePath(`/recipes/${id}/history`);
  revalidatePath("/deleted");
  revalidatePath("/favorites");
}

export async function saveRecipe(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isAdminConfigured()) {
    return { error: "Saving is not set up yet. Add SUPABASE_SERVICE_ROLE_KEY on the server." };
  }
  const parsed = parsePayload(formData);
  if (!("data" in parsed) || !parsed.data) {
    return { error: "error" in parsed ? parsed.error : "That did not save. Try again in a moment." };
  }
  const recipe = parsed.data;
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("save_recipe", {
    p_id: recipe.id,
    p_parent_id: recipe.parentId,
    p_title: recipe.title,
    p_author_name: recipe.yourName,
    p_source_name: recipe.sourceName,
    p_category_id: recipe.categoryId,
    p_servings: recipe.servings,
    p_prep_minutes: recipe.prepMinutes,
    p_cook_minutes: recipe.cookMinutes,
    p_notes: recipe.notes,
    p_tags: recipe.tags,
    p_editor_name: recipe.yourName,
    p_hero_photo_path: recipe.heroPath,
    p_card_photo_path: recipe.cardPath,
    p_ingredients: recipe.ingredients,
    p_steps: recipe.steps,
  });
  if (error) return { error: friendlyDbError(error.message) };
  const saved = data as { id?: string; step_ids?: string[] } | null;
  const id = saved?.id;
  const stepIds = saved?.step_ids ?? [];
  if (!id) return { error: "That did not save. Try again in a moment." };

  let notice: string | null = null;
  const hero = filesNamed(formData, "hero")[0];
  const card = filesNamed(formData, "card")[0];
  if (hero) {
    const uploaded = await uploadRecipePhoto(admin, id, hero, "hero");
    if ("error" in uploaded) notice = noticeFor(uploaded.error);
    else {
      const { error: updateError } = await admin
        .from("recipes")
        .update({ hero_photo_path: uploaded.path })
        .eq("id", id);
      if (updateError) notice = "upload";
    }
  }
  if (!notice && card) {
    const uploaded = await uploadRecipePhoto(admin, id, card, "card");
    if ("error" in uploaded) notice = noticeFor(uploaded.error);
    else {
      const { error: updateError } = await admin
        .from("recipes")
        .update({ card_photo_path: uploaded.path })
        .eq("id", id);
      if (updateError) notice = "upload";
    }
  }
  if (!notice) {
    for (let index = 0; index < stepIds.length; index += 1) {
      const file = filesNamed(formData, `stepPhoto-${index}`)[0];
      const stepId = stepIds[index];
      if (!file || !stepId) continue;
      const uploaded = await uploadRecipePhoto(admin, id, file, `step-${index}`);
      if ("error" in uploaded) {
        notice = noticeFor(uploaded.error);
        break;
      }
      const { error: updateError } = await admin
        .from("recipe_steps")
        .update({ photo_path: uploaded.path })
        .eq("id", stepId);
      if (updateError) {
        notice = "upload";
        break;
      }
    }
  }

  refresh(id);
  redirect(notice ? `/recipes/${id}?notice=${notice}` : `/recipes/${id}`);
}

export async function softDeleteRecipe(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isAdminConfigured()) {
    return { error: "Saving is not set up yet. Add SUPABASE_SERVICE_ROLE_KEY on the server." };
  }
  if (String(formData.get("confirm") ?? "") !== "DELETE") {
    return { error: "Type DELETE to confirm." };
  }
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return { error: "Recipe not found." };
  const admin = createAdminClient();
  const { error } = await admin.rpc("soft_delete_recipe", { p_id: id });
  if (error) return { error: friendlyDbError(error.message) };
  refresh(id);
  redirect("/deleted");
}

export async function restoreDeletedRecipe(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isAdminConfigured()) {
    return { error: "Saving is not set up yet. Add SUPABASE_SERVICE_ROLE_KEY on the server." };
  }
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return { error: "Recipe not found." };
  const admin = createAdminClient();
  const { error } = await admin.rpc("restore_deleted_recipe", { p_id: id });
  if (error) return { error: friendlyDbError(error.message) };
  refresh(id);
  redirect(`/recipes/${id}`);
}

export async function restoreRevision(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isAdminConfigured()) {
    return { error: "Saving is not set up yet. Add SUPABASE_SERVICE_ROLE_KEY on the server." };
  }
  const yourName = cleanName(String(formData.get("yourName") ?? ""));
  if (!yourName) return { error: "Add your name." };
  const recipeId = String(formData.get("recipeId") ?? "");
  const revisionId = String(formData.get("revisionId") ?? "");
  if (!isUuid(recipeId) || !isUuid(revisionId)) return { error: "That version could not be found." };
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("recipe_revisions")
    .select("snapshot, recipe_id")
    .eq("id", revisionId)
    .maybeSingle();
  if (error || !data || data.recipe_id !== recipeId) {
    return { error: "That version could not be found." };
  }
  const { error: restoreError } = await admin.rpc("restore_recipe_version", {
    p_id: recipeId,
    p_snapshot: data.snapshot,
    p_editor_name: yourName,
  });
  if (restoreError) return { error: friendlyDbError(restoreError.message) };
  refresh(recipeId);
  redirect(`/recipes/${recipeId}`);
}
