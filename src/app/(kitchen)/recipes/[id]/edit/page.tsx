import { notFound } from "next/navigation";
import { RecipeForm } from "@/components/recipe-form";
import { getCategories, getRecipe } from "@/lib/recipes";

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [result, categories] = await Promise.all([getRecipe(id), getCategories()]);
  if (!result.recipe || result.recipe.deletedAt) notFound();
  const recipe = result.recipe;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-4xl">Edit recipe</h1>
      <RecipeForm
        mode="edit"
        recipeId={recipe.id}
        categories={categories}
        initial={{
          title: recipe.title,
          sourceName: recipe.sourceName ?? "",
          categoryId: recipe.categoryId,
          servings: String(recipe.servings),
          prepMinutes: recipe.prepMinutes?.toString() ?? "",
          cookMinutes: recipe.cookMinutes?.toString() ?? "",
          notes: recipe.notes ?? "",
          tags: recipe.tags,
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
          authorName: recipe.authorName,
        }}
      />
    </div>
  );
}
