"use client";

import { useActionState, useState } from "react";
import { saveRecipe } from "@/app/actions/recipes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { compressImage } from "@/lib/compress-image";
import { ingredientDraftLine } from "@/lib/format";
import { parseIngredientLine } from "@/lib/parse-ingredient";
import { formatQuantity, parseQuantity, unitLabel } from "@/lib/quantity";
import { rememberAuthor, useAuthorName } from "@/lib/browser-store";
import { SUGGESTED_TAGS } from "@/lib/tags";
import type { Category } from "@/lib/types";
import { twistTitle } from "@/lib/utils";

type IngredientDraft = {
  key: string;
  line: string;
  quantity: string;
  unit: string;
  item: string;
  note: string;
};

type StepDraft = {
  key: string;
  instruction: string;
  photoPath: string | null;
  photoUrl: string | null;
  file: File | null;
};

export type RecipeFormInitial = {
  title: string;
  sourceName: string;
  categoryId: string;
  servings: string;
  prepMinutes: string;
  cookMinutes: string;
  notes: string;
  tags: string[];
  ingredients: { quantity: number | null; unit: string | null; item: string; note: string | null }[];
  steps: { instruction: string; photoPath: string | null; photoUrl: string | null }[];
  heroPath: string | null;
  heroUrl: string | null;
  cardPath: string | null;
  cardUrl: string | null;
  authorName?: string;
};

const UNITS = ["cup", "tbsp", "tsp", "oz", "lb", "g", "kg", "ml", "l", "pinch", "clove", "can", "package"];

function blankIngredient(): IngredientDraft {
  return { key: crypto.randomUUID(), line: "", quantity: "", unit: "", item: "", note: "" };
}

function fromIngredient(ingredient: RecipeFormInitial["ingredients"][number]): IngredientDraft {
  return {
    key: crypto.randomUUID(),
    line: ingredientDraftLine(ingredient.quantity, ingredient.unit, ingredient.item),
    quantity: ingredient.quantity == null ? "" : String(ingredient.quantity),
    unit: ingredient.unit ?? "",
    item: ingredient.item,
    note: ingredient.note ?? "",
  };
}

