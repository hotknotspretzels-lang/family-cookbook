import Link from "next/link";
import { notFound } from "next/navigation";
import { CookView } from "@/components/cook-view";
import { getRecipe } from "@/lib/recipes";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getRecipe(id);
  return { title: result.recipe ? `Cook ${result.recipe.title}` : "Cook" };
}

export default async function CookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getRecipe(id);
  if (!result.recipe || result.recipe.deletedAt) notFound();
  const recipe = result.recipe;
  return (
    <div>
      <div className="px-4 pt-4">
        <Link href={`/recipes/${recipe.id}`} className="text-sm font-semibold text-primary">
          Back to the recipe
        </Link>
      </div>
      <CookView
        recipeId={recipe.id}
        title={recipe.title}
        base={recipe.servings}
        ingredients={recipe.ingredients}
        steps={recipe.steps}
      />
    </div>
  );
}
