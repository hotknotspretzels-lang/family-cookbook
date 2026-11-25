"use client";

import { restoreRevision } from "@/app/actions/recipes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rememberAuthor, useAuthorName } from "@/lib/browser-store";
import type { Revision } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useActionState, useState } from "react";

export function HistoryList({ recipeId, revisions }: { recipeId: string; revisions: Revision[] }) {
  const storedName = useAuthorName();
  const [nameOverride, setNameOverride] = useState<string | null>(null);
  const name = nameOverride ?? storedName;
  const [state, action, pending] = useActionState(restoreRevision, undefined);

  if (!revisions.length) {
    return <p className="text-muted-foreground">No earlier versions yet. The first edit will show up here.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="history-name">Your name</Label>
        <Input
          id="history-name"
          value={name}
          onChange={(event) => setNameOverride(event.target.value)}
          autoComplete="name"
        />
        <p className="text-sm text-muted-foreground">Recorded when you put an older version back.</p>
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <ol className="flex flex-col gap-3">
        {revisions.map((revision) => (
          <li key={revision.id} className="rounded-3xl bg-card p-4 ring-1 ring-foreground/10">
            <p className="font-heading text-xl">{revision.snapshot.title}</p>
            <p className="text-sm text-muted-foreground">
              Saved {formatDate(revision.createdAt)} by {revision.editorName} · {revision.snapshot.servings} servings ·{" "}
              {revision.snapshot.ingredients.length} ingredients
            </p>
            <form
              action={action}
              className="mt-3"
              onSubmit={() => {
                if (name.trim()) rememberAuthor(name.trim());
              }}
            >
              <input type="hidden" name="recipeId" value={recipeId} />
              <input type="hidden" name="revisionId" value={revision.id} />
              <input type="hidden" name="yourName" value={name} />
              <Button type="submit" variant="outline" disabled={pending || !name.trim()}>
                Restore this version
              </Button>
            </form>
          </li>
        ))}
      </ol>
    </div>
  );
}
