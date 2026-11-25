import { notFound, redirect } from "next/navigation";
import { RecipeForm } from "@/components/recipe-form";
import { getCategories, getRecipe } from "@/lib/recipes";
import { twistTitle } from "@/lib/utils";

export default async function VariationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [result, categories] = await Promise.all([getRecipe(id), getCategories()]);
  if (!result.recipe || result.recipe.deletedAt) notFound();
  if (result.recipe.parentId) redirect(`/recipes/${result.recipe.parentId}/variation`);
  const recipe = result.recipe;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl">Add your twist</h1>
        <p className="mt-2 text-muted-foreground">
          This becomes its own recipe, kept with {recipe.title}.
        </p>
      </div>
      <RecipeForm
        mode="variation"
        parentId={recipe.id}
        parentTitle={recipe.title}
        categories={categories}
        initial={{
          title: twistTitle("", recipe.title),
          sourceName: recipe.sourceName ?? "",
          categoryId: recipe.categoryId,
          servings: String(recipe.servings),
          prepMinutes: recipe.prepMinutes?.toString() ?? "",
          cookMinutes: recipe.cookMinutes?.toString() ?? "",
          notes: recipe.notes ?? "",
          tags: recipe.tags.filter((tag) => tag !== "sample"),
          ingredients: recipe.ingredients,
          steps: recipe.steps.map((step) => ({
            instruction: step.instruction,
            photoPath: step.photoPath,
            photoUrl: step.photoUrl,
          })),
          heroPath: recipe.heroPath,
          heroUrl: recipe.heroUrl,
          cardPath: recipe.cardPath,
          cardUrl: recipe.cardUrl,
        }}
      />
    </div>
  );
}
