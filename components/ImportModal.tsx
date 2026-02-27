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
import { Feather } from "@expo/vector-icons";
import { spacing, borderRadius, fontSize } from "../styles/theme";
import { useColors } from "../contexts/SettingsContext";
import { scrapeRecipe, ScraperError } from "../services/recipeScraper";
import { useRecipes } from "../contexts/RecipesContext";
import type { StoredRecipe } from "../types/recipe";

type Props = {
  visible: boolean;
  onClose: () => void;
  onImported: (recipe: StoredRecipe) => void;
  onCreateManual: (recipe: StoredRecipe) => void;
};

export function ImportModal({ visible, onClose, onImported, onCreateManual }: Props) {
  const colors = useColors();
  const { saveRecipe } = useRecipes();
  const [mode, setMode] = useState<"import" | "manual" | "photo">("import");
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

  const handleCreateManual = async () => {
    setLoading(true);
    const stored = await saveRecipe({
      title: "Nouvelle recette",
      imageUrl: null,
      ingredients: [],
      instructions: [],
      prepTime: null,
      cookTime: null,
      totalTime: null,
      servings: null,
      sourceUrl: `local://${Date.now()}`,
    });
    setLoading(false);
    onClose();
    onCreateManual(stored);
  };

  const handleClose = () => {
    setUrl("");
    setError(null);
    setMode("import");
    onClose();
  };

  const switchMode = (next: "import" | "manual" | "photo") => {
    setMode(next);
    setError(null);
    if (next === "import") setTimeout(() => urlInputRef.current?.focus(), 50);
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={handleClose}
      statusBarTranslucent
      onShow={() => switchMode("import")}
    >
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={handleClose}>
        <Pressable style={[styles.content, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <Text style={[styles.title, { color: colors.text }]}>Nouvelle recette</Text>

          {/* Tabs */}
          <View style={[styles.tabs, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.tab, mode === "import" && { backgroundColor: colors.primary }]}
              onPress={() => switchMode("import")}
            >
              <Feather name="link" size={14} color={mode === "import" ? colors.surface : colors.textMuted} />
              <Text style={[styles.tabText, { color: mode === "import" ? colors.surface : colors.textMuted }]}>
                Lien
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === "photo" && { backgroundColor: colors.primary }]}
              onPress={() => switchMode("photo")}
            >
              <Feather name="camera" size={14} color={mode === "photo" ? colors.surface : colors.textMuted} />
              <Text style={[styles.tabText, { color: mode === "photo" ? colors.surface : colors.textMuted }]}>
                Photo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === "manual" && { backgroundColor: colors.primary }]}
              onPress={() => switchMode("manual")}
            >
              <Feather name="edit-2" size={14} color={mode === "manual" ? colors.surface : colors.textMuted} />
              <Text style={[styles.tabText, { color: mode === "manual" ? colors.surface : colors.textMuted }]}>
                Manuel
              </Text>
            </TouchableOpacity>
          </View>

          {mode === "import" && (
            <>
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
            </>
          )}

          {mode === "photo" && (
            <>
              <View style={[styles.photoPlaceholder, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Feather name="camera" size={32} color={colors.textMuted} />
                <Text style={[styles.photoPlaceholderText, { color: colors.textMuted }]}>
                  Prenez en photo une recette et l'IA l'importera automatiquement
                </Text>
              </View>
              <Text style={[styles.comingSoon, { color: colors.textMuted, borderColor: colors.border }]}>
                Fonctionnalité à venir
              </Text>
              <View style={styles.buttons}>
                <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.border }]} onPress={handleClose}>
                  <Text style={[styles.cancelButtonText, { color: colors.textMuted }]}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, styles.submitButtonDisabled, { backgroundColor: colors.primary }]}
                  disabled
                >
                  <Text style={[styles.submitButtonText, { color: colors.surface }]}>Prendre une photo</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {mode === "manual" && (
            <>
              <Text style={[styles.body, { color: colors.textMuted }]}>
                Saisissez vous-même tous les éléments de la recette
              </Text>
              <View style={styles.buttons}>
                <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.border }]} onPress={handleClose}>
                  <Text style={[styles.cancelButtonText, { color: colors.textMuted }]}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: colors.primary }, loading && styles.submitButtonDisabled]}
                  disabled={loading}
                  onPress={handleCreateManual}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.surface} />
                  ) : (
                    <Text style={[styles.submitButtonText, { color: colors.surface }]}>Créer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
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
    marginBottom: spacing.md,
  },
  tabs: {
    flexDirection: "row",
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: spacing.lg,
    width: "100%",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  body: {
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
    textAlign: "center",
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
  photoPlaceholder: {
    width: "100%",
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  photoPlaceholderText: {
    fontSize: fontSize.sm,
    textAlign: "center",
    lineHeight: 20,
  },
  comingSoon: {
    fontSize: fontSize.sm,
    fontStyle: "italic",
    marginBottom: spacing.lg,
  },
});
