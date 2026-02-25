export interface Recipe {
  title: string;
  imageUrl: string | null;
  ingredients: string[];
  instructions: string[];
  prepTime: string | null;
  cookTime: string | null;
  totalTime: string | null;
  servings: string | null;
  sourceUrl: string;
}

export interface StoredRecipe extends Recipe {
  id: string;
  savedAt: number;
  sortOrder: number;
}

export interface Separator {
  id: string;
  type: 'separator';
  name: string;
  sortOrder: number;
}

export type ListItem = StoredRecipe | Separator;

export function isSeparator(item: ListItem): item is Separator {
  return 'type' in item && item.type === 'separator';
}
