import Link from "next/link";
import { RestoreButton } from "@/components/recipe-actions";
import { SetupNotice } from "@/components/setup-notice";
import { listDeleted } from "@/lib/recipes";
import { daysLeftInBin, formatDate } from "@/lib/utils";

export const metadata = { title: "Recently deleted" };

export default async function DeletedPage() {
  const result = await listDeleted();
  if (!result.configured) return <SetupNotice />;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl">Recently deleted</h1>
        <p className="mt-2 text-muted-foreground">
          Recipes deleted in the last 30 days can be put back. Twists of a removed recipe stay in the cookbook.
        </p>
      </div>
      {result.error ? <p className="text-destructive">{result.error}</p> : null}
      {result.recipes.length ? (
        <ul className="flex flex-col gap-4">
          {result.recipes.map((recipe) => (
            <li key={recipe.id} className="rounded-3xl bg-card p-4 ring-1 ring-foreground/10">
              <Link href={`/recipes/${recipe.id}`} className="font-heading text-2xl">
                {recipe.title}
              </Link>
              <p className="text-sm text-muted-foreground">
                Added by {recipe.authorName}
                {recipe.deletedAt ? ` · Deleted ${formatDate(recipe.deletedAt)} · ${daysLeftInBin(recipe.deletedAt)} days left` : ""}
              </p>
              <div className="mt-3">
                <RestoreButton recipeId={recipe.id} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">The bin is empty.</p>
      )}
    </div>
  );
}
