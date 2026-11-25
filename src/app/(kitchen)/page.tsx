import Link from "next/link";
import { RecipeGroups } from "@/components/recipe-groups";
import { SetupNotice } from "@/components/setup-notice";
import { listGroupedRecipes } from "@/lib/recipes";

export default async function HomePage() {
  const result = await listGroupedRecipes({ limit: 40, groupLimit: 6 });
  if (!result.configured) return <SetupNotice />;

  return (
    <div className="flex flex-col gap-8">
      <section>
        <p className="text-sm font-semibold tracking-[0.16em] text-primary uppercase">Our kitchen</p>
        <h1 className="mt-1 text-4xl leading-tight">Recipes we actually make</h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Written down so they stay in the family. Anyone with this link can read, add, and edit.
        </p>
      </section>
      {result.error ? <p className="text-destructive">{result.error}</p> : null}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-2xl">Recently added</h2>
          <Link href="/recipes" className="text-sm font-semibold text-primary">
            See all
          </Link>
        </div>
        {result.groups.length ? (
          <RecipeGroups groups={result.groups} />
        ) : (
          <p className="text-muted-foreground">No recipes yet. Add the first one.</p>
        )}
      </section>
      <p className="text-sm text-muted-foreground">
        On an iPhone, tap Share, then Add to Home Screen.
      </p>
    </div>
  );
}
