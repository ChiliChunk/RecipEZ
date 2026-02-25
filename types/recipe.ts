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
