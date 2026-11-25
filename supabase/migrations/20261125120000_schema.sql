-- Family Cookbook
-- Anyone with the link can read and (through the app) write. There is no login
-- and no shared passcode. The Next.js server writes with the service role key.
-- Reads use the anon key under RLS. Anonymous clients cannot write.
--
-- Safety is recoverability: soft delete for 30 days, and a revision snapshot
-- before every edit. Favorites stay on each phone (localStorage), not here.
--
-- New Supabase projects do not auto-grant Data API access. Grants below are
-- explicit. RLS still decides which rows a role can see.

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;

-- ============================================================================
-- Categories (group > category). Add a row later to grow the sidebar.
-- ============================================================================

create table public.categories (
  id text primary key,
  group_name text not null,
  name text not null,
  group_sort integer not null,
  sort_order integer not null,
  constraint categories_id_len check (char_length(id) between 1 and 40),
  constraint categories_group_len check (char_length(group_name) between 1 and 80),
  constraint categories_name_len check (char_length(name) between 1 and 80)
);

comment on table public.categories is
  'One row per primary category a recipe can use. group_name is the sidebar heading.';

insert into public.categories (id, group_name, name, group_sort, sort_order) values
  ('breakfast', 'Breakfast & Brunch', 'Breakfast & Brunch', 10, 10),
  ('appetizers', 'Appetizers & Snacks', 'Appetizers & Snacks', 20, 10),
  ('soups', 'Soups, Stews & Chili', 'Soups, Stews & Chili', 30, 10),
  ('salads', 'Salads', 'Salads', 40, 10),
  ('breads', 'Breads & Biscuits', 'Breads & Biscuits', 50, 10),
  ('chicken', 'Main Dishes', 'Chicken & Poultry', 60, 10),
  ('beef', 'Main Dishes', 'Beef', 60, 20),
  ('pork', 'Main Dishes', 'Pork', 60, 30),
  ('seafood', 'Main Dishes', 'Seafood', 60, 40),
  ('meatless', 'Main Dishes', 'Meatless', 60, 50),
  ('casseroles', 'Main Dishes', 'Casseroles', 60, 60),
  ('pasta', 'Main Dishes', 'Pasta', 60, 70),
  ('sides', 'Sides & Vegetables', 'Sides & Vegetables', 70, 10),
  ('sauces', 'Sauces, Dressings & Rubs', 'Sauces, Dressings & Rubs', 80, 10),
  ('cookies', 'Desserts', 'Cookies & Bars', 90, 10),
  ('cakes', 'Desserts', 'Cakes & Cupcakes', 90, 20),
  ('pies', 'Desserts', 'Pies & Cobblers', 90, 30),
  ('candy', 'Desserts', 'Candy & Other Sweets', 90, 40),
  ('drinks', 'Drinks', 'Drinks', 100, 10);

-- ============================================================================
-- Recipes, ingredients, steps, revisions
-- ============================================================================

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  parent_recipe_id uuid references public.recipes (id) on delete set null,
  title text not null,
  author_name text not null,
  source_name text,
  category_id text not null references public.categories (id),
  servings integer not null,
  prep_minutes integer,
  cook_minutes integer,
  notes text,
  tags text[] not null default '{}',
  hero_photo_path text,
  card_photo_path text,
  search_text text not null default '',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recipes_title_len check (char_length(title) between 1 and 200),
  constraint recipes_author_len check (char_length(author_name) between 1 and 80),
  constraint recipes_source_len check (source_name is null or char_length(source_name) between 1 and 120),
  constraint recipes_servings_range check (servings between 1 and 1000),
  constraint recipes_notes_len check (notes is null or char_length(notes) <= 8000),
  constraint recipes_prep_range check (prep_minutes is null or prep_minutes between 0 and 10000),
  constraint recipes_cook_range check (cook_minutes is null or cook_minutes between 0 and 10000),
  constraint recipes_tags_count check (cardinality(tags) <= 20),
  constraint recipes_hero_path_len check (hero_photo_path is null or char_length(hero_photo_path) <= 300),
  constraint recipes_card_path_len check (card_photo_path is null or char_length(card_photo_path) <= 300),
  constraint recipes_not_own_parent check (parent_recipe_id is distinct from id)
);

