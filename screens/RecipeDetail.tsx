import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '../styles/theme';
import type { Recipe } from '../types/recipe';

interface Props {
  recipe: Recipe;
  onBack: () => void;
}

function formatDuration(iso: string | null): string | null {
  if (!iso) return null;
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
  if (!match) return iso;
  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  if (hours && minutes) return `${hours}h${String(minutes).padStart(2, '0')}`;
  if (hours) return `${hours}h`;
  if (minutes) return `${minutes} min`;
  return null;
}

export default function RecipeDetail({ recipe, onBack }: Props) {
  const prepTime = formatDuration(recipe.prepTime);
  const cookTime = formatDuration(recipe.cookTime);
  const totalTime = formatDuration(recipe.totalTime);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>← Retour</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {recipe.imageUrl && (
          <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
        )}

        <Text style={styles.title}>{recipe.title}</Text>

        {(prepTime || cookTime || totalTime || recipe.servings) && (
          <View style={styles.infoRow}>
            {prepTime && (
              <View style={styles.infoBadge}>
                <Text style={styles.infoLabel}>Prépa</Text>
                <Text style={styles.infoValue}>{prepTime}</Text>
              </View>
            )}
            {cookTime && (
              <View style={styles.infoBadge}>
                <Text style={styles.infoLabel}>Cuisson</Text>
                <Text style={styles.infoValue}>{cookTime}</Text>
              </View>
            )}
            {totalTime && (
              <View style={styles.infoBadge}>
                <Text style={styles.infoLabel}>Total</Text>
                <Text style={styles.infoValue}>{totalTime}</Text>
              </View>
            )}
            {recipe.servings && (
              <View style={styles.infoBadge}>
                <Text style={styles.infoLabel}>Portions</Text>
                <Text style={styles.infoValue}>{recipe.servings}</Text>
              </View>
            )}
          </View>
        )}

        {recipe.ingredients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingrédients</Text>
            {recipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.ingredientText}>{ingredient}</Text>
              </View>
            ))}
          </View>
        )}

        {recipe.instructions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Étapes</Text>
            {recipe.instructions.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.sourceLink}
          onPress={() => Linking.openURL(recipe.sourceUrl)}
        >
          <Text style={styles.sourceLinkText}>Voir la recette originale</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    paddingTop: 50,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  backText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  image: {
    width: '100%',
    height: 250,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  infoBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  ingredientRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  bullet: {
    fontSize: fontSize.md,
    color: colors.primary,
    marginRight: spacing.xs,
    lineHeight: 22,
  },
  ingredientText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: fontSize.sm,
    color: colors.surface,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
  },
  sourceLink: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  sourceLinkText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
