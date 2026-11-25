"use client";

import { useSyncExternalStore } from "react";
import { AUTHOR_STORAGE_KEY, FAVORITES_EVENT, FAVORITES_STORAGE_KEY } from "@/lib/tags";

const AUTHOR_EVENT = "family-cookbook-author";
const COOK_EVENT = "family-cookbook-cook";
const EMPTY_IDS: string[] = [];
const EMPTY_CHECKS: Record<string, boolean> = {};

let authorRaw: string | null | undefined;
let authorValue = "";

function readAuthor() {
  const raw = localStorage.getItem(AUTHOR_STORAGE_KEY);
  if (raw === authorRaw) return authorValue;
  authorRaw = raw;
  authorValue = raw ?? "";
  return authorValue;
}

export function useAuthorName() {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener(AUTHOR_EVENT, onChange);
      window.addEventListener("storage", onChange);
      return () => {
        window.removeEventListener(AUTHOR_EVENT, onChange);
        window.removeEventListener("storage", onChange);
      };
    },
    readAuthor,
    () => "",
  );
}

export function rememberAuthor(name: string) {
  localStorage.setItem(AUTHOR_STORAGE_KEY, name);
  authorRaw = name;
  authorValue = name;
  window.dispatchEvent(new Event(AUTHOR_EVENT));
}

let favoriteRaw: string | null | undefined;
let favoriteIds: string[] = EMPTY_IDS;

function readFavorites() {
  const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
  if (raw === favoriteRaw) return favoriteIds;
  favoriteRaw = raw;
  if (!raw) {
    favoriteIds = EMPTY_IDS;
    return favoriteIds;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    favoriteIds = Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : EMPTY_IDS;
  } catch {
    favoriteIds = EMPTY_IDS;
  }
  return favoriteIds;
}

export function useFavoriteIds() {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener(FAVORITES_EVENT, onChange);
      window.addEventListener("storage", onChange);
      return () => {
        window.removeEventListener(FAVORITES_EVENT, onChange);
        window.removeEventListener("storage", onChange);
      };
    },
    readFavorites,
    () => EMPTY_IDS,
  );
}

export function toggleFavorite(id: string) {
  const current = readFavorites();
  const next = current.includes(id) ? current.filter((item) => item !== id) : [id, ...current];
  const raw = JSON.stringify(next);
  localStorage.setItem(FAVORITES_STORAGE_KEY, raw);
  favoriteRaw = raw;
  favoriteIds = next;
  window.dispatchEvent(new Event(FAVORITES_EVENT));
  return next;
}

const cookCache = new Map<string, { raw: string | null; value: Record<string, boolean> }>();

function cookKey(recipeId: string) {
  return `family-cookbook-cook:${recipeId}`;
}

function readCookChecks(recipeId: string) {
  const key = cookKey(recipeId);
  const raw = sessionStorage.getItem(key);
  const cached = cookCache.get(key);
  if (cached && cached.raw === raw) return cached.value;
  let value = EMPTY_CHECKS;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        value = parsed as Record<string, boolean>;
      }
    } catch {
      value = EMPTY_CHECKS;
    }
  }
  cookCache.set(key, { raw, value });
  return value;
}

export function useCookChecks(recipeId: string) {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener(COOK_EVENT, onChange);
      return () => window.removeEventListener(COOK_EVENT, onChange);
    },
    () => readCookChecks(recipeId),
    () => EMPTY_CHECKS,
  );
}

export function writeCookChecks(recipeId: string, checks: Record<string, boolean>) {
  const key = cookKey(recipeId);
  const raw = JSON.stringify(checks);
  sessionStorage.setItem(key, raw);
  cookCache.set(key, { raw, value: checks });
  window.dispatchEvent(new Event(COOK_EVENT));
}
