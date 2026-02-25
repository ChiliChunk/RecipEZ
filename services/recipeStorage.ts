import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Recipe, StoredRecipe, ListItem, Separator } from '../types/recipe';
import { isSeparator } from '../types/recipe';

const RECIPES_KEY = '@recipez/recipes';

export async function loadItems(): Promise<ListItem[]> {
  try {
    const json = await AsyncStorage.getItem(RECIPES_KEY);
    if (!json) return [];
    const items = JSON.parse(json) as ListItem[];

    // Migration: assign sortOrder to legacy items that lack it
    const needsMigration = items.some((r) => r.sortOrder == null);
    if (needsMigration) {
      const recipes = items.filter((r) => !isSeparator(r)) as StoredRecipe[];
      const separators = items.filter(isSeparator);
      const sorted = [...separators, ...recipes.sort((a, b) => b.savedAt - a.savedAt)];
      const migrated = sorted.map((r, i) => ({ ...r, sortOrder: i }));
      await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(migrated));
      return migrated;
    }

    return items.sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    return [];
  }
}

/** @deprecated use loadItems instead */
export const loadRecipes = loadItems;

export async function saveRecipe(recipe: Recipe): Promise<StoredRecipe> {
  const existing = await loadItems();
  const stored: StoredRecipe = {
    ...recipe,
    id: Date.now().toString(),
    savedAt: Date.now(),
    sortOrder: 0,
  };
  const deduplicated = existing
    .filter((r) => isSeparator(r) || r.sourceUrl !== recipe.sourceUrl)
    .map((r) => ({ ...r, sortOrder: r.sortOrder + 1 }));
  await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify([stored, ...deduplicated]));
  return stored;
}

export async function saveSeparator(name: string): Promise<Separator> {
  const existing = await loadItems();
  const separator: Separator = {
    id: Date.now().toString(),
    type: 'separator',
    name,
    sortOrder: 0,
  };
  const shifted = existing.map((r) => ({ ...r, sortOrder: r.sortOrder + 1 }));
  await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify([separator, ...shifted]));
  return separator;
}

export async function updateRecipe(updated: StoredRecipe): Promise<void> {
  const existing = await loadItems();
  const next = existing.map((r) => (r.id === updated.id ? updated : r));
  await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(next));
}

export async function deleteItem(id: string): Promise<void> {
  const existing = await loadItems();
  const next = existing
    .filter((r) => r.id !== id)
    .map((r, i) => ({ ...r, sortOrder: i }));
  await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(next));
}

/** @deprecated use deleteItem instead */
export const deleteRecipe = deleteItem;

export async function reorderItems(items: ListItem[]): Promise<ListItem[]> {
  const reordered = items.map((r, i) => ({ ...r, sortOrder: i }));
  await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(reordered));
  return reordered;
}

/** @deprecated use reorderItems instead */
export const reorderRecipes = reorderItems;
