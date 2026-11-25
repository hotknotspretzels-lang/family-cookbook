import Image from "next/image";
import Link from "next/link";
import { FavoriteButton } from "@/components/favorite-button";
import { Badge } from "@/components/ui/badge";
import type { RecipeSummary } from "@/lib/types";
import { cn, formatMinutes } from "@/lib/utils";

export function RecipeCard({
  recipe,
  nested = false,
}: {
  recipe: RecipeSummary;
  nested?: boolean;
}) {
  const time = [formatMinutes(recipe.prepMinutes), formatMinutes(recipe.cookMinutes)]
    .filter(Boolean)
    .join(" + ");
  const sample = recipe.tags.includes("sample") || recipe.title.startsWith("Sample:");

  return (
    <article className={cn("relative", nested && "ml-3 border-l-2 border-primary/30 pl-3 sm:ml-8")}>
      <FavoriteButton id={recipe.id} className="absolute top-3 right-3 z-10" />
      <Link href={`/recipes/${recipe.id}`} className="block overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/10">
        <div className="relative aspect-[4/3] bg-secondary">
          {recipe.heroUrl ? (
            <Image
              src={recipe.heroUrl}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 480px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-end p-4">
              <p className="font-heading text-2xl text-primary/80">{recipe.categoryName}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 px-4 py-3 pr-14">
          {nested ? <p className="text-xs font-semibold tracking-wide text-primary uppercase">Twist</p> : null}
          <h2 className="font-heading text-xl leading-snug">{recipe.title}</h2>
          <p className="text-sm text-muted-foreground">Added by {recipe.authorName}</p>
          <p className="text-sm text-muted-foreground">
            {recipe.categoryName}
            {time ? ` · ${time}` : ""}
            {` · ${recipe.servings} servings`}
          </p>
          {sample ? (
            <Badge className="mt-1 w-fit" variant="outline">
              Sample
            </Badge>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
