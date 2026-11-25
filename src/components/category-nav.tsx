"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { NavGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CategoryNav({
  groups,
  onNavigate,
}: {
  groups: NavGroup[];
  onNavigate?: () => void;
}) {
  const params = useSearchParams();
  const active = params.get("category");

  return (
    <nav aria-label="Categories" className="flex flex-col gap-4">
      <Link
        href="/recipes"
        onClick={onNavigate}
        className={cn(
          "rounded-2xl px-3 py-2 text-sm font-semibold",
          !active && "bg-accent",
        )}
      >
        All recipes
      </Link>
      {groups.map((group) =>
        group.single ? (
          <Link
            key={group.name}
            href={`/recipes?category=${group.items[0]?.id}`}
            onClick={onNavigate}
            aria-current={active === group.items[0]?.id ? "page" : undefined}
            className={cn(
              "flex items-center justify-between gap-3 rounded-2xl px-3 py-2 text-sm",
              active === group.items[0]?.id && "bg-accent font-semibold",
            )}
          >
            <span>{group.name}</span>
            <span className="text-muted-foreground">{group.items[0]?.count ?? 0}</span>
          </Link>
        ) : (
          <div key={group.name} className="flex flex-col gap-1">
            <p className="px-3 pt-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {group.name}
            </p>
            {group.items.map((item) => (
              <Link
                key={item.id}
                href={`/recipes?category=${item.id}`}
                onClick={onNavigate}
                aria-current={active === item.id ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-2xl px-3 py-2 text-sm",
                  active === item.id && "bg-accent font-semibold",
                )}
              >
                <span>{item.name}</span>
                <span className="text-muted-foreground">{item.count}</span>
              </Link>
            ))}
          </div>
        ),
      )}
      <Link
        href="/deleted"
        onClick={onNavigate}
        className="px-3 py-2 text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        Recently deleted
      </Link>
    </nav>
  );
}