comment on table public.recipes is
  'Family recipes. deleted_at is a soft delete. parent_recipe_id marks a variation of an original.';
comment on column public.recipes.author_name is
  'Name typed by the person who added the recipe or variation. Shown as Added by.';
comment on column public.recipes.source_name is
  'Who the recipe came from, such as Grandma Cox. Optional.';
comment on column public.recipes.servings is
  'Base servings the ingredient quantities were written for.';
comment on column public.recipes.parent_recipe_id is
  'Set on variations. Variations cannot themselves be parents.';

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  position integer not null,
  quantity numeric(12, 4),
  unit text,
  item text not null,
  note text,
  constraint recipe_ingredients_position_unique unique (recipe_id, position),
  constraint recipe_ingredients_item_len check (char_length(item) between 1 and 300),
  constraint recipe_ingredients_unit_len check (unit is null or char_length(unit) <= 40),
  constraint recipe_ingredients_note_len check (note is null or char_length(note) <= 200),
  constraint recipe_ingredients_quantity_range check (
    quantity is null or (quantity >= 0 and quantity <= 100000)
  )
);

create table public.recipe_steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  position integer not null,
  instruction text not null,
  photo_path text,
  constraint recipe_steps_position_unique unique (recipe_id, position),
  constraint recipe_steps_instruction_len check (char_length(instruction) between 1 and 4000),
  constraint recipe_steps_photo_len check (photo_path is null or char_length(photo_path) <= 300)
);

create table public.recipe_revisions (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  snapshot jsonb not null,
  editor_name text not null,
  created_at timestamptz not null default now(),
  constraint recipe_revisions_editor_len check (char_length(editor_name) between 1 and 80)
);

comment on table public.recipe_revisions is
  'Full recipe JSON taken before an edit or a restore, so a prior version can be put back.';

create index recipes_active_created_idx
  on public.recipes (created_at desc)
  where deleted_at is null;

create index recipes_deleted_idx
  on public.recipes (deleted_at desc)
  where deleted_at is not null;

create index recipes_category_idx
  on public.recipes (category_id)
  where deleted_at is null;

create index recipes_parent_idx
  on public.recipes (parent_recipe_id)
  where parent_recipe_id is not null;

create index recipes_search_text_trgm_idx
  on public.recipes
  using gin (search_text extensions.gin_trgm_ops);

create index recipe_ingredients_recipe_id_idx
  on public.recipe_ingredients (recipe_id);

create index recipe_steps_recipe_id_idx
  on public.recipe_steps (recipe_id);

create index recipe_revisions_recipe_id_idx
  on public.recipe_revisions (recipe_id, created_at desc);

-- ============================================================================
-- Triggers: updated_at, search text, variation rules
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.touch_recipe_search()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  rid uuid;
begin
  if tg_table_name = 'recipes' then
    new.search_text := concat_ws(
      ' ',
      new.title,
      new.author_name,
      coalesce(new.source_name, ''),
      coalesce(new.notes, ''),
      array_to_string(coalesce(new.tags, '{}'::text[]), ' '),
      coalesce((
        select string_agg(concat_ws(' ', i.quantity::text, i.unit, i.item, i.note), ' ')
        from public.recipe_ingredients i
        where i.recipe_id = new.id
      ), '')
    );
    return new;
  end if;

  rid := coalesce(new.recipe_id, old.recipe_id);
  update public.recipes
  set title = title
  where id = rid;
  return coalesce(new, old);
end;
$$;

create or replace function public.recipes_parent_guard()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.parent_recipe_id is null then
    return new;
  end if;

  if new.parent_recipe_id = new.id then
    raise exception 'A recipe cannot be a variation of itself';
  end if;

  if not exists (select 1 from public.recipes p where p.id = new.parent_recipe_id) then
    raise exception 'Original recipe not found';
  end if;

  if exists (
    select 1 from public.recipes p
    where p.id = new.parent_recipe_id
      and p.parent_recipe_id is not null
  ) then
    raise exception 'A variation has to be on the original recipe';
  end if;

  if tg_op = 'UPDATE' and exists (
    select 1 from public.recipes c
    where c.parent_recipe_id = new.id
  ) then
    raise exception 'This recipe already has variations';
  end if;

  return new;
