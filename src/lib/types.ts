export type Category = {
  id: string;
  groupName: string;
  name: string;
  groupSort: number;
  sortOrder: number;
};

export type NavItem = {
  id: string;
  name: string;
  count: number;
  sort: number;
};

export type NavGroup = {
  name: string;
  sort: number;
  single: boolean;
  items: NavItem[];
};

export type Ingredient = {
  quantity: number | null;
  unit: string | null;
  item: string;
  note: string | null;
};

export type Step = {
  id: string;
  instruction: string;
  photoPath: string | null;
  photoUrl: string | null;
};

export type RecipeSummary = {
  id: string;
  title: string;
  authorName: string;
  sourceName: string | null;
  categoryId: string;
  categoryName: string;
  groupName: string;
  servings: number;
  prepMinutes: number | null;
  cookMinutes: number | null;
  tags: string[];
  heroUrl: string | null;
  parentId: string | null;
  createdAt: string;
  deletedAt: string | null;
};

export type Recipe = RecipeSummary & {
  notes: string | null;
  heroPath: string | null;
  cardPath: string | null;
  cardUrl: string | null;
  ingredients: Ingredient[];
  steps: Step[];
  updatedAt: string;
};

export type RecipeGroup = {
  key: string;
  original: RecipeSummary | null;
  removed: boolean;
  removedTitle: string | null;
  variations: RecipeSummary[];
};

export type RecipeSnapshot = {
  title: string;
  author_name: string;
  source_name: string | null;
  category_id: string;
  servings: number;
  prep_minutes: number | null;
  cook_minutes: number | null;
  notes: string | null;
  tags: string[];
  hero_photo_path: string | null;
  card_photo_path: string | null;
  parent_recipe_id: string | null;
  ingredients: {
    quantity: number | null;
    unit: string | null;
    item: string;
    note: string | null;
  }[];
  steps: { instruction: string; photo_path: string | null }[];
};

export type Revision = {
  id: string;
  editorName: string;
  createdAt: string;
  snapshot: RecipeSnapshot;
};

export type ActionState = { error: string } | undefined;
