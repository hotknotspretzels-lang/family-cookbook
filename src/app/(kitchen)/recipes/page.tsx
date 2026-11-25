import { RecipeGroups } from "@/components/recipe-groups";
import { SetupNotice } from "@/components/setup-notice";
import { getCategories, listGroupedRecipes } from "@/lib/recipes";

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const query = q?.trim() ?? "";
  const categories = await getCategories();
  const selected = categories.find((item) => item.id === category);
  const result = await listGroupedRecipes({
    q: query,
    categoryId: selected?.id,
    limit: 200,
  });
  if (!result.configured) return <SetupNotice />;

  const heading = query
    ? `Results for “${query}”`
    : selected
      ? selected.name
      : "All recipes";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl">{heading}</h1>
        {selected && selected.name !== selected.groupName ? (
          <p className="text-muted-foreground">{selected.groupName}</p>
        ) : null}
        <p className="mt-2 text-sm text-muted-foreground">
          Search looks through titles, ingredients, tags, and who added the recipe.
        </p>
      </div>
      {result.error ? <p className="text-destructive">{result.error}</p> : null}
      {result.groups.length ? (
        <RecipeGroups groups={result.groups} />
      ) : (
        <p className="text-lg text-muted-foreground">
          Nothing matches that. Try a shorter word, like biscuit or chicken.
        </p>
      )}
    </div>
  );
}
