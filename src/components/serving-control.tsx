"use client";

import { formatIngredient } from "@/lib/format";
import type { Ingredient } from "@/lib/types";
import { useState } from "react";

export function ServingControl({
  base,
  value,
  onChange,
}: {
  base: number;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center rounded-full bg-card p-1 ring-1 ring-foreground/10">
        <button
          type="button"
          className="size-12 rounded-full text-2xl font-semibold disabled:opacity-40"
          aria-label="Fewer servings"
          disabled={value <= 1}
          onClick={() => onChange(value - 1)}
        >
          −
        </button>
        <span className="min-w-28 px-2 text-center text-lg font-semibold">
          {value} {value === 1 ? "serving" : "servings"}
        </span>
        <button
          type="button"
          className="size-12 rounded-full text-2xl font-semibold"
          aria-label="More servings"
          disabled={value >= 99}
          onClick={() => onChange(value + 1)}
        >
          +
        </button>
      </div>
      {value !== base ? (
        <button type="button" className="h-12 px-3 text-sm font-semibold underline" onClick={() => onChange(base)}>
          Reset
        </button>
      ) : null}
    </div>
  );
}

export function ScaledIngredients({
  base,
  ingredients,
}: {
  base: number;
  ingredients: Ingredient[];
}) {
  const [servings, setServings] = useState(base);
  const scale = servings / base;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-2xl">Ingredients</h2>
        <p className="text-sm text-muted-foreground">Written for {base} {base === 1 ? "serving" : "servings"}.</p>
      </div>
      <ServingControl base={base} value={servings} onChange={setServings} />
      <ul className="flex flex-col gap-2">
        {ingredients.map((ingredient, index) => (
          <li key={`${ingredient.item}-${index}`} className="rounded-2xl bg-card px-4 py-3 text-lg">
            <p>{formatIngredient(ingredient, scale)}</p>
            {ingredient.note ? <p className="text-sm text-muted-foreground">{ingredient.note}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
