import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Recipe, StoredRecipe } from '../types/recipe';

const RECIPES_KEY = '@recipez/recipes';

export async function loadRecipes(): Promise<StoredRecipe[]> {
  try {
    const json = await AsyncStorage.getItem(RECIPES_KEY);
    if (!json) return [];
    return (JSON.parse(json) as StoredRecipe[]).sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

export async function updateRecipe(updated: StoredRecipe): Promise<void> {
  const existing = await loadRecipes();
  const next = existing.map((r) => (r.id === updated.id ? updated : r));
  await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(next));
}

export async function deleteRecipe(id: string): Promise<void> {
  const existing = await loadRecipes();
  const next = existing.filter((r) => r.id !== id);
  await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(next));
}

export async function saveRecipe(recipe: Recipe): Promise<StoredRecipe> {
  const stored: StoredRecipe = {
    ...recipe,
    id: Date.now().toString(),
    savedAt: Date.now(),
  };
  const existing = await loadRecipes();
  const deduplicated = existing.filter((r) => r.sourceUrl !== recipe.sourceUrl);
  await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify([stored, ...deduplicated]));
  return stored;
}
