import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Recipe, StoredRecipe, ListItem, Separator } from '../types/recipe';
import { isSeparator } from '../types/recipe';
import * as storage from '../services/recipeStorage';

type RecipesContextType = {
  items: ListItem[];
  recipes: StoredRecipe[];
  saveRecipe: (recipe: Recipe) => Promise<StoredRecipe>;
  updateRecipe: (updated: StoredRecipe) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  reorderItems: (items: ListItem[]) => Promise<void>;
  addSeparator: (name: string) => Promise<Separator>;
};

const RecipesContext = createContext<RecipesContextType | null>(null);

export function RecipesProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ListItem[]>([]);

  const recipes = items.filter((i) => !isSeparator(i)) as StoredRecipe[];

  useEffect(() => {
    storage.loadItems().then(setItems);
  }, []);

  const saveRecipe = async (recipe: Recipe): Promise<StoredRecipe> => {
    const stored = await storage.saveRecipe(recipe);
    setItems((prev) => [stored, ...prev.filter((r) => isSeparator(r) || r.sourceUrl !== stored.sourceUrl).map((r) => ({ ...r, sortOrder: r.sortOrder + 1 }))]);
    return stored;
  };

  const updateRecipe = async (updated: StoredRecipe): Promise<void> => {
    await storage.updateRecipe(updated);
    setItems((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const deleteItem = async (id: string): Promise<void> => {
    await storage.deleteItem(id);
    setItems((prev) => prev.filter((r) => r.id !== id).map((r, i) => ({ ...r, sortOrder: i })));
  };

  const reorderItems = async (reordered: ListItem[]): Promise<void> => {
    const withOrder = reordered.map((r, i) => ({ ...r, sortOrder: i }));
    setItems(withOrder);
    await storage.reorderItems(reordered);
  };

  const addSeparator = async (name: string): Promise<Separator> => {
    const separator = await storage.saveSeparator(name);
    setItems((prev) => [separator, ...prev.map((r) => ({ ...r, sortOrder: r.sortOrder + 1 }))]);
    return separator;
  };

  return (
    <RecipesContext.Provider value={{ items, recipes, saveRecipe, updateRecipe, deleteItem, reorderItems, addSeparator }}>
      {children}
    </RecipesContext.Provider>
  );
}

export function useRecipes(): RecipesContextType {
  const context = useContext(RecipesContext);
  if (!context) throw new Error('useRecipes must be used within RecipesProvider');
  return context;
}
