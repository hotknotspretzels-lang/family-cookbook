"use client";

import { BookOpen, Heart, House, Menu, Plus, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, Suspense, type ReactNode } from "react";
import { CategoryNav } from "@/components/category-nav";
import { CookbookMark } from "@/components/cookbook-mark";
import { SearchBox } from "@/components/search-box";
import type { NavGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home", icon: House },
  { href: "/recipes", label: "Recipes", icon: BookOpen },
  { href: "/favorites", label: "Saved", icon: Heart },
  { href: "/recipes/new", label: "Add", icon: Plus },
];

export function Shell({
  nav,
  children,
}: {
  nav: NavGroup[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-dvh">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-card focus:px-4 focus:py-2"
      >
        Skip to recipes
      </a>
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <CookbookMark className="size-11" />
              <span className="font-heading text-2xl leading-none">Family Cookbook</span>
            </Link>
          </div>
          <SearchBox />
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl gap-8 px-4">
        <aside className={cn("hidden shrink-0 py-6 md:block", collapsed ? "w-12" : "w-64")}>
          <button
            type="button"
            className="mb-3 text-sm font-semibold text-muted-foreground"
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? "Show" : "Hide categories"}
          </button>
          {collapsed ? null : (
            <Suspense fallback={<p className="text-sm text-muted-foreground">Categories</p>}>
              <CategoryNav groups={nav} />
            </Suspense>
          )}
        </aside>
        <main id="content" className="min-w-0 flex-1 py-6 pb-28">
          {children}
        </main>
      </div>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {links.slice(0, 2).map((link) => (
            <li key={link.href}>
              <NavLink {...link} pathname={pathname} />
            </li>
          ))}
          <li>
            <button
              type="button"
              className="flex h-16 w-full flex-col items-center justify-center gap-1 text-xs font-semibold"
              onClick={() => setDrawer(true)}
            >
              <Menu className="size-5" />
              Categories
            </button>
          </li>
          {links.slice(2).map((link) => (
            <li key={link.href}>
              <NavLink {...link} pathname={pathname} />
            </li>
          ))}
        </ul>
      </nav>
      {drawer ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close categories"
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setDrawer(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(22rem,88vw)] flex-col bg-background p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-heading text-2xl">Categories</p>
              <button type="button" aria-label="Close" onClick={() => setDrawer(false)} className="size-11">
                <X className="size-5" />
              </button>
            </div>
            <div className="overflow-y-auto pb-8">
              <Suspense fallback={null}>
                <CategoryNav groups={nav} onNavigate={() => setDrawer(false)} />
              </Suspense>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: typeof House;
  pathname: string;
}) {
  const active =
    href === "/"
      ? pathname === "/"
      : href === "/recipes"
        ? pathname === "/recipes" || (pathname.startsWith("/recipes/") && !pathname.endsWith("/new"))
        : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  );
}
