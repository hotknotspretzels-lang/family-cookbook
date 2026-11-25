import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteChoice, EditChoice, RestoreButton } from "@/components/recipe-actions";
import { FavoriteButton } from "@/components/favorite-button";
import { ScaledIngredients } from "@/components/serving-control";
import { Badge } from "@/components/ui/badge";
import { getRecipe } from "@/lib/recipes";
import { daysLeftInBin, formatDate, formatMinutes } from "@/lib/utils";

const notices: Record<string, string> = {
  type: "The words are saved, but that photo type is not supported. Use a JPEG or PNG.",
  size: "The words are saved, but a photo was too big. Edit the recipe and try a smaller one.",
  upload: "The words are saved, but a photo did not go through. Edit the recipe to try the photo again.",
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getRecipe(id);
  return { title: result.recipe?.title ?? "Recipe" };
}

export default async function RecipePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { id } = await params;
  const { notice } = await searchParams;
  const result = await getRecipe(id);
  if (!result.configured) notFound();
  if (!result.recipe) notFound();
  const recipe = result.recipe;
  const time = [
    recipe.prepMinutes != null ? `${formatMinutes(recipe.prepMinutes)} prep` : null,
    recipe.cookMinutes != null ? `${formatMinutes(recipe.cookMinutes)} cook` : null,
  ].filter(Boolean);
  const noticeText = notice ? notices[notice] : undefined;

  return (
    <article className="flex flex-col gap-6 pb-16">
      {recipe.deletedAt ? (
        <div className="rounded-3xl bg-accent px-4 py-4">
          <p className="font-semibold">This recipe is in the bin.</p>
          <p className="text-sm text-muted-foreground">
            {daysLeftInBin(recipe.deletedAt)} days left to put it back.
          </p>
          <div className="mt-3">
            <RestoreButton recipeId={recipe.id} />
          </div>
        </div>
      ) : null}
      {noticeText ? <p className="rounded-3xl bg-accent px-4 py-3 text-sm">{noticeText}</p> : null}
      {recipe.heroUrl ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
          <Image src={recipe.heroUrl} alt="" fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 720px" />
        </div>
      ) : null}
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-primary">{recipe.categoryName}</p>
          <FavoriteButton id={recipe.id} />
        </div>
        <h1 className="text-4xl leading-tight">{recipe.title}</h1>
        <p className="text-lg">Added by {recipe.authorName}</p>
        {recipe.sourceName ? <p className="text-muted-foreground">From {recipe.sourceName}</p> : null}
        {result.parent ? (
          <p>
            Twist on{" "}
            {result.parent.deletedAt ? (
              <span>a removed recipe ({result.parent.title})</span>
            ) : (
              <Link href={`/recipes/${result.parent.id}`} className="font-semibold text-primary">
                {result.parent.title}
              </Link>
            )}
          </p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          {recipe.servings} servings
          {time.length ? ` · ${time.join(" · ")}` : ""}
        </p>
        {recipe.tags.length ? (
          <div className="flex flex-wrap gap-2">
            {recipe.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        ) : null}
      </header>
      {recipe.notes ? (
        <section className="rounded-3xl bg-accent/70 px-5 py-4">
          <h2 className="text-2xl">The story</h2>
          <p className="mt-2 text-lg leading-relaxed whitespace-pre-wrap">{recipe.notes}</p>
        </section>
      ) : null}
      <ScaledIngredients base={recipe.servings} ingredients={recipe.ingredients} />
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl">Steps</h2>
        <ol className="flex flex-col gap-4">
          {recipe.steps.map((step, index) => (
            <li key={step.id} className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary font-heading">
                {index + 1}
              </span>
              <div className="flex flex-col gap-2">
                <p className="text-lg leading-relaxed">{step.instruction}</p>
                {step.photoUrl ? (
                  <Image
                    src={step.photoUrl}
                    alt={`Step ${index + 1}`}
                    width={800}
                    height={600}
                    className="h-auto w-full rounded-3xl"
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </section>
      {recipe.cardUrl ? (
        <section>
          <h2 className="text-2xl">Original card</h2>
          <Image src={recipe.cardUrl} alt="Handwritten recipe card" width={800} height={1000} className="mt-3 h-auto w-full rounded-3xl" />
        </section>
      ) : null}
      {result.variations.length ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-2xl">Variations</h2>
          <ul className="flex flex-col gap-2">
            {result.variations.map((variation) => (
              <li key={variation.id}>
                <Link href={`/recipes/${variation.id}`} className="font-semibold text-primary">
                  {variation.title}
                </Link>
                <p className="text-sm text-muted-foreground">Added by {variation.authorName}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href={`/recipes/${recipe.id}/cook`}
          className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-5 font-semibold text-primary-foreground"
        >
          Cook this
        </Link>
        {!recipe.deletedAt ? (
          <EditChoice recipeId={recipe.id} authorName={recipe.authorName} canVary={!recipe.parentId} />
        ) : null}
        {!recipe.parentId && !recipe.deletedAt ? (
          <Link
            href={`/recipes/${recipe.id}/variation`}
            className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-card px-5 font-semibold"
          >
            Add your twist
          </Link>
        ) : null}
        <Link href={`/recipes/${recipe.id}/history`} className="inline-flex h-12 items-center justify-center px-2 font-semibold">
          History
        </Link>
        {!recipe.deletedAt ? <DeleteChoice recipeId={recipe.id} authorName={recipe.authorName} /> : null}
      </div>
      <p className="text-sm text-muted-foreground">
        Added {formatDate(recipe.createdAt)}
        {recipe.updatedAt !== recipe.createdAt ? ` · Updated ${formatDate(recipe.updatedAt)}` : ""}
      </p>
    </article>
  );
}
