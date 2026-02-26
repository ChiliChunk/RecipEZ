import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { colors, spacing, fontSize } from "../styles/theme";

type Props = {
  allCollapsed: boolean;
  onToggleAll: () => void;
  onAddSeparator: () => void;
  onSettings: () => void;
};

export function HomeHeader({ allCollapsed, onToggleAll, onAddSeparator, onSettings }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.side}>
        <TouchableOpacity style={styles.iconButton} onPress={onAddSeparator} hitSlop={8}>
          <MaterialCommunityIcons name="bookmark-plus" size={24} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={onToggleAll} hitSlop={8}>
          <MaterialIcons
            name={allCollapsed ? "unfold-more" : "unfold-less"}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Recipease</Text>
      <View style={[styles.side, styles.sideRight]}>
        <TouchableOpacity style={styles.iconButton} onPress={onSettings} hitSlop={8}>
          <MaterialIcons name="settings" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 54,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  side: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  sideRight: {
    justifyContent: "flex-end",
  },
  iconButton: {
    width: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontFamily: "Barriecito_400Regular",
    color: colors.primary,
  },
});
