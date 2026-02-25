import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  FlatList,
  Image,
} from 'react-native';
import { colors, spacing, borderRadius, fontSize, shadow } from '../styles/theme';
import { scrapeRecipe, ScraperError } from '../services/recipeScraper';
import type { Recipe, StoredRecipe } from '../types/recipe';

interface Props {
  recipes: StoredRecipe[];
  onRecipeImported: (recipe: Recipe) => void;
  onSelectRecipe: (recipe: StoredRecipe) => void;
}

function RecipeCard({ recipe, onPress }: { recipe: StoredRecipe; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {recipe.imageUrl ? (
        <Image source={{ uri: recipe.imageUrl }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Text style={styles.cardImagePlaceholderText}>🍽</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{recipe.title}</Text>
        {recipe.servings && (
          <Text style={styles.cardServings}>{recipe.servings}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function Home({ recipes, onRecipeImported, onSelectRecipe }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setError(null);
    setLoading(true);
    try {
      const recipe = await scrapeRecipe(url);
      setUrl('');
      setModalVisible(false);
      onRecipeImported(recipe);
    } catch (err) {
      if (err instanceof ScraperError) {
        setError(err.message);
      } else {
        setError('Une erreur inattendue est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mon livre de recettes</Text>

      {recipes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Aucune recette enregistrée.{'\n'}Importez votre première recette !
          </Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <RecipeCard recipe={item} onPress={() => onSelectRecipe(item)} />
          )}
        />
      )}

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Nouvelle recette</Text>
            <Text style={styles.modalBody}>
              Collez le lien d'une recette pour l'importer
            </Text>
            <TextInput
              style={styles.urlInput}
              placeholder="https://..."
              placeholderTextColor={colors.textMuted}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              selectTextOnFocus
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setUrl('');
                  setError(null);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, (!url || loading) && styles.submitButtonDisabled]}
                disabled={!url || loading}
                onPress={handleImport}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text style={styles.submitButtonText}>Importer</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabIcon}>✎</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    paddingTop: 54,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyStateText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    elevation: shadow.elevation,
    shadowColor: shadow.color,
    shadowOffset: shadow.offset,
    shadowOpacity: shadow.opacity,
    shadowRadius: shadow.radius,
  },
  cardImage: {
    width: 90,
    height: 90,
  },
  cardImagePlaceholder: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImagePlaceholderText: {
    fontSize: fontSize.xl,
  },
  cardBody: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  cardServings: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
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
  fabIcon: {
    fontSize: fontSize.xl,
    color: colors.surface,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modalBody: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  urlInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.background,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.surface,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
});
