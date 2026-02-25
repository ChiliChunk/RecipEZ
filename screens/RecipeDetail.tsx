import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, shadow } from '../styles/theme';
import type { RootStackParamList } from '../types/navigation';
import type { StoredRecipe } from '../types/recipe';

type Props = NativeStackScreenProps<RootStackParamList, 'RecipeDetail'> & {
  onRecipeUpdated: (recipe: StoredRecipe) => Promise<void>;
};

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

export default function RecipeDetail({ navigation, route, onRecipeUpdated }: Props) {
  const { recipe } = route.params;

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editServings, setEditServings] = useState('');
  const [editIngredients, setEditIngredients] = useState<string[]>([]);
  const [editInstructions, setEditInstructions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleEditPress = () => {
    setEditTitle(recipe.title);
    setEditServings(recipe.servings ?? '');
    setEditIngredients([...recipe.ingredients]);
    setEditInstructions([...recipe.instructions]);
    setIsEditing(true);
  };

  const handleCancel = () => setIsEditing(false);

  const handleSave = async () => {
    setSaving(true);
    const updated: StoredRecipe = {
      ...recipe,
      title: editTitle.trim(),
      servings: editServings.trim() || null,
      ingredients: editIngredients.filter((i) => i.trim() !== ''),
      instructions: editInstructions.filter((s) => s.trim() !== ''),
    };
    await onRecipeUpdated(updated);
    navigation.setParams({ recipe: updated });
    setSaving(false);
    setIsEditing(false);
  };

  const prepTime = formatDuration(recipe.prepTime);
  const cookTime = formatDuration(recipe.cookTime);
  const totalTime = formatDuration(recipe.totalTime);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {isEditing ? (
          <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
            <Text style={styles.backText}>✕ Annuler</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {isEditing ? (
          <View style={styles.editContainer}>
            <Text style={styles.sectionTitle}>Titre</Text>
            <TextInput
              style={styles.editInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Titre de la recette"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.sectionTitle}>Portions</Text>
            <TextInput
              style={styles.editInput}
              value={editServings}
              onChangeText={setEditServings}
              placeholder="ex: 4 personnes"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.sectionTitle}>Ingrédients</Text>
            {editIngredients.map((item, index) => (
              <View key={index} style={styles.editListRow}>
                <TextInput
                  style={[styles.editInput, styles.editListInput]}
                  value={item}
                  onChangeText={(text) => {
                    const next = [...editIngredients];
                    next[index] = text;
                    setEditIngredients(next);
                  }}
                  multiline
                />
                <TouchableOpacity
                  onPress={() => setEditIngredients(editIngredients.filter((_, i) => i !== index))}
                  style={styles.deleteButton}
                >
                  <Feather name="x" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addItemButton}
              onPress={() => setEditIngredients([...editIngredients, ''])}
            >
              <Feather name="plus" size={16} color={colors.primary} />
              <Text style={styles.addItemText}>Ajouter un ingrédient</Text>
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Étapes</Text>
            {editInstructions.map((step, index) => (
              <View key={index} style={styles.editListRow}>
                <View style={styles.stepNumberSmall}>
                  <Text style={styles.stepNumberSmallText}>{index + 1}</Text>
                </View>
                <TextInput
                  style={[styles.editInput, styles.editListInput]}
                  value={step}
                  onChangeText={(text) => {
                    const next = [...editInstructions];
                    next[index] = text;
                    setEditInstructions(next);
                  }}
                  multiline
                />
                <TouchableOpacity
                  onPress={() => setEditInstructions(editInstructions.filter((_, i) => i !== index))}
                  style={styles.deleteButton}
                >
                  <Feather name="x" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addItemButton}
              onPress={() => setEditInstructions([...editInstructions, ''])}
            >
              <Feather name="plus" size={16} color={colors.primary} />
              <Text style={styles.addItemText}>Ajouter une étape</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
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
          </>
        )}
      </ScrollView>

      {isEditing ? (
        <TouchableOpacity style={styles.fab} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color={colors.surface} />
            : <Feather name="check" size={24} color={colors.surface} />}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.fab} onPress={handleEditPress}>
          <Feather name="edit" size={24} color={colors.surface} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRow: {
    paddingTop: 50,
  },
  backButton: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
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
    paddingBottom: 100,
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
  fab: {
    position: 'absolute',
    bottom: spacing.xxl,
    right: spacing.lg,
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: shadow.elevation,
    shadowColor: shadow.color,
    shadowOffset: shadow.offset,
    shadowOpacity: shadow.opacity,
    shadowRadius: shadow.radius,
  },
  // Edit mode styles
  editContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  editInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  editListRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  editListInput: {
    flex: 1,
    marginBottom: 0,
  },
  deleteButton: {
    paddingTop: spacing.sm,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  addItemText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  stepNumberSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    flexShrink: 0,
  },
  stepNumberSmallText: {
    fontSize: 12,
    color: colors.surface,
    fontWeight: 'bold',
  },
});
