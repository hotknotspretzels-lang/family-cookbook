# Family Cookbook

A private, shareable recipe book for one family. Anyone with the link can read, search, cook, add, edit, and delete. There is no login. The link is the only lock, so do not post it in public.

Safety is recoverability, not a password:

- Deletes are soft. **Recently deleted** keeps a recipe for 30 days and can put it back.
- Every edit stores the previous version. **History** on a recipe can restore it.
- Edit and delete ask you to leave the original alone unless you wrote it, and to add a variation instead.

Twists are full recipes nested under the original. Scaling changes ingredient amounts from the recipe’s base servings. Favorites stay on the phone that saved them.

The app is a [Next.js](https://nextjs.org) App Router project (React 19, TypeScript, Tailwind 4, shadcn/ui) meant for Vercel, with Supabase for the database and photos. It follows the same general shape as the Hot Knots app: Node 24, a public manifest, home-screen icons, and a service worker that does not cache anything.

## What you need

- A new, empty Supabase project
- A Vercel project (Hobby is enough)
- Node.js 24

## 1. Create the Supabase project

Create a project in the [Supabase dashboard](https://supabase.com/dashboard). You do not turn on Auth, and you do not set redirect URLs. The cookbook does not use Supabase Auth.

In the SQL editor, run these files **in order**:

1. `supabase/migrations/20261125120000_schema.sql`
2. `supabase/migrations/20261125120001_storage.sql`
3. `supabase/migrations/20261125120002_sample_recipe.sql`

The third file is optional. It adds three clearly labeled sample recipes, including one variation, so the shelves are not empty. They are not family recipes. Delete them in the app whenever you want.

The SQL editor is enough. The Supabase CLI can apply the same files with `supabase db push` after you link the project. This repo does not include a `config.toml`; run `supabase init` first if the CLI asks for one, and keep the `supabase/migrations` folder.

That creates:

- `categories`, with the groups and subcategories in the sidebar. Add a row later if you want another category.
- `recipes`, `recipe_ingredients`, `recipe_steps`, `recipe_revisions`
- Public read policies. Anonymous clients cannot insert, update, or delete.
- A public `recipe-photos` bucket. Anyone can view a photo URL. Only the server can upload.

## 2. Environment variables

Copy `.env.example` to `.env.local` for local dev, and set the same values in Vercel. Mark the service role key as a server secret. Do not prefix it with `NEXT_PUBLIC_`.

| Name | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server | Project URL, also used in photo links |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and server | Read recipes. RLS blocks writes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Add, edit, delete, restore, and upload photos |

There is no passcode and no auth key.

From the Supabase dashboard: **Project Settings → API**. Use the project URL, the `anon` `public` key, and the `service_role` secret.

## 3. Run it locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `npm run build` and `npm run lint` should pass before you deploy.

Photos are resized in the browser to about 1600 pixels on the long edge before upload, which also drops location data stored in the file.

## 4. Deploy on Vercel

1. Push this repo (it may be renamed to `family-cookbook`) and import it as a Vercel project.
2. Set the framework to Next.js and Node.js to 24.
3. Add the three environment variables.
4. Deploy.
5. In Vercel, add the domain `family-cookbook.vercel.app` (or whatever domain you use).

The site asks search engines not to index it. That does not hide it from someone who has the link.

## How the kitchen works

- **Search** covers the title, ingredients, tags, who added it, and who the recipe is from.
- **Categories** are one primary category per recipe. Tags cover the crossovers (Holiday, Thanksgiving, and the other suggested chips).
- **Servings** are required. The − / + control scales every quantity that has a number. “Salt to taste” stays as written. Amounts snap to 1/8, 1/4, 1/3, 1/2, 2/3, and 3/4 when they are close.
- **Your name** is required when you add a recipe or a twist, and when you restore an older version. The phone remembers it.
- **Add your twist** copies a recipe under the original. A twist cannot have its own twist.
- **Edit** asks you to confirm you are the original poster, or to make a variation instead.
- **Delete** asks the same, then requires the word `DELETE`. The recipe moves to Recently deleted for 30 days.
- **History** is the full recipe as it was before each edit.
- **Cook** uses large type, checkboxes, the serving scaler, and keeps the screen awake when the phone allows it.
- **Saved** hearts live in this browser only.

To add a category later:

```sql
insert into public.categories (id, group_name, name, group_sort, sort_order)
values ('stews', 'Soups, Stews & Chili', 'Stews', 30, 20);
```

`id` is a short slug. `group_name` is the sidebar heading. Use the same `group_name` as an existing group to nest it there.

## Supabase auth settings

None. Leave Auth unused. Do not add a site URL or redirect URL for this app.
