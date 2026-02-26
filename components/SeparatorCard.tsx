import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { ScaleDecorator } from "react-native-draggable-flatlist";
import { Ionicons } from "@expo/vector-icons";
import { spacing, fontSize } from "../styles/theme";
import { useColors } from "../contexts/SettingsContext";

export function SeparatorCard({
  name,
  drag,
  isActive,
  collapsed,
  onToggle,
  onDelete,
}: {
  name: string;
  drag: () => void;
  isActive: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
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
        <Text style={[styles.separatorText, { color: colors.primary }]}>{name}</Text>
        <View style={[styles.separatorLine, { backgroundColor: colors.primaryLight }]} />
        <TouchableOpacity onPress={onDelete} hitSlop={8} style={styles.separatorDelete}>
          <Ionicons name="close" size={14} color={colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    </ScaleDecorator>
  );
}

const styles = StyleSheet.create({
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
  },
  separatorChevron: {
    marginRight: 2,
  },
  separatorDelete: {
    marginLeft: spacing.xs,
  },
  separatorText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    paddingHorizontal: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