end;
$$;

create trigger recipes_parent_guard
before insert or update of parent_recipe_id on public.recipes
for each row execute function public.recipes_parent_guard();

create trigger recipes_fill_search
before insert or update on public.recipes
for each row execute function public.touch_recipe_search();

create trigger recipes_set_updated_at
before update on public.recipes
for each row execute function public.set_updated_at();

create trigger recipe_ingredients_refresh_search
after insert or update or delete on public.recipe_ingredients
for each row execute function public.touch_recipe_search();

-- ============================================================================
-- Snapshot + save + soft delete. Service role only.
-- ============================================================================

create or replace function public.recipe_snapshot(p_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'title', r.title,
    'author_name', r.author_name,
    'source_name', r.source_name,
    'category_id', r.category_id,
    'servings', r.servings,
    'prep_minutes', r.prep_minutes,
    'cook_minutes', r.cook_minutes,
    'notes', r.notes,
    'tags', to_jsonb(r.tags),
    'hero_photo_path', r.hero_photo_path,
    'card_photo_path', r.card_photo_path,
    'parent_recipe_id', r.parent_recipe_id,
    'ingredients', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'quantity', i.quantity,
          'unit', i.unit,
          'item', i.item,
          'note', i.note
        )
        order by i.position
      )
      from public.recipe_ingredients i
      where i.recipe_id = r.id
    ), '[]'::jsonb),
    'steps', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'instruction', s.instruction,
          'photo_path', s.photo_path
        )
        order by s.position
      )
      from public.recipe_steps s
      where s.recipe_id = r.id
    ), '[]'::jsonb)
  )
  from public.recipes r
  where r.id = p_id;
$$;

