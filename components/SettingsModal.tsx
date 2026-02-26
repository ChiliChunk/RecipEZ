import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  TouchableOpacity,
  Image,
  Switch,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { spacing, borderRadius, fontSize } from "../styles/theme";
import { useSettings, useColors, type AppIcon } from "../contexts/SettingsContext";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const ICONS: { key: AppIcon; label: string; image: ReturnType<typeof require> }[] = [
  { key: "wowCooking", label: "Classic", image: require("../assets/wowCooking.png") },
  { key: "modern", label: "Modern", image: require("../assets/icon.png") },
];

export function SettingsModal({ visible, onClose }: Props) {
  const { appIcon, setAppIcon, darkMode, toggleDarkMode } = useSettings();
  const colors = useColors();

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable style={[styles.content, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <Text style={[styles.title, { color: colors.text }]}>Paramètres</Text>

          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Icône de l'application</Text>
          <View style={styles.iconRow}>
            {ICONS.map(({ key, label, image }) => {
              const selected = appIcon === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.iconOption,
                    { borderColor: colors.border },
                    selected && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => setAppIcon(key)}
                  activeOpacity={0.7}
                >
                  <Image source={image} style={styles.iconPreview} resizeMode="cover" />
                  <Text style={[styles.iconLabel, { color: selected ? colors.primary : colors.textMuted }]}>
                    {label}
                  </Text>
                  {selected && (
                    <MaterialIcons
                      name="check-circle"
                      size={18}
                      color={colors.primary}
                      style={styles.iconCheck}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, { color: colors.textMuted, marginTop: spacing.lg }]}>Apparence</Text>
          <View style={styles.switchRow}>
            <MaterialIcons name="dark-mode" size={20} color={colors.textMuted} />
            <Text style={[styles.switchLabel, { color: colors.text }]}>Thème sombre</Text>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={darkMode ? colors.primary : colors.textMuted}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "85%",
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: "center",
    minHeight: 320,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    alignSelf: "flex-start",
    marginBottom: spacing.md,
  },
  iconRow: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "center",
    width: "100%",
  },
  iconOption: {
    flex: 1,
    alignItems: "center",
    borderWidth: 2,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  iconPreview: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },
  iconLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  iconCheck: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: spacing.sm,
  },
  switchLabel: {
    flex: 1,
    fontSize: fontSize.md,
  },
});
