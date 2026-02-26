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
import { spacing, borderRadius, fontSize } from "../styles/theme";
import { useColors } from "../contexts/SettingsContext";
import { scrapeRecipe, ScraperError } from "../services/recipeScraper";
import { useRecipes } from "../contexts/RecipesContext";
import type { StoredRecipe } from "../types/recipe";

type Props = {
  visible: boolean;
  onClose: () => void;
  onImported: (recipe: StoredRecipe) => void;
};

export function ImportModal({ visible, onClose, onImported }: Props) {
  const colors = useColors();
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
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={handleClose}>
        <Pressable style={[styles.content, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <Text style={[styles.title, { color: colors.text }]}>Nouvelle recette</Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            Collez le lien d'une recette pour l'importer
          </Text>
          <TextInput
            ref={urlInputRef}
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
            placeholder="https://..."
            placeholderTextColor={colors.textMuted}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            selectTextOnFocus
          />
          {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.border }]} onPress={handleClose}>
              <Text style={[styles.cancelButtonText, { color: colors.textMuted }]}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }, (!url || loading) && styles.submitButtonDisabled]}
              disabled={!url || loading}
              onPress={handleImport}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Text style={[styles.submitButtonText, { color: colors.surface }]}>Importer</Text>
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
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 120,
  },
  content: {
    width: "85%",
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: "center",
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
  },
  errorText: {
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
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  submitButton: {
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
});
