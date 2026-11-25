import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 3_500_000;

function extension(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
}

export type UploadFailure = "type" | "size" | "upload";

export async function uploadRecipePhoto(
  admin: SupabaseClient,
  recipeId: string,
  file: File,
  name: string,
): Promise<{ path: string } | { error: UploadFailure }> {
  if (!ALLOWED.has(file.type)) return { error: "type" };
  if (file.size > MAX_BYTES) return { error: "size" };
  const path = `recipes/${recipeId}/${name}-${crypto.randomUUID()}.${extension(file.type)}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from("recipe-photos").upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    console.error(error);
    return { error: "upload" };
  }
  return { path };
}

export function noticeFor(error: UploadFailure) {
  if (error === "type") return "type";
  if (error === "size") return "size";
  return "upload";
}
