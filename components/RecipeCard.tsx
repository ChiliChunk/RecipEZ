import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import { ScaleDecorator } from "react-native-draggable-flatlist";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { spacing, borderRadius, fontSize, shadow } from "../styles/theme";
import { useColors } from "../contexts/SettingsContext";
import type { StoredRecipe } from "../types/recipe";

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

export function RecipeCard({
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
  const colors = useColors();
  const prepTime = formatDuration(recipe.prepTime);
  const cookTime = formatDuration(recipe.cookTime);

  return (
    <ScaleDecorator>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface }, isActive && styles.cardActive]}
        onPress={onPress}
        onLongPress={drag}
        delayLongPress={150}
        activeOpacity={0.75}
        disabled={isActive}
      >
        {recipe.imageUrl ? (
          <Image source={{ uri: recipe.imageUrl }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder, { backgroundColor: colors.primaryLight }]}>
            <Text style={styles.cardImagePlaceholderText}>🍽</Text>
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
            {recipe.title}
          </Text>
          {(prepTime || cookTime) && (
            <View style={styles.cardTimeRow}>
              {prepTime && (
                <View style={styles.cardTimeItem}>
                  <MaterialCommunityIcons
                    name="chef-hat"
                    size={14}
                    color={colors.primary}
                    style={styles.cardTimeIcon}
                  />
                  <Text style={[styles.cardServings, { color: colors.textMuted }]}>{prepTime}</Text>
                </View>
              )}
              {cookTime && (
                <View style={styles.cardTimeItem}>
                  <MaterialCommunityIcons
                    name="stove"
                    size={14}
                    color={colors.primary}
                    style={styles.cardTimeIcon}
                  />
                  <Text style={[styles.cardServings, { color: colors.textMuted }]}>{cookTime}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </ScaleDecorator>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
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
    marginBottom: 4,
  },
  cardServings: {
    fontSize: fontSize.sm,
  },
  cardTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  cardTimeItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardTimeIcon: {
    marginRight: 4,
  },
});