export function RecipeForm({
  mode,
  recipeId,
  parentId,
  parentTitle,
  categories,
  initial,
}: {
  mode: "create" | "edit" | "variation";
  recipeId?: string;
  parentId?: string;
  parentTitle?: string;
  categories: Category[];
  initial: RecipeFormInitial;
}) {
  const [state, formAction, pending] = useActionState(saveRecipe, undefined);
  const storedName = useAuthorName();
  const [nameOverride, setNameOverride] = useState<string | null>(null);
  const yourName = nameOverride ?? storedName;
  const [title, setTitle] = useState(initial.title);
  const [titleTouched, setTitleTouched] = useState(mode !== "variation");
  const titleValue =
    mode === "variation" && !titleTouched && parentTitle
      ? twistTitle(yourName, parentTitle)
      : title;
  const [sourceName, setSourceName] = useState(initial.sourceName);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [servings, setServings] = useState(initial.servings);
  const [prepMinutes, setPrepMinutes] = useState(initial.prepMinutes);
  const [cookMinutes, setCookMinutes] = useState(initial.cookMinutes);
  const [notes, setNotes] = useState(initial.notes);
  const [tags, setTags] = useState(initial.tags);
  const [customTag, setCustomTag] = useState("");
  const [ingredients, setIngredients] = useState<IngredientDraft[]>(
    initial.ingredients.length ? initial.ingredients.map(fromIngredient) : [blankIngredient()],
  );
  const [steps, setSteps] = useState<StepDraft[]>(
    initial.steps.length
      ? initial.steps.map((step) => ({
          key: crypto.randomUUID(),
          instruction: step.instruction,
          photoPath: step.photoPath,
          photoUrl: step.photoUrl,
          file: null,
        }))
      : [{ key: crypto.randomUUID(), instruction: "", photoPath: null, photoUrl: null, file: null }],
  );
  const [heroPath, setHeroPath] = useState(initial.heroPath);
  const [heroUrl, setHeroUrl] = useState(initial.heroUrl);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [cardPath, setCardPath] = useState(initial.cardPath);
  const [cardUrl, setCardUrl] = useState(initial.cardUrl);
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const groups = new Map<string, Category[]>();
  for (const category of categories) {
    const list = groups.get(category.groupName) ?? [];
    list.push(category);
    groups.set(category.groupName, list);
  }

  function updateName(value: string) {
    setNameOverride(value);
  }

  function applyLine(index: number, line: string) {
    const parsed = parseIngredientLine(line);
    setIngredients((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              line,
              quantity: parsed.quantity == null ? "" : String(parsed.quantity),
              unit: parsed.unit ?? "",
              item: parsed.item,
            }
          : row,
      ),
    );
  }

  async function pick(file: File | undefined) {
    if (!file) return null;
    return compressImage(file);
  }

  async function onSubmit(incoming: FormData) {
    setLocalError(null);
    if (String(incoming.get("company") ?? "").trim()) {
      setLocalError("That did not save. Try again in a moment.");
      return;
    }
    setBusy(true);
    try {
      if (yourName.trim()) rememberAuthor(yourName.trim());
      const readyIngredients = ingredients
        .map((row) => {
          if (!row.item.trim() && row.line.trim()) {
            const parsed = parseIngredientLine(row.line);
            return { ...row, quantity: parsed.quantity == null ? "" : String(parsed.quantity), unit: parsed.unit ?? "", item: parsed.item };
          }
          return row;
        })
        .filter((row) => row.item.trim());
      const readySteps = steps.filter((step) => step.instruction.trim());
      const formData = new FormData();
      formData.set("mode", mode);
      formData.set("id", recipeId ?? "");
      formData.set("parentId", parentId ?? "");
      formData.set("yourName", yourName);
      formData.set("title", titleValue);
      formData.set("sourceName", sourceName);
      formData.set("categoryId", categoryId);
      formData.set("servings", servings);
      formData.set("prepMinutes", prepMinutes);
      formData.set("cookMinutes", cookMinutes);
      formData.set("notes", notes);
      formData.set("company", "");
      formData.set(
        "tags",
        JSON.stringify(tags.map((tag) => tag.trim()).filter(Boolean)),
      );
      const ingredientPayload = [];
      for (const row of readyIngredients) {
        if (row.quantity.trim()) {
          const amount = parseQuantity(row.quantity);
          if (amount == null || amount < 0) {
            setLocalError("Check the ingredient amounts.");
            setBusy(false);
            return;
          }
          ingredientPayload.push({ quantity: amount, unit: row.unit, item: row.item, note: row.note });
        } else {
          ingredientPayload.push({ quantity: null, unit: row.unit, item: row.item, note: row.note });
        }
      }
      formData.set("ingredients", JSON.stringify(ingredientPayload));
      formData.set(
        "steps",
        JSON.stringify(
          readySteps.map((step) => ({
            instruction: step.instruction,
            photoPath: step.photoPath,
          })),
        ),
      );
      formData.set("heroPath", heroPath ?? "");
      formData.set("cardPath", cardPath ?? "");
      if (heroFile) formData.set("hero", heroFile);
      if (cardFile) formData.set("card", cardFile);
      readySteps.forEach((step, index) => {
        if (step.file) formData.set(`stepPhoto-${index}`, step.file);
      });
      const total = [...formData.values()].reduce((sum, value) => {
        return sum + (value instanceof File ? value.size : 0);
      }, 0);
      if (total > 3_500_000) {
        setLocalError("Those photos are too big together. Remove one and try again.");
        setBusy(false);
        return;
      }
      await formAction(formData);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "That photo could not be read.");
    } finally {
      setBusy(false);
    }
  }

  const working = busy || pending;

  return (
    <form
      action={onSubmit}
      className="flex flex-col gap-6"
    >
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {mode === "edit" && initial.authorName ? (
        <p className="text-sm text-muted-foreground">Added by {initial.authorName}</p>
      ) : null}
      <div className="flex flex-col gap-2">
        <Label htmlFor="yourName">Your name</Label>
        <Input
          id="yourName"
          value={yourName}
          onChange={(event) => updateName(event.target.value)}
          required
          autoComplete="name"
          maxLength={80}
        />
        <p className="text-sm text-muted-foreground">
          {mode === "edit"
            ? "Saved on this edit so the history shows who changed it. Remembered on this phone."
            : "Shown as Added by. Remembered on this phone."}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={titleValue}
          onChange={(event) => {
            setTitleTouched(true);
            setTitle(event.target.value);
          }}
          required
          maxLength={200}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="sourceName">Who it&apos;s from</Label>
        <Input
          id="sourceName"
          value={sourceName}
          onChange={(event) => setSourceName(event.target.value)}
          placeholder="Grandma Cox"
          maxLength={120}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="categoryId">Category</Label>
          <select
            id="categoryId"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            required
            className="h-12 rounded-2xl border border-input bg-card px-4 text-base"
          >
            <option value="">Choose one</option>
            {[...groups.entries()].map(([group, items]) => (
              <optgroup key={group} label={group}>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name === group ? item.name : item.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="servings">Servings this recipe makes</Label>
          <Input
            id="servings"
            inputMode="numeric"
            value={servings}
            onChange={(event) => setServings(event.target.value)}
            required
            min={1}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="prepMinutes">Prep minutes</Label>
          <Input
            id="prepMinutes"
            inputMode="numeric"
            value={prepMinutes}
            onChange={(event) => setPrepMinutes(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cookMinutes">Cook minutes</Label>
          <Input
            id="cookMinutes"
            inputMode="numeric"
            value={cookMinutes}
            onChange={(event) => setCookMinutes(event.target.value)}
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold">Ingredients</legend>
        <p className="text-sm text-muted-foreground">
          Type a line like 1 1/2 cups flour. Leave the amount off for salt to taste.
        </p>
        {ingredients.map((row, index) => (
          <div key={row.key} className="rounded-3xl bg-card p-4 ring-1 ring-foreground/10">
            <Label htmlFor={`line-${row.key}`} className="sr-only">
              Ingredient line {index + 1}
            </Label>
            <Input
              id={`line-${row.key}`}
              value={row.line}
              placeholder="1 1/2 cups flour"
              onChange={(event) =>
                setIngredients((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, line: event.target.value } : item,
                  ),
                )
              }
              onBlur={(event) => applyLine(index, event.target.value)}
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Input
                aria-label={`Amount ${index + 1}`}
                value={row.quantity}
                placeholder="Amount"
                onChange={(event) =>
                  setIngredients((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, quantity: event.target.value } : item,
                    ),
                  )
                }
                onBlur={() => {
                  const amount = parseQuantity(row.quantity);
                  if (amount == null) return;
                  const next = formatQuantity(amount);
                  const unit = unitLabel(row.unit, amount) ?? row.unit;
                  setIngredients((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index
                        ? {
                            ...item,
                            quantity: String(amount),
                            line: [next, unit, item.item].filter(Boolean).join(" "),
                          }
                        : item,
                    ),
                  );
                }}
              />
              <Input
                aria-label={`Unit ${index + 1}`}
                value={row.unit}
                placeholder="Unit"
                list="units"
                onChange={(event) =>
                  setIngredients((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, unit: event.target.value } : item,
                    ),
                  )
                }
              />
            </div>
            <Input
              aria-label={`Ingredient ${index + 1}`}
              className="mt-2"
              value={row.item}
              placeholder="Ingredient"
              onChange={(event) =>
                setIngredients((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, item: event.target.value } : item,
                  ),
                )
              }
            />
            <Input
              aria-label={`Note ${index + 1}`}
              className="mt-2"
              value={row.note}
              placeholder="Note, optional"
              onChange={(event) =>
                setIngredients((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, note: event.target.value } : item,
                  ),
                )
              }
            />
            {ingredients.length > 1 ? (
              <button
                type="button"
                className="mt-2 text-sm font-semibold text-destructive"
                onClick={() => setIngredients((current) => current.filter((_, itemIndex) => itemIndex !== index))}
              >
                Remove
              </button>
            ) : null}
          </div>
        ))}
        <datalist id="units">
          {UNITS.map((unit) => (
            <option key={unit} value={unit} />
          ))}
        </datalist>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIngredients((current) => [...current, blankIngredient()])}
        >
          Add ingredient
        </Button>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold">Steps</legend>
        {steps.map((step, index) => (
          <div key={step.key} className="rounded-3xl bg-card p-4 ring-1 ring-foreground/10">
            <Label htmlFor={`step-${step.key}`}>Step {index + 1}</Label>
            <Textarea
              id={`step-${step.key}`}
              className="mt-2"
              value={step.instruction}
              onChange={(event) =>
                setSteps((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, instruction: event.target.value } : item,
                  ),
                )
              }
            />
            {step.photoUrl && !step.file ? (
              // Existing photos are already hosted; a plain img avoids configuring every preview URL.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={step.photoUrl} alt="" className="mt-3 aspect-[4/3] w-full rounded-2xl object-cover" />
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="text-sm font-semibold text-primary">
                {step.photoPath || step.file ? "Change step photo" : "Add step photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    void pick(file)
                      .then((compressed) => {
                        if (!compressed) return;
                        setSteps((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, file: compressed } : item,
                          ),
                        );
                      })
                      .catch((error: unknown) =>
                        setLocalError(error instanceof Error ? error.message : "That photo could not be read."),
                      );
                  }}
                />
              </label>
              {step.photoPath ? (
                <button
                  type="button"
                  className="text-sm font-semibold"
                  onClick={() =>
                    setSteps((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, photoPath: null, photoUrl: null, file: null } : item,
                      ),
                    )
                  }
                >
                  Remove photo
                </button>
              ) : null}
            </div>
            {steps.length > 1 ? (
              <button
                type="button"
                className="mt-2 text-sm font-semibold text-destructive"
                onClick={() => setSteps((current) => current.filter((_, itemIndex) => itemIndex !== index))}
              >
                Remove step
              </button>
            ) : null}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setSteps((current) => [
              ...current,
              { key: crypto.randomUUID(), instruction: "", photoPath: null, photoUrl: null, file: null },
            ])
          }
        >
          Add step
        </Button>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Story or notes</Label>
        <Textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">Tags</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {SUGGESTED_TAGS.map((tag) => {
            const on = tags.some((item) => item.toLowerCase() === tag.toLowerCase());
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setTags((current) =>
                    on
                      ? current.filter((item) => item.toLowerCase() !== tag.toLowerCase())
                      : [...current, tag],
                  )
                }
                className={`rounded-full px-3 py-2 text-sm ${on ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
              >
                {tag}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={customTag}
            onChange={(event) => setCustomTag(event.target.value)}
            placeholder="Add another tag"
            aria-label="Add another tag"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const next = customTag.trim();
              if (!next) return;
              setTags((current) =>
                current.some((tag) => tag.toLowerCase() === next.toLowerCase()) ? current : [...current, next],
              );
              setCustomTag("");
            }}
          >
            Add
          </Button>
        </div>
      </fieldset>

      <PhotoField
        label="Finished dish photo"
        url={heroFile ? null : heroUrl}
        onFile={(file) => {
          setHeroFile(file);
        }}
        onRemove={() => {
          setHeroFile(null);
          setHeroPath(null);
          setHeroUrl(null);
        }}
        hasPhoto={Boolean(heroPath || heroFile)}
      />
      <PhotoField
        label="Handwritten card"
        url={cardFile ? null : cardUrl}
        onFile={setCardFile}
        onRemove={() => {
          setCardFile(null);
          setCardPath(null);
          setCardUrl(null);
        }}
        hasPhoto={Boolean(cardPath || cardFile)}
      />

      {localError || state?.error ? (
        <p className="text-sm text-destructive" role="alert">
          {localError || state?.error}
        </p>
      ) : null}
      <Button type="submit" disabled={working}>
        {working ? "Saving…" : mode === "variation" ? "Save this twist" : "Save recipe"}
      </Button>
    </form>
  );
}

function PhotoField({
  label,
  url,
  hasPhoto,
  onFile,
  onRemove,
}: {
  label: string;
  url: string | null;
  hasPhoto: boolean;
  onFile: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold">{label}</p>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="aspect-[4/3] w-full rounded-3xl object-cover" />
      ) : null}
      <div className="flex flex-wrap gap-3">
        <label className="text-sm font-semibold text-primary">
          {hasPhoto ? "Change photo" : "Add photo"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void compressImage(file).then(onFile).catch((error: unknown) => {
                window.alert(error instanceof Error ? error.message : "That photo could not be read.");
              });
            }}
          />
        </label>
        {hasPhoto ? (
          <button type="button" className="text-sm font-semibold" onClick={onRemove}>
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}
