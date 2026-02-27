import { useState } from "react";
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
  Modal,
  Pressable,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { spacing, borderRadius, fontSize, shadow } from "../styles/theme";
import { useColors } from "../contexts/SettingsContext";
import { useRecipes } from "../contexts/RecipesContext";
import type { RootStackParamList } from "../types/navigation";
import type { StoredRecipe } from "../types/recipe";

type Props = NativeStackScreenProps<RootStackParamList, "RecipeDetail">;

function formatDuration(iso: string | null): string | null {
  if (!iso) return null;
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
  if (!match) return iso;
  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  if (hours && minutes) return `${hours}h${String(minutes).padStart(2, "0")}`;
  if (hours) return `${hours}h`;
  if (minutes) return `${minutes} min`;
  return null;
}

export default function RecipeDetail({ navigation, route }: Props) {
  const colors = useColors();
  const { updateRecipe, deleteItem } = useRecipes();
  const { recipe } = route.params;

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editServings, setEditServings] = useState("");
  const [editIngredients, setEditIngredients] = useState<string[]>([]);
  const [editInstructions, setEditInstructions] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const handleEditPress = () => {
    setEditTitle(recipe.title);
    setEditServings(recipe.servings ?? "");
    setEditIngredients([...recipe.ingredients]);
    setEditInstructions([...recipe.instructions]);
    setEditNotes(recipe.notes ?? "");
    setIsEditing(true);
  };

  const handleCancel = () => setIsEditing(false);

  const handleSave = async () => {
    setSaving(true);
    const updated: StoredRecipe = {
      ...recipe,
      title: editTitle.trim(),
      servings: editServings.trim() || null,
      ingredients: editIngredients.filter((i) => i.trim() !== ""),
      instructions: editInstructions.filter((s) => s.trim() !== ""),
      notes: editNotes.trim() || undefined,
    };
    await updateRecipe(updated);
    navigation.setParams({ recipe: updated });
    setSaving(false);
    setIsEditing(false);
  };

  const prepTime = formatDuration(recipe.prepTime);
  const cookTime = formatDuration(recipe.cookTime);
  const totalTime = formatDuration(recipe.totalTime);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        {isEditing ? (
          <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
            <Text style={[styles.backText, { color: colors.primary }]}>
              ✕ Annuler
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backText, { color: colors.primary }]}>
              ← Retour
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {isEditing ? (
          <View style={styles.editContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Titre
            </Text>
            <TextInput
              style={[
                styles.editInput,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.surface,
                },
              ]}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Titre de la recette"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Portions
            </Text>
            <TextInput
              style={[
                styles.editInput,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.surface,
                },
              ]}
              value={editServings}
              onChangeText={setEditServings}
              placeholder="ex: 4 personnes"
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.notesTitleRow}>
              <Feather name="edit-3" size={15} color={colors.primary} />
              <Text
                style={[styles.notesSectionTitle, { color: colors.primary }]}
              >
                Mes notes
              </Text>
            </View>
            <TextInput
              style={[
                styles.editInput,
                styles.notesInput,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.surface,
                },
              ]}
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder="Ajoutez vos notes personnelles…"
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Ingrédients
            </Text>
            {editIngredients.map((item, index) => (
              <View key={index} style={styles.editListRow}>
                <TextInput
                  style={[
                    styles.editInput,
                    styles.editListInput,
                    {
                      borderColor: colors.border,
                      color: colors.text,
                      backgroundColor: colors.surface,
                    },
                  ]}
                  value={item}
                  onChangeText={(text) => {
                    const next = [...editIngredients];
                    next[index] = text;
                    setEditIngredients(next);
                  }}
                  multiline
                />
                <TouchableOpacity
                  onPress={() =>
                    setEditIngredients(
                      editIngredients.filter((_, i) => i !== index),
                    )
                  }
                  style={styles.deleteButton}
                >
                  <Feather name="x" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addItemButton}
              onPress={() => setEditIngredients([...editIngredients, ""])}
            >
              <Feather name="plus" size={16} color={colors.primary} />
              <Text style={[styles.addItemText, { color: colors.primary }]}>
                Ajouter un ingrédient
              </Text>
            </TouchableOpacity>

            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, marginTop: spacing.lg },
              ]}
            >
              Étapes
            </Text>
            {editInstructions.map((step, index) => (
              <View key={index} style={styles.editListRow}>
                <View
                  style={[
                    styles.stepNumberSmall,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumberSmallText,
                      { color: colors.surface },
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.editInput,
                    styles.editListInput,
                    {
                      borderColor: colors.border,
                      color: colors.text,
                      backgroundColor: colors.surface,
                    },
                  ]}
                  value={step}
                  onChangeText={(text) => {
                    const next = [...editInstructions];
                    next[index] = text;
                    setEditInstructions(next);
                  }}
                  multiline
                />
                <TouchableOpacity
                  onPress={() =>
                    setEditInstructions(
                      editInstructions.filter((_, i) => i !== index),
                    )
                  }
                  style={styles.deleteButton}
                >
                  <Feather name="x" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addItemButton}
              onPress={() => setEditInstructions([...editInstructions, ""])}
            >
              <Feather name="plus" size={16} color={colors.primary} />
              <Text style={[styles.addItemText, { color: colors.primary }]}>
                Ajouter une étape
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {recipe.imageUrl && (
              <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
            )}

            <Text style={[styles.title, { color: colors.text }]}>
              {recipe.title}
            </Text>

            {(prepTime || cookTime || totalTime || recipe.servings) && (
              <View style={styles.infoRow}>
                {prepTime && (
                  <View
                    style={[
                      styles.infoBadge,
                      { backgroundColor: colors.primaryLight },
                    ]}
                  >
                    <Text style={[styles.infoLabel, { color: colors.text }]}>
                      Prépa
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {prepTime}
                    </Text>
                  </View>
                )}
                {cookTime && (
                  <View
                    style={[
                      styles.infoBadge,
                      { backgroundColor: colors.primaryLight },
                    ]}
                  >
                    <Text style={[styles.infoLabel, { color: colors.text }]}>
                      Cuisson
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {cookTime}
                    </Text>
                  </View>
                )}
                {totalTime && (
                  <View
                    style={[
                      styles.infoBadge,
                      { backgroundColor: colors.primaryLight },
                    ]}
                  >
                    <Text style={[styles.infoLabel, { color: colors.text }]}>
                      Total
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {totalTime}
                    </Text>
                  </View>
                )}
                {recipe.servings && (
                  <View
                    style={[
                      styles.infoBadge,
                      { backgroundColor: colors.primaryLight },
                    ]}
                  >
                    <Text style={[styles.infoLabel, { color: colors.text }]}>
                      Portions
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {recipe.servings}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View
              style={[
                styles.notesCard,
                {
                  backgroundColor: colors.surface,
                  borderLeftColor: colors.primary,
                },
              ]}
            >
              <View style={styles.notesTitleRow}>
                <Feather name="edit-3" size={15} color={colors.primary} />
                <Text
                  style={[styles.notesSectionTitle, { color: colors.primary }]}
                >
                  Mes notes
                </Text>
              </View>
              {recipe.notes ? (
                <Text style={[styles.notesText, { color: colors.text }]}>
                  {recipe.notes}
                </Text>
              ) : (
                <Text style={[styles.notesEmpty, { color: colors.textMuted }]}>
                  Aucune note{" "}
                </Text>
              )}
            </View>

            {recipe.ingredients.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Ingrédients
                </Text>
                {recipe.ingredients.map((ingredient, index) => (
                  <View key={index} style={styles.ingredientRow}>
                    <Text style={[styles.bullet, { color: colors.primary }]}>
                      •
                    </Text>
                    <Text
                      style={[styles.ingredientText, { color: colors.text }]}
                    >
                      {ingredient}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {recipe.instructions.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Étapes
                </Text>
                {recipe.instructions.map((step, index) => (
                  <View key={index} style={styles.stepRow}>
                    <View
                      style={[
                        styles.stepNumber,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepNumberText,
                          { color: colors.surface },
                        ]}
                      >
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={[styles.stepText, { color: colors.text }]}>
                      {step}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.sourceLink}
              onPress={() => Linking.openURL(recipe.sourceUrl)}
            >
              <Text style={[styles.sourceLinkText, { color: colors.primary }]}>
                Voir la recette originale
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {isEditing ? (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Feather name="check" size={24} color={colors.surface} />
          )}
        </TouchableOpacity>
      ) : (
        <>
          <TouchableOpacity
            style={[styles.fabSmall, { backgroundColor: colors.error }]}
            onPress={() => setDeleteModalVisible(true)}
          >
            <Feather name="trash-2" size={18} color={colors.surface} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: colors.primary }]}
            onPress={handleEditPress}
          >
            <Feather name="edit" size={24} color={colors.surface} />
          </TouchableOpacity>
        </>
      )}

      <Modal
        animationType="fade"
        transparent
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
        statusBarTranslucent
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          onPress={() => setDeleteModalVisible(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
            onPress={() => {}}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Supprimer la recette
            </Text>
            <Text style={[styles.modalBody, { color: colors.textMuted }]}>
              Voulez-vous vraiment supprimer cette recette ?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text
                  style={[styles.cancelButtonText, { color: colors.textMuted }]}
                >
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deleteConfirmButton,
                  { backgroundColor: colors.error },
                ]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  deleteItem(recipe.id);
                  navigation.goBack();
                }}
              >
                <Text
                  style={[
                    styles.deleteConfirmButtonText,
                    { color: colors.surface },
                  ]}
                >
                  Supprimer
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontWeight: "600",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  image: {
    width: "100%",
    height: 250,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  infoBadge: {
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: fontSize.sm,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginBottom: spacing.sm,
  },
  ingredientRow: {
    flexDirection: "row",
    paddingVertical: 4,
  },
  bullet: {
    fontSize: fontSize.md,
    marginRight: spacing.xs,
    lineHeight: 22,
  },
  ingredientText: {
    flex: 1,
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  stepRow: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: fontSize.sm,
    fontWeight: "bold",
  },
  stepText: {
    flex: 1,
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  sourceLink: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  sourceLinkText: {
    fontSize: fontSize.sm,
    textDecorationLine: "underline",
  },
  fabSmall: {
    position: "absolute",
    bottom: spacing.xxl + 64 + spacing.sm,
    right: spacing.lg + 10,
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    elevation: shadow.elevation,
    shadowColor: shadow.color,
    shadowOffset: shadow.offset,
    shadowOpacity: shadow.opacity,
    shadowRadius: shadow.radius,
  },
  fab: {
    position: "absolute",
    bottom: spacing.xxl,
    right: spacing.lg,
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    elevation: shadow.elevation,
    shadowColor: shadow.color,
    shadowOffset: shadow.offset,
    shadowOpacity: shadow.opacity,
    shadowRadius: shadow.radius,
  },
  editContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: fontSize.md,
    marginBottom: spacing.sm,
  },
  editListRow: {
    flexDirection: "row",
    alignItems: "flex-start",
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
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  addItemText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  stepNumberSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    flexShrink: 0,
  },
  stepNumberSmallText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  notesInput: {
    minHeight: 100,
  },
  notesCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    paddingLeft: spacing.md,
  },
  notesTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  notesSectionTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    fontStyle: "italic",
  },
  notesText: {
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  notesEmpty: {
    fontSize: fontSize.sm,
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginBottom: spacing.sm,
  },
  modalBody: {
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
  },
  modalButtons: {
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
  deleteConfirmButton: {
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
  },
  deleteConfirmButtonText: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
});
