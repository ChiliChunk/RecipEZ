import { useState, useCallback, useMemo, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  Image,
  LayoutAnimation,
} from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from "react-native-draggable-flatlist";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  shadow,
} from "../styles/theme";
import { scrapeRecipe, ScraperError } from "../services/recipeScraper";
import { useRecipes } from "../contexts/RecipesContext";
import type { StoredRecipe, ListItem } from "../types/recipe";
import { isSeparator } from "../types/recipe";
import type { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

function RecipeCard({
  recipe,
  onPress,
  drag,
  isActive,
}: {
  recipe: StoredRecipe;
  onPress: () => void;
  drag: () => void;
  isActive: boolean;
}) {
  return (
    <ScaleDecorator>
      <TouchableOpacity
        style={[styles.card, isActive && styles.cardActive]}
        onPress={onPress}
        onLongPress={drag}
        delayLongPress={150}
        activeOpacity={0.75}
        disabled={isActive}
      >
        {recipe.imageUrl ? (
          <Image source={{ uri: recipe.imageUrl }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Text style={styles.cardImagePlaceholderText}>🍽</Text>
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {recipe.title}
          </Text>
          {recipe.servings && (
            <Text style={styles.cardServings}>{recipe.servings}</Text>
          )}
        </View>
      </TouchableOpacity>
    </ScaleDecorator>
  );
}

function SeparatorCard({
  name,
  drag,
  isActive,
  collapsed,
  onToggle,
}: {
  name: string;
  drag: () => void;
  isActive: boolean;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <ScaleDecorator>
      <TouchableOpacity
        style={[styles.separator, isActive && styles.separatorActive]}
        onPress={onToggle}
        onLongPress={drag}
        delayLongPress={150}
        activeOpacity={0.75}
        disabled={isActive}
      >
        <Ionicons
          name={collapsed ? "chevron-forward" : "chevron-down"}
          size={16}
          color={colors.primary}
          style={styles.separatorChevron}
        />
        <Text style={styles.separatorText}>{name}</Text>
        <View style={styles.separatorLine} />
      </TouchableOpacity>
    </ScaleDecorator>
  );
}

export default function Home({ navigation }: Props) {
  const { items, saveRecipe, reorderItems, addSeparator } = useRecipes();
  const [modalVisible, setModalVisible] = useState(false);
  const [separatorModalVisible, setSeparatorModalVisible] = useState(false);
  const [separatorName, setSeparatorName] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const toggleCollapsed = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allSeparatorIds = useMemo(
    () => items.filter(isSeparator).map((separator) => separator.id),
    [items],
  );
  const allCollapsed =
    allSeparatorIds.length > 0 &&
    allSeparatorIds.every((id) => collapsedIds.has(id));

  const handleToggleAll = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (allCollapsed) {
      setCollapsedIds(new Set());
      return;
    }
    setCollapsedIds(new Set(allSeparatorIds));
  }, [allCollapsed, allSeparatorIds]);

  const handleCollapseAll = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const allSeparatorIds = items
      .filter(isSeparator)
      .map((separator) => separator.id);
    setCollapsedIds(new Set(allSeparatorIds));
  }, [items]);

  // Build a map of separator id -> hidden children for collapsed separators
  const hiddenChildrenMap = useMemo(() => {
    const map = new Map<string, ListItem[]>();
    let currentSepId: string | null = null;
    for (const item of items) {
      if (isSeparator(item)) {
        currentSepId = collapsedIds.has(item.id) ? item.id : null;
      } else if (currentSepId) {
        const children = map.get(currentSepId) || [];
        children.push(item);
        map.set(currentSepId, children);
      }
    }
    return map;
  }, [items, collapsedIds]);

  const visibleItems = useMemo(() => {
    const result: ListItem[] = [];
    let hiding = false;
    for (const item of items) {
      if (isSeparator(item)) {
        hiding = collapsedIds.has(item.id);
        result.push(item);
      } else if (!hiding) {
        result.push(item);
      }
    }
    return result;
  }, [items, collapsedIds]);

  const handleImport = async () => {
    setError(null);
    setLoading(true);
    try {
      const recipe = await scrapeRecipe(url);
      setUrl("");
      setModalVisible(false);
      const stored = await saveRecipe(recipe);
      navigation.navigate("RecipeDetail", { recipe: stored });
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

  const handleAddSeparator = async () => {
    const name = separatorName.trim();
    if (!name) return;
    await addSeparator(name);
    setSeparatorName("");
    setSeparatorModalVisible(false);
  };

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<ListItem>) => {
      if (isSeparator(item)) {
        return (
          <SeparatorCard
            name={item.name}
            drag={drag}
            isActive={isActive}
            collapsed={collapsedIds.has(item.id)}
            onToggle={() => toggleCollapsed(item.id)}
          />
        );
      }
      return (
        <RecipeCard
          recipe={item}
          onPress={() => navigation.navigate("RecipeDetail", { recipe: item })}
          drag={drag}
          isActive={isActive}
        />
      );
    },
    [navigation, collapsedIds, toggleCollapsed],
  );

  const handleDragEnd = useCallback(
    ({ data }: { data: ListItem[] }) => {
      // Reinsert hidden children after their collapsed separators
      const full: ListItem[] = [];
      for (const item of data) {
        full.push(item);
        if (isSeparator(item)) {
          const hidden = hiddenChildrenMap.get(item.id);
          if (hidden) full.push(...hidden);
        }
      }
      reorderItems(full);
    },
    [reorderItems, hiddenChildrenMap],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={handleToggleAll}
          hitSlop={8}
        >
          <MaterialIcons
            name={allCollapsed ? "unfold-more" : "unfold-less"}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
        <Text style={styles.title}>RecipEZ</Text>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => setSeparatorModalVisible(true)}
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name="bookmark-plus"
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Aucune recette enregistrée.{"\n"}Importez votre première recette !
          </Text>
        </View>
      ) : (
        <DraggableFlatList
          data={visibleItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onDragEnd={handleDragEnd}
          contentContainerStyle={styles.list}
        />
      )}

      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent
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
                  setUrl("");
                  setError(null);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!url || loading) && styles.submitButtonDisabled,
                ]}
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

      <Modal
        animationType="fade"
        transparent
        visible={separatorModalVisible}
        onRequestClose={() => setSeparatorModalVisible(false)}
        statusBarTranslucent
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSeparatorModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Nouveau séparateur</Text>
            <TextInput
              style={styles.urlInput}
              placeholder="Nom du séparateur"
              placeholderTextColor={colors.textMuted}
              value={separatorName}
              onChangeText={setSeparatorName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setSeparatorName("");
                  setSeparatorModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !separatorName.trim() && styles.submitButtonDisabled,
                ]}
                disabled={!separatorName.trim()}
                onPress={handleAddSeparator}
              >
                <Text style={styles.submitButtonText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={32} color={colors.surface} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 54,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerIconButton: {
    width: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontFamily: "Barriecito_400Regular",
    color: colors.primary,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyStateText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 24,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  separatorActive: {
    opacity: 0.8,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.primaryLight,
  },
  separatorChevron: {
    marginRight: 2,
  },
  separatorText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.primary,
    paddingHorizontal: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    overflow: "hidden",
    elevation: shadow.elevation,
    shadowColor: shadow.color,
    shadowOffset: shadow.offset,
    shadowOpacity: shadow.opacity,
    shadowRadius: shadow.radius,
  },
  cardActive: {
    opacity: 0.9,
    elevation: shadow.elevation + 4,
    shadowOpacity: shadow.opacity + 0.1,
  },
  cardImage: {
    width: 90,
    height: 90,
  },
  cardImagePlaceholder: {
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardImagePlaceholderText: {
    fontSize: fontSize.xl,
  },
  cardBody: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  cardServings: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  fab: {
    position: "absolute",
    bottom: spacing.xxl,
    right: spacing.lg,
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: shadow.elevation,
    shadowColor: shadow.color,
    shadowOffset: shadow.offset,
    shadowOpacity: shadow.opacity,
    shadowRadius: shadow.radius,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modalBody: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  urlInput: {
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
  modalButtons: {
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
  errorText: {
    color: colors.error,
    fontSize: fontSize.md,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
});
