import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import Home from './screens/Home';
import RecipeDetail from './screens/RecipeDetail';
import { loadRecipes, saveRecipe } from './services/recipeStorage';

export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  useEffect(() => {
    loadRecipes().then(setRecipes);
  }, []);

  const handleSaveRecipe = async (recipe) => {
    const stored = await saveRecipe(recipe);
    setRecipes((prev) => [stored, ...prev.filter((r) => r.sourceUrl !== stored.sourceUrl)]);
    setSelectedRecipe(stored);
  };

  return (
    <>
      {selectedRecipe ? (
        <RecipeDetail
          recipe={selectedRecipe}
          onBack={() => setSelectedRecipe(null)}
        />
      ) : (
        <Home
          recipes={recipes}
          onRecipeImported={handleSaveRecipe}
          onSelectRecipe={setSelectedRecipe}
        />
      )}
      <StatusBar style="auto" />
    </>
  );
}
