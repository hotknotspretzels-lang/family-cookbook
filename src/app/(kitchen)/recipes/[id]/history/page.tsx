import Link from "next/link";
import { notFound } from "next/navigation";
import { HistoryList } from "@/components/history-list";
import { getRecipe, listRevisions } from "@/lib/recipes";

export default async function HistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getRecipe(id);
  if (!result.recipe) notFound();
  const revisions = await listRevisions(id);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/recipes/${id}`} className="text-sm font-semibold text-primary">
          Back to {result.recipe.title}
        </Link>
        <h1 className="mt-2 text-4xl">History</h1>
        <p className="mt-2 text-muted-foreground">
          Each edit keeps the previous version. Restoring saves what is there now, then puts the older one back.
        </p>
      </div>
      <HistoryList recipeId={id} revisions={revisions} />
    </div>
  );
}
