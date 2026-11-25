"use client";

import { restoreDeletedRecipe, softDeleteRecipe } from "@/app/actions/recipes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

export function EditChoice({
  recipeId,
  authorName,
  canVary,
}: {
  recipeId: string;
  authorName: string;
  canVary: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <Button type="button" variant="outline" onClick={() => dialog.current?.showModal()}>
        Edit
      </Button>
      <dialog
        ref={dialog}
        className="w-[min(28rem,calc(100%-2rem))] rounded-3xl bg-card p-6 text-foreground shadow-xl backdrop:bg-foreground/40"
      >
        <h2 className="font-heading text-2xl">Edit this recipe?</h2>
        <p className="mt-3 text-base leading-relaxed">
          Please only edit this recipe if you are the original poster ({authorName}). If you want to
          change it your way, create a variation instead.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          {canVary ? (
            <Link
              href={`/recipes/${recipeId}/variation`}
              className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-5 font-semibold text-primary-foreground"
            >
              Create a variation
            </Link>
          ) : null}
          <Link
            href={`/recipes/${recipeId}/edit`}
            className="inline-flex h-12 items-center justify-center rounded-full border border-border px-5 font-semibold"
          >
            I&apos;m the original poster, edit
          </Link>
          <Button type="button" variant="ghost" onClick={() => dialog.current?.close()}>
            Cancel
          </Button>
        </div>
      </dialog>
    </>
  );
}

export function DeleteChoice({ recipeId, authorName }: { recipeId: string; authorName: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(softDeleteRecipe, undefined);
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    if (state?.error) dialog.current?.showModal();
  }, [state?.error]);

  return (
    <>
      <Button type="button" variant="destructive" onClick={() => dialog.current?.showModal()}>
        Delete
      </Button>
      <dialog
        ref={dialog}
        className="w-[min(28rem,calc(100%-2rem))] rounded-3xl bg-card p-6 text-foreground shadow-xl backdrop:bg-foreground/40"
        onClose={() => setConfirm("")}
      >
        <h2 className="font-heading text-2xl">Delete this recipe?</h2>
        <p className="mt-3 leading-relaxed">
          Only the original poster ({authorName}) should delete this recipe. Are you sure?
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          It stays in Recently deleted for 30 days, and you can put it back.
        </p>
        <form action={action} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="id" value={recipeId} />
          <label className="text-sm font-semibold" htmlFor={`delete-${recipeId}`}>
            Type DELETE to confirm
          </label>
          <Input
            id={`delete-${recipeId}`}
            name="confirm"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="off"
          />
          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" variant="destructive" disabled={pending || confirm !== "DELETE"}>
            {pending ? "Deleting…" : "Delete recipe"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => dialog.current?.close()}>
            Cancel
          </Button>
        </form>
      </dialog>
    </>
  );
}

export function RestoreButton({ recipeId }: { recipeId: string }) {
  const [state, action, pending] = useActionState(restoreDeletedRecipe, undefined);
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={recipeId} />
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Restoring…" : "Put it back"}
      </Button>
    </form>
  );
}
