import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Recipe, StoredRecipe } from '../types/recipe';
import * as storage from '../services/recipeStorage';

type RecipesContextType = {
  recipes: StoredRecipe[];
  saveRecipe: (recipe: Recipe) => Promise<StoredRecipe>;
  updateRecipe: (updated: StoredRecipe) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
};

const RecipesContext = createContext<RecipesContextType | null>(null);

export function RecipesProvider({ children }: { children: ReactNode }) {
  const [recipes, setRecipes] = useState<StoredRecipe[]>([]);

  useEffect(() => {
    storage.loadRecipes().then(setRecipes);
  }, []);

  const saveRecipe = async (recipe: Recipe): Promise<StoredRecipe> => {
    const stored = await storage.saveRecipe(recipe);
    setRecipes((prev) => [stored, ...prev.filter((r) => r.sourceUrl !== stored.sourceUrl)]);
    return stored;
  };

  const updateRecipe = async (updated: StoredRecipe): Promise<void> => {
    await storage.updateRecipe(updated);
    setRecipes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const deleteRecipe = async (id: string): Promise<void> => {
    await storage.deleteRecipe(id);
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <RecipesContext.Provider value={{ recipes, saveRecipe, updateRecipe, deleteRecipe }}>
      {children}
    </RecipesContext.Provider>
  );
}

export function useRecipes(): RecipesContextType {
  const context = useContext(RecipesContext);
  if (!context) throw new Error('useRecipes must be used within RecipesProvider');
  return context;
}
