import { FavoriteGroups } from "@/components/favorite-groups";
import { SetupNotice } from "@/components/setup-notice";
import { listVisibleSummaries } from "@/lib/recipes";

export const metadata = { title: "Saved" };

export default async function FavoritesPage() {
  const result = await listVisibleSummaries();
  if (!result.configured) return <SetupNotice />;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl">Saved on this phone</h1>
        <p className="mt-2 text-muted-foreground">Hearts stay on this device. They are not shared.</p>
      </div>
      {"error" in result && result.error ? <p className="text-destructive">{result.error}</p> : null}
      <FavoriteGroups recipes={result.recipes} />
    </div>
  );
}
