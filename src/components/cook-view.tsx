"use client";

import { ServingControl } from "@/components/serving-control";
import { useCookChecks, writeCookChecks } from "@/lib/browser-store";
import { formatIngredient } from "@/lib/format";
import type { Ingredient, Step } from "@/lib/types";
import { useEffect, useState } from "react";

export function CookView({
  recipeId,
  title,
  base,
  ingredients,
  steps,
}: {
  recipeId: string;
  title: string;
  base: number;
  ingredients: Ingredient[];
  steps: Step[];
}) {
  const [servings, setServings] = useState(base);
  const checked = useCookChecks(recipeId);
  const [awake, setAwake] = useState<"unknown" | "on" | "off">("unknown");
  const scale = servings / base;

  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    async function request() {
      if (!("wakeLock" in navigator)) {
        if (!cancelled) setAwake("off");
        return;
      }
      try {
        lock = await navigator.wakeLock.request("screen");
        if (!cancelled) setAwake("on");
      } catch {
        if (!cancelled) setAwake("off");
      }
    }
    function onVisible() {
      if (document.visibilityState === "visible") void request();
    }
    void request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release();
    };
  }, []);

  function toggle(key: string) {
    writeCookChecks(recipeId, { ...checked, [key]: !checked[key] });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-6">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {awake === "on"
          ? "The screen will stay awake while you cook."
          : awake === "off"
            ? "This phone may still dim the screen."
            : "Checking whether the screen can stay awake."}
      </p>
      <h1 className="font-heading text-4xl leading-tight">{title}</h1>
      <ServingControl base={base} value={servings} onChange={setServings} />
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl">Ingredients</h2>
        {ingredients.map((ingredient, index) => {
          const key = `i-${index}`;
          const on = Boolean(checked[key]);
          return (
            <button
              key={key}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => toggle(key)}
              className="flex items-start gap-4 rounded-3xl bg-card px-4 py-4 text-left text-xl ring-1 ring-foreground/10"
            >
              <span
                className={`mt-1 size-7 shrink-0 rounded-md border ${on ? "border-primary bg-primary" : "border-input"}`}
              />
              <span className={on ? "text-muted-foreground line-through" : ""}>
                {formatIngredient(ingredient, scale)}
                {ingredient.note ? <span className="mt-1 block text-base text-muted-foreground">{ingredient.note}</span> : null}
              </span>
            </button>
          );
        })}
      </section>
      <section className="flex flex-col gap-6">
        <h2 className="font-heading text-2xl">Steps</h2>
        {steps.map((step, index) => {
          const key = `s-${step.id}`;
          const on = Boolean(checked[key]);
          return (
            <div key={step.id} className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => toggle(key)}
                className="flex items-start gap-4 text-left"
              >
                <span className={`flex size-12 shrink-0 items-center justify-center rounded-full font-heading text-xl ${on ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                  {index + 1}
                </span>
                <span className={`pt-2 text-2xl leading-snug ${on ? "text-muted-foreground line-through" : ""}`}>
                  {step.instruction}
                </span>
              </button>
              {step.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={step.photoUrl} alt={`Step ${index + 1}`} className="ml-16 aspect-[4/3] rounded-3xl object-cover" />
              ) : null}
            </div>
          );
        })}
      </section>
    </div>
  );
}
