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
} from 'react-native';
import { colors, spacing, borderRadius, fontSize, shadow } from '../styles/theme';
import { scrapeRecipe, ScraperError } from '../services/recipeScraper';
import type { Recipe } from '../types/recipe';

interface Props {
  onSelectRecipe: (recipe: Recipe) => void;
}

export default function Home({ onSelectRecipe }: Props) {
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
      onSelectRecipe(recipe);
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
      <Text style={styles.title}>RecipEZ - Mon livre de recettes</Text>

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
    alignItems: 'center',
    justifyContent: 'center',
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
    color: colors.white,
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
  title: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
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
