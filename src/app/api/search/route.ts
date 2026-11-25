import { searchQuick } from "@/lib/recipes";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  const results = await searchQuick(query);
  return Response.json({ results });
}
