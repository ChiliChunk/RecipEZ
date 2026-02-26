import { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { colors, spacing, borderRadius, fontSize } from "../styles/theme";
import { scrapeRecipe, ScraperError } from "../services/recipeScraper";
import { useRecipes } from "../contexts/RecipesContext";
import type { StoredRecipe } from "../types/recipe";

type Props = {
  visible: boolean;
  onClose: () => void;
  onImported: (recipe: StoredRecipe) => void;
};

export function ImportModal({ visible, onClose, onImported }: Props) {
  const { saveRecipe } = useRecipes();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const urlInputRef = useRef<TextInput>(null);

  const handleImport = async () => {
    setError(null);
    setLoading(true);
    try {
      const recipe = await scrapeRecipe(url);
      setUrl("");
      onClose();
      const stored = await saveRecipe(recipe);
      onImported(stored);
    } catch (err) {
      if (err instanceof ScraperError) {
        setError(err.message);
      } else {
        setError("Une erreur inattendue est survenue");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUrl("");
    setError(null);
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={handleClose}
      statusBarTranslucent
      onShow={() => setTimeout(() => urlInputRef.current?.focus(), 50)}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.content} onPress={() => {}}>
          <Text style={styles.title}>Nouvelle recette</Text>
          <Text style={styles.body}>
            Collez le lien d'une recette pour l'importer
          </Text>
          <TextInput
            ref={urlInputRef}
            style={styles.input}
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
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
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
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 120,
  },
  content: {
    width: "85%",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: "center",
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.background,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.md,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  buttons: {
    flexDirection: "row",
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
    fontWeight: "600",
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
    fontWeight: "600",
  },
});
