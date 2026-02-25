import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from './screens/Home';
import RecipeDetail from './screens/RecipeDetail';
import { loadRecipes, saveRecipe } from './services/recipeStorage';

const Stack = createNativeStackNavigator();

export default function App() {
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    loadRecipes().then(setRecipes);
  }, []);

  const handleSaveRecipe = async (recipe) => {
    const stored = await saveRecipe(recipe);
    setRecipes((prev) => [stored, ...prev.filter((r) => r.sourceUrl !== stored.sourceUrl)]);
    return stored;
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home">
          {(props) => (
            <Home
              {...props}
              recipes={recipes}
              onRecipeImported={handleSaveRecipe}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="RecipeDetail" component={RecipeDetail} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
