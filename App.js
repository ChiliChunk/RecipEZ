import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import Home from './screens/Home';
import RecipeDetail from './screens/RecipeDetail';

export default function App() {
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  return (
    <>
      {selectedRecipe ? (
        <RecipeDetail
          recipe={selectedRecipe}
          onBack={() => setSelectedRecipe(null)}
        />
      ) : (
        <Home onSelectRecipe={setSelectedRecipe} />
      )}
      <StatusBar style="auto" />
    </>
  );
}
