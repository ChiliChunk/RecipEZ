import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Recipe, StoredRecipe } from '../types/recipe';

const RECIPES_KEY = '@recipez/recipes';

export async function loadRecipes(): Promise<StoredRecipe[]> {
  try {
    const json = await AsyncStorage.getItem(RECIPES_KEY);
    if (!json) return [];
    const recipes = JSON.parse(json) as StoredRecipe[];

    // Migration: assign sortOrder to legacy recipes that lack it
    const needsMigration = recipes.some((r) => r.sortOrder == null);
    if (needsMigration) {
      const sorted = recipes.sort((a, b) => b.savedAt - a.savedAt);
      const migrated = sorted.map((r, i) => ({ ...r, sortOrder: i }));
      await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(migrated));
      return migrated;
    }

    return recipes.sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    return [];
  }
}

export async function saveRecipe(recipe: Recipe): Promise<StoredRecipe> {
  const existing = await loadRecipes();
  const stored: StoredRecipe = {
    ...recipe,
    id: Date.now().toString(),
    savedAt: Date.now(),
    sortOrder: 0,
  };
  const deduplicated = existing
    .filter((r) => r.sourceUrl !== recipe.sourceUrl)
    .map((r) => ({ ...r, sortOrder: r.sortOrder + 1 }));
  await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify([stored, ...deduplicated]));
  return stored;
}

export async function updateRecipe(updated: StoredRecipe): Promise<void> {
  const existing = await loadRecipes();
  const next = existing.map((r) => (r.id === updated.id ? updated : r));
  await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(next));
}

export async function deleteRecipe(id: string): Promise<void> {
  const existing = await loadRecipes();
  const next = existing
    .filter((r) => r.id !== id)
    .map((r, i) => ({ ...r, sortOrder: i }));
  await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(next));
}

export async function reorderRecipes(recipes: StoredRecipe[]): Promise<StoredRecipe[]> {
  const reordered = recipes.map((r, i) => ({ ...r, sortOrder: i }));
  await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(reordered));
  return reordered;
}
