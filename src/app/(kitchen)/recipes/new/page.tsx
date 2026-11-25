import { RecipeForm } from "@/components/recipe-form";
import { SetupNotice } from "@/components/setup-notice";
import { getCategories } from "@/lib/recipes";
import { isSupabaseConfigured } from "@/lib/supabase/public";

export default async function NewRecipePage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const categories = await getCategories();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-4xl">Add a recipe</h1>
      <RecipeForm
        mode="create"
        categories={categories}
        initial={{
          title: "",
          sourceName: "",
          categoryId: "",
          servings: "4",
          prepMinutes: "",
          cookMinutes: "",
          notes: "",
          tags: [],
          ingredients: [],
          steps: [],
          heroPath: null,
          heroUrl: null,
          cardPath: null,
          cardUrl: null,
        }}
      />
    </div>
  );
}
