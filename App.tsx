import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, Barriecito_400Regular } from '@expo-google-fonts/barriecito';
import { RecipesProvider } from './contexts/RecipesContext';
import Home from './screens/Home';
import RecipeDetail from './screens/RecipeDetail';

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({ Barriecito_400Regular });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

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
