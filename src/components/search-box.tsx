"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { RecipeSummary } from "@/lib/types";

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RecipeSummary[]>([]);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const needle = query.trim();
    if (needle.length < 1) return;
    const controller = new AbortController();
    const handle = window.setTimeout(() => {
      void fetch(`/api/search?q=${encodeURIComponent(needle)}`, { signal: controller.signal })
        .then((response) => response.json())
        .then((data: { results?: RecipeSummary[] }) => {
          setResults(data.results ?? []);
          setOpen(true);
        })
        .catch(() => {
          if (!controller.signal.aborted) setResults([]);
        });
    }, 150);
    return () => {
      controller.abort();
      window.clearTimeout(handle);
    };
  }, [query]);

  useEffect(() => {
    function onPointer(event: PointerEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, []);

  const show = open && query.trim().length > 0;

  return (
    <div ref={box} className="relative w-full">
      <form action="/recipes" className="relative">
        <label htmlFor="recipe-search" className="sr-only">
          Search recipes
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          id="recipe-search"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            if (query.trim()) setOpen(true);
          }}
          placeholder="Search recipes, ingredients, tags, or who added it"
          autoComplete="off"
          className="h-14 w-full rounded-full border border-input bg-card pr-4 pl-12 text-base shadow-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
        />
      </form>
      {show ? (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-3xl bg-card py-2 shadow-xl ring-1 ring-foreground/10">
          {results.length ? (
            <ul>
              {results.map((recipe) => (
                <li key={recipe.id}>
                  <Link
                    href={`/recipes/${recipe.id}`}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 hover:bg-accent"
                  >
                    <span className="block font-heading text-lg leading-snug">{recipe.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {recipe.parentId ? "Twist · " : ""}
                      Added by {recipe.authorName} · {recipe.categoryName}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-muted-foreground">No recipes match that yet.</p>
          )}
          <Link
            href={`/recipes?q=${encodeURIComponent(query.trim())}`}
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-sm font-semibold text-primary"
          >
            See all results
          </Link>
        </div>
      ) : null}
    </div>
  );
}
