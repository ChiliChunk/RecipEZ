import type { StoredRecipe } from './recipe';

export type RootStackParamList = {
  Home: undefined;
  RecipeDetail: { recipe: StoredRecipe };
};
