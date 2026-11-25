import type { ReactNode } from "react";
import { Shell } from "@/components/shell";
import { getCategoryNav } from "@/lib/recipes";

export const dynamic = "force-dynamic";

export default async function KitchenLayout({ children }: { children: ReactNode }) {
  const nav = await getCategoryNav();
  return <Shell nav={nav}>{children}</Shell>;
}
