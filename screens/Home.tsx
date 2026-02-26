import { useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  LayoutAnimation,
} from "react-native";
import DraggableFlatList, {
  type RenderItemParams,
} from "react-native-draggable-flatlist";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { spacing, borderRadius, fontSize, shadow } from "../styles/theme";
import { useColors } from "../contexts/SettingsContext";
import { useRecipes } from "../contexts/RecipesContext";
import type { ListItem } from "../types/recipe";
import { isSeparator } from "../types/recipe";
import type { RootStackParamList } from "../types/navigation";
import { RecipeCard } from "../components/RecipeCard";
import { SeparatorCard } from "../components/SeparatorCard";
import { ImportModal } from "../components/ImportModal";
import { AddSeparatorModal } from "../components/AddSeparatorModal";
import { SearchModal } from "../components/SearchModal";
import { HomeHeader } from "../components/HomeHeader";
import { SettingsModal } from "../components/SettingsModal";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function Home({ navigation }: Props) {
  const colors = useColors();
  const { items, reorderItems, deleteItem } = useRecipes();
  const [importVisible, setImportVisible] = useState(false);
  const [separatorVisible, setSeparatorVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
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
    () => items.filter(isSeparator).map((s) => s.id),
    [items],
  );
  const allCollapsed =
    allSeparatorIds.length > 0 && allSeparatorIds.every((id) => collapsedIds.has(id));

  const handleToggleAll = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsedIds(allCollapsed ? new Set() : new Set(allSeparatorIds));
  }, [allCollapsed, allSeparatorIds]);

  const hiddenChildrenMap = useMemo(() => {
    const map = new Map<string, ListItem[]>();
    let currentSepId: string | null = null;
    for (const item of items) {
      if (isSeparator(item)) {
        currentSepId = collapsedIds.has(item.id) ? item.id : null;
      } else if (currentSepId) {
        const children = map.get(currentSepId) ?? [];
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
            onDelete={() => deleteItem(item.id)}
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
    [navigation, collapsedIds, toggleCollapsed, deleteItem],
  );

  const handleDragEnd = useCallback(
    ({ data }: { data: ListItem[] }) => {
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HomeHeader
        allCollapsed={allCollapsed}
        onToggleAll={handleToggleAll}
        onAddSeparator={() => setSeparatorVisible(true)}
        onSettings={() => setSettingsVisible(true)}
      />

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
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

      <TouchableOpacity style={[styles.fabSmall, { backgroundColor: colors.surface }]} onPress={() => setSearchVisible(true)}>
        <Ionicons name="search" size={20} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setImportVisible(true)}>
        <Ionicons name="add" size={32} color={colors.surface} />
      </TouchableOpacity>

      <ImportModal
        visible={importVisible}
        onClose={() => setImportVisible(false)}
        onImported={(recipe) => navigation.navigate("RecipeDetail", { recipe })}
      />
      <AddSeparatorModal
        visible={separatorVisible}
        onClose={() => setSeparatorVisible(false)}
      />
      <SearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        onSelectRecipe={(recipe) => navigation.navigate("RecipeDetail", { recipe })}
      />
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyStateText: {
    fontSize: fontSize.md,
    textAlign: "center",
    lineHeight: 24,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
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
});
