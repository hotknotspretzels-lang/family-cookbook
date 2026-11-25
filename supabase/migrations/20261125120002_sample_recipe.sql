-- Clearly labeled sample recipes so the first open is not an empty kitchen.
-- Nothing here is a real family recipe. Delete them from the app when you like.
-- The second recipe is a variation of the first, so the grouping has something to show.

insert into public.recipes (
  id, title, author_name, source_name, category_id, servings,
  prep_minutes, cook_minutes, notes, tags
) values (
  '00000000-0000-4000-8000-000000000001',
  'Sample: Buttermilk Biscuits',
  'Example Cook',
  'Example Cook (sample, not a family member)',
  'breads',
  8,
  15,
  15,
  'SAMPLE RECIPE — placeholder so you can tap around. This is not a family recipe. Delete it after a real one is added.',
  array['sample', 'biscuits', 'breakfast']
);

insert into public.recipe_ingredients (recipe_id, position, quantity, unit, item, note) values
  ('00000000-0000-4000-8000-000000000001', 0, 2, 'cup', 'all-purpose flour', null),
  ('00000000-0000-4000-8000-000000000001', 1, 1, 'tbsp', 'baking powder', null),
  ('00000000-0000-4000-8000-000000000001', 2, 0.5, 'tsp', 'salt', null),
  ('00000000-0000-4000-8000-000000000001', 3, 6, 'tbsp', 'cold butter', 'cut into small pieces'),
  ('00000000-0000-4000-8000-000000000001', 4, 0.75, 'cup', 'buttermilk', null),
  ('00000000-0000-4000-8000-000000000001', 5, null, null, 'butter for the pan', null);

insert into public.recipe_steps (recipe_id, position, instruction) values
  ('00000000-0000-4000-8000-000000000001', 0, 'Heat the oven to 425°F.'),
  ('00000000-0000-4000-8000-000000000001', 1, 'Stir the flour, baking powder, and salt together.'),
  ('00000000-0000-4000-8000-000000000001', 2, 'Cut in the cold butter until the mix looks like coarse crumbs.'),
  ('00000000-0000-4000-8000-000000000001', 3, 'Stir in the buttermilk just until a soft dough forms.'),
  ('00000000-0000-4000-8000-000000000001', 4, 'Pat about 3/4 inch thick, cut, and bake 12 to 15 minutes, until the tops are golden.');

insert into public.recipes (
  id, parent_recipe_id, title, author_name, source_name, category_id, servings,
  prep_minutes, cook_minutes, notes, tags
) values (
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  'Sample: Example Guest''s Twist on Buttermilk Biscuits',
  'Example Guest',
  'Example Cook (sample, not a family member)',
  'breads',
  8,
  15,
  15,
  'SAMPLE VARIATION — shows how a twist sits under the original. Not a family recipe.',
  array['sample', 'biscuits', 'cheese']
);

insert into public.recipe_ingredients (recipe_id, position, quantity, unit, item, note) values
  ('00000000-0000-4000-8000-000000000002', 0, 2, 'cup', 'all-purpose flour', null),
  ('00000000-0000-4000-8000-000000000002', 1, 1, 'tbsp', 'baking powder', null),
  ('00000000-0000-4000-8000-000000000002', 2, 0.5, 'tsp', 'salt', null),
  ('00000000-0000-4000-8000-000000000002', 3, 6, 'tbsp', 'cold butter', null),
  ('00000000-0000-4000-8000-000000000002', 4, 0.75, 'cup', 'buttermilk', null),
  ('00000000-0000-4000-8000-000000000002', 5, 1, 'cup', 'shredded cheddar', 'folded in at the end');

insert into public.recipe_steps (recipe_id, position, instruction) values
  ('00000000-0000-4000-8000-000000000002', 0, 'Heat the oven to 425°F and mix the dough the same way as the original biscuits.'),
  ('00000000-0000-4000-8000-000000000002', 1, 'Fold in the cheddar just before you pat the dough out.'),
  ('00000000-0000-4000-8000-000000000002', 2, 'Bake 12 to 15 minutes, until the cheese spots are golden.');

insert into public.recipes (
  id, title, author_name, source_name, category_id, servings,
  prep_minutes, cook_minutes, notes, tags
) values (
  '00000000-0000-4000-8000-000000000003',
  'Sample: Skillet Chicken and Rice',
  'Example Cook',
  'Example Cook (sample, not a family member)',
  'chicken',
  4,
  15,
  35,
  'SAMPLE RECIPE — a main dish so the category sidebar has two groups with something in them. Not a family recipe.',
  array['sample', 'chicken', 'one pan']
);

insert into public.recipe_ingredients (recipe_id, position, quantity, unit, item, note) values
  ('00000000-0000-4000-8000-000000000003', 0, 1.5, 'lb', 'boneless chicken thighs', null),
  ('00000000-0000-4000-8000-000000000003', 1, 1, 'tsp', 'paprika', null),
  ('00000000-0000-4000-8000-000000000003', 2, 1, 'cup', 'long-grain rice', null),
  ('00000000-0000-4000-8000-000000000003', 3, 2, 'cup', 'chicken broth', null),
  ('00000000-0000-4000-8000-000000000003', 4, null, null, 'salt and pepper', 'to taste');

insert into public.recipe_steps (recipe_id, position, instruction) values
  ('00000000-0000-4000-8000-000000000003', 0, 'Season the chicken with paprika, salt, and pepper.'),
  ('00000000-0000-4000-8000-000000000003', 1, 'Brown the chicken in a skillet, then set it aside.'),
  ('00000000-0000-4000-8000-000000000003', 2, 'Stir the rice and broth into the pan, nestle the chicken back in, cover, and cook about 25 minutes until the rice is tender.');