create or replace function public.save_recipe(
  p_id uuid,
  p_parent_id uuid,
  p_title text,
  p_author_name text,
  p_source_name text,
  p_category_id text,
  p_servings integer,
  p_prep_minutes integer,
  p_cook_minutes integer,
  p_notes text,
  p_tags text[],
  p_editor_name text,
  p_hero_photo_path text,
  p_card_photo_path text,
  p_ingredients jsonb,
  p_steps jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_id uuid;
  editor_name text;
  author_name text;
  clean_tags text[];
  ingredient_count integer := 0;
  step_count integer := 0;
  step_ids uuid[] := '{}';
  step_id uuid;
  elem jsonb;
  qty numeric;
  parent_deleted timestamptz;
begin
  editor_name := nullif(left(regexp_replace(btrim(coalesce(p_editor_name, '')), '[[:space:]]+', ' ', 'g'), 80), '');
  if editor_name is null then
    raise exception 'Add your name';
  end if;
  if p_title is null or btrim(p_title) = '' then
    raise exception 'Add a title';
  end if;
  if char_length(btrim(p_title)) > 200 then
    raise exception 'The title is too long';
  end if;
  if p_source_name is not null and char_length(btrim(p_source_name)) > 120 then
    raise exception 'Who it is from is too long';
  end if;
  if p_notes is not null and char_length(p_notes) > 8000 then
    raise exception 'The story is too long';
  end if;
  if p_servings is null or p_servings < 1 or p_servings > 1000 then
    raise exception 'Servings has to be at least 1';
  end if;
  if p_prep_minutes is not null and (p_prep_minutes < 0 or p_prep_minutes > 10000) then
    raise exception 'Prep time looks off';
  end if;
  if p_cook_minutes is not null and (p_cook_minutes < 0 or p_cook_minutes > 10000) then
    raise exception 'Cook time looks off';
  end if;
  if not exists (select 1 from public.categories c where c.id = p_category_id) then
    raise exception 'Pick a category';
  end if;
  if jsonb_typeof(coalesce(p_ingredients, '[]'::jsonb)) <> 'array'
    or jsonb_array_length(coalesce(p_ingredients, '[]'::jsonb)) > 80 then
    raise exception 'That is a lot of ingredient lines';
  end if;
  if jsonb_typeof(coalesce(p_steps, '[]'::jsonb)) <> 'array'
    or jsonb_array_length(coalesce(p_steps, '[]'::jsonb)) > 40 then
    raise exception 'That is a lot of steps';
  end if;
  if p_hero_photo_path is not null and p_hero_photo_path !~ '^recipes/[A-Za-z0-9._/-]+\.(jpg|jpeg|png|webp|gif)$' then
    raise exception 'Photo path looks wrong';
  end if;
  if p_card_photo_path is not null and p_card_photo_path !~ '^recipes/[A-Za-z0-9._/-]+\.(jpg|jpeg|png|webp|gif)$' then
    raise exception 'Photo path looks wrong';
  end if;

  select coalesce(array_agg(tag order by tag), '{}'::text[])
  into clean_tags
  from (
    select distinct on (lower(left(btrim(tag), 40))) left(btrim(tag), 40) as tag
    from unnest(coalesce(p_tags, '{}'::text[])) as tag
    where btrim(tag) <> ''
    order by lower(left(btrim(tag), 40))
    limit 20
  ) tags;

  if p_id is null then
    author_name := nullif(left(regexp_replace(btrim(coalesce(p_author_name, '')), '[[:space:]]+', ' ', 'g'), 80), '');
    if author_name is null then
      raise exception 'Add your name';
    end if;

    if p_parent_id is not null then
      select deleted_at into parent_deleted
      from public.recipes
      where id = p_parent_id;
      if not found then
        raise exception 'Original recipe not found';
      end if;
      if parent_deleted is not null then
        raise exception 'That recipe is in the bin. Restore it before adding a twist.';
      end if;
    end if;

    insert into public.recipes (
      parent_recipe_id, title, author_name, source_name, category_id, servings,
      prep_minutes, cook_minutes, notes, tags, hero_photo_path, card_photo_path
    )
    values (
      p_parent_id,
      btrim(p_title),
      author_name,
      nullif(btrim(coalesce(p_source_name, '')), ''),
      p_category_id,
      p_servings,
      p_prep_minutes,
      p_cook_minutes,
      nullif(btrim(coalesce(p_notes, '')), ''),
      clean_tags,
      p_hero_photo_path,
      p_card_photo_path
    )
    returning id into new_id;
  else
    if not exists (select 1 from public.recipes r where r.id = p_id) then
      raise exception 'Recipe not found';
    end if;

    insert into public.recipe_revisions (recipe_id, snapshot, editor_name)
    values (p_id, public.recipe_snapshot(p_id), editor_name);

    update public.recipes
    set
      title = btrim(p_title),
      source_name = nullif(btrim(coalesce(p_source_name, '')), ''),
      category_id = p_category_id,
      servings = p_servings,
      prep_minutes = p_prep_minutes,
      cook_minutes = p_cook_minutes,
      notes = nullif(btrim(coalesce(p_notes, '')), ''),
      tags = clean_tags,
      hero_photo_path = p_hero_photo_path,
      card_photo_path = p_card_photo_path
    where id = p_id
    returning id into new_id;

    delete from public.recipe_ingredients where recipe_id = new_id;
    delete from public.recipe_steps where recipe_id = new_id;
  end if;

  for elem in
    select value from jsonb_array_elements(coalesce(p_ingredients, '[]'::jsonb))
  loop
    if btrim(coalesce(elem->>'item', '')) = '' then
      continue;
    end if;
    if elem->>'quantity' is null or btrim(elem->>'quantity') = '' or elem->>'quantity' = 'null' then
      qty := null;
    elsif btrim(elem->>'quantity') ~ '^[0-9]+(\.[0-9]+)?$' then
      qty := btrim(elem->>'quantity')::numeric;
    else
      raise exception 'Check the ingredient amounts';
    end if;
    if qty is not null and (qty < 0 or qty > 100000) then
      raise exception 'Check the ingredient amounts';
    end if;

    insert into public.recipe_ingredients (recipe_id, position, quantity, unit, item, note)
    values (
      new_id,
      ingredient_count,
      qty,
      nullif(left(btrim(coalesce(elem->>'unit', '')), 40), ''),
      left(btrim(elem->>'item'), 300),
      nullif(left(btrim(coalesce(elem->>'note', '')), 200), '')
    );
    ingredient_count := ingredient_count + 1;
  end loop;

  if ingredient_count < 1 then
    raise exception 'Add at least one ingredient';
  end if;

  for elem in
    select value from jsonb_array_elements(coalesce(p_steps, '[]'::jsonb))
  loop
    if btrim(coalesce(elem->>'instruction', '')) = '' then
      continue;
    end if;
    if elem->>'photo_path' is not null
      and btrim(elem->>'photo_path') <> ''
      and elem->>'photo_path' !~ '^recipes/[A-Za-z0-9._/-]+\.(jpg|jpeg|png|webp|gif)$' then
      raise exception 'Photo path looks wrong';
    end if;

    insert into public.recipe_steps (recipe_id, position, instruction, photo_path)
    values (
      new_id,
      step_count,
      left(btrim(elem->>'instruction'), 4000),
      nullif(btrim(coalesce(elem->>'photo_path', '')), '')
    )
    returning id into step_id;
    step_ids := step_ids || step_id;
    step_count := step_count + 1;
  end loop;

  if step_count < 1 then
    raise exception 'Add at least one step';
  end if;

  return jsonb_build_object('id', new_id, 'step_ids', to_jsonb(step_ids));
end;
$$;

create or replace function public.restore_recipe_version(
  p_id uuid,
  p_snapshot jsonb,
  p_editor_name text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  editor_name text;
  elem jsonb;
  qty numeric;
  ingredient_count integer := 0;
  step_count integer := 0;
  snap_tags text[];
begin
  editor_name := nullif(left(regexp_replace(btrim(coalesce(p_editor_name, '')), '[[:space:]]+', ' ', 'g'), 80), '');
  if editor_name is null then
    raise exception 'Add your name';
  end if;
  if not exists (select 1 from public.recipes r where r.id = p_id) then
    raise exception 'Recipe not found';
  end if;
  if p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object' then
    raise exception 'That version could not be read';
  end if;

  insert into public.recipe_revisions (recipe_id, snapshot, editor_name)
  values (p_id, public.recipe_snapshot(p_id), editor_name);

  select coalesce(array_agg(value), '{}'::text[])
  into snap_tags
  from jsonb_array_elements_text(coalesce(p_snapshot->'tags', '[]'::jsonb)) as value;

  update public.recipes
  set
    title = btrim(p_snapshot->>'title'),
    source_name = nullif(btrim(coalesce(p_snapshot->>'source_name', '')), ''),
    category_id = p_snapshot->>'category_id',
    servings = (p_snapshot->>'servings')::integer,
    prep_minutes = nullif(p_snapshot->>'prep_minutes', '')::integer,
    cook_minutes = nullif(p_snapshot->>'cook_minutes', '')::integer,
    notes = nullif(btrim(coalesce(p_snapshot->>'notes', '')), ''),
    tags = snap_tags,
    hero_photo_path = nullif(p_snapshot->>'hero_photo_path', ''),
    card_photo_path = nullif(p_snapshot->>'card_photo_path', '')
  where id = p_id;

  delete from public.recipe_ingredients where recipe_id = p_id;
  delete from public.recipe_steps where recipe_id = p_id;

  for elem in
    select value from jsonb_array_elements(coalesce(p_snapshot->'ingredients', '[]'::jsonb))
  loop
    if elem->>'quantity' is null or btrim(elem->>'quantity') = '' or elem->>'quantity' = 'null' then
      qty := null;
    else
      qty := (elem->>'quantity')::numeric;
    end if;
    insert into public.recipe_ingredients (recipe_id, position, quantity, unit, item, note)
    values (
      p_id,
      ingredient_count,
      qty,
      nullif(elem->>'unit', ''),
      coalesce(elem->>'item', ''),
      nullif(elem->>'note', '')
    );
    ingredient_count := ingredient_count + 1;
  end loop;

  for elem in
    select value from jsonb_array_elements(coalesce(p_snapshot->'steps', '[]'::jsonb))
  loop
    insert into public.recipe_steps (recipe_id, position, instruction, photo_path)
    values (
      p_id,
      step_count,
      coalesce(elem->>'instruction', ''),
      nullif(elem->>'photo_path', '')
    );
    step_count := step_count + 1;
  end loop;
end;
$$;

create or replace function public.soft_delete_recipe(p_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.recipes
  set deleted_at = now()
  where id = p_id
    and deleted_at is null;
  if not found then
    raise exception 'Recipe not found';
  end if;
end;
$$;

create or replace function public.restore_deleted_recipe(p_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  when_deleted timestamptz;
begin
  select deleted_at into when_deleted from public.recipes where id = p_id;
  if when_deleted is null then
    raise exception 'Recipe not found';
  end if;
  if when_deleted < now() - interval '30 days' then
    raise exception 'That recipe has been in the bin more than 30 days';
  end if;
  update public.recipes
  set deleted_at = null
  where id = p_id;
end;
$$;

create or replace function public.category_counts()
returns table (category_id text, recipe_count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select r.category_id, count(*)::bigint
  from public.recipes r
  where r.deleted_at is null
  group by r.category_id;
$$;

revoke all on function public.category_counts() from public;
grant execute on function public.category_counts() to anon, authenticated, service_role;

revoke all on function public.set_updated_at() from public;
revoke all on function public.touch_recipe_search() from public;
revoke all on function public.recipes_parent_guard() from public;
revoke all on function public.recipe_snapshot(uuid) from public;
revoke all on function public.save_recipe(
  uuid, uuid, text, text, text, text, integer, integer, integer, text, text[], text, text, text, jsonb, jsonb
) from public;
revoke all on function public.restore_recipe_version(uuid, jsonb, text) from public;
revoke all on function public.soft_delete_recipe(uuid) from public;
revoke all on function public.restore_deleted_recipe(uuid) from public;

grant execute on function public.set_updated_at() to service_role;
grant execute on function public.touch_recipe_search() to service_role;
grant execute on function public.recipes_parent_guard() to service_role;
grant execute on function public.recipe_snapshot(uuid) to service_role;
grant execute on function public.save_recipe(
  uuid, uuid, text, text, text, text, integer, integer, integer, text, text[], text, text, text, jsonb, jsonb
) to service_role;
grant execute on function public.restore_recipe_version(uuid, jsonb, text) to service_role;
grant execute on function public.soft_delete_recipe(uuid) to service_role;
grant execute on function public.restore_deleted_recipe(uuid) to service_role;

-- ============================================================================
-- RLS: public read. No anon or authenticated writes.
-- Soft-deleted recipes stay readable for 30 days so Recently deleted can list them.
-- ============================================================================

alter table public.categories enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_steps enable row level security;
alter table public.recipe_revisions enable row level security;

create policy categories_public_read
  on public.categories
  for select
  to anon, authenticated
  using (true);

create policy recipes_public_read
  on public.recipes
  for select
  to anon, authenticated
  using (deleted_at is null or deleted_at > now() - interval '30 days');

create policy recipe_ingredients_public_read
  on public.recipe_ingredients
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.recipes r
      where r.id = recipe_id
        and (r.deleted_at is null or r.deleted_at > now() - interval '30 days')
    )
  );

create policy recipe_steps_public_read
  on public.recipe_steps
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.recipes r
      where r.id = recipe_id
        and (r.deleted_at is null or r.deleted_at > now() - interval '30 days')
    )
  );

create policy recipe_revisions_public_read
  on public.recipe_revisions
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.recipes r
      where r.id = recipe_id
        and (r.deleted_at is null or r.deleted_at > now() - interval '30 days')
    )
  );

grant usage on schema public to anon, authenticated, service_role;

grant select on public.categories to anon, authenticated;
grant select on public.recipes to anon, authenticated;
grant select on public.recipe_ingredients to anon, authenticated;
grant select on public.recipe_steps to anon, authenticated;
grant select on public.recipe_revisions to anon, authenticated;

grant select, insert, update, delete on public.categories to service_role;
grant select, insert, update, delete on public.recipes to service_role;
grant select, insert, update, delete on public.recipe_ingredients to service_role;
grant select, insert, update, delete on public.recipe_steps to service_role;
grant select, insert, update, delete on public.recipe_revisions to service_role;
