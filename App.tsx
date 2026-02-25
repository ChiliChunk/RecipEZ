import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RecipesProvider } from './contexts/RecipesContext';
import Home from './screens/Home';
import RecipeDetail from './screens/RecipeDetail';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RecipesProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="RecipeDetail" component={RecipeDetail} />
          </Stack.Navigator>
          <StatusBar style="auto" />
        </NavigationContainer>
      </RecipesProvider>
    </GestureHandlerRootView>
  );
}
