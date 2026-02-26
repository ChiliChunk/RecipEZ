import { useState, useRef, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  Image,
  FlatList,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, borderRadius, fontSize } from "../styles/theme";
import { useColors } from "../contexts/SettingsContext";
import { useRecipes } from "../contexts/RecipesContext";
import { isSeparator } from "../types/recipe";
import type { StoredRecipe } from "../types/recipe";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectRecipe: (recipe: StoredRecipe) => void;
};

export function SearchModal({ visible, onClose, onSelectRecipe }: Props) {
  const colors = useColors();
  const { items } = useRecipes();
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<TextInput>(null);

  const searchResults = useMemo<StoredRecipe[]>(() => {
    if (!searchQuery.trim()) return items.filter((i): i is StoredRecipe => !isSeparator(i));
    const q = searchQuery.toLowerCase();
    return items.filter(
      (i): i is StoredRecipe => !isSeparator(i) && i.title.toLowerCase().includes(q),
    );
  }, [items, searchQuery]);

  const handleClose = () => {
    setSearchQuery("");
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={handleClose}
      statusBarTranslucent
      onShow={() => setTimeout(() => inputRef.current?.focus(), 50)}
    >
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={handleClose}>
        <Pressable style={[styles.container, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <View style={[styles.inputRow, { borderBottomColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.primary} style={styles.searchIcon} />
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.text }]}
              placeholder="Rechercher une recette..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleClose}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              style={styles.resultsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => {
                    handleClose();
                    onSelectRecipe(item);
                  }}
                  activeOpacity={0.7}
                >
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.resultImage} />
                  ) : (
                    <View style={[styles.resultImage, styles.resultImagePlaceholder, { backgroundColor: colors.primaryLight }]}>
                      <Text style={{ fontSize: 16 }}>🍽</Text>
                    </View>
                  )}
                  <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={[styles.resultSeparator, { backgroundColor: colors.border }]} />}
            />
          ) : (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Aucune recette trouvée</Text>
            </View>
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
    paddingTop: 80,
    paddingHorizontal: spacing.md,
  },
  container: {
    borderRadius: borderRadius.md,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: fontSize.lg,
    paddingVertical: 4,
  },
  resultsList: {
    maxHeight: 340,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  resultImage: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
  },
  resultImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  resultTitle: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: "500",
  },
  resultSeparator: {
    height: 1,
    marginLeft: spacing.md + 40 + spacing.sm,
  },
  empty: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: fontSize.md,
  },
});
