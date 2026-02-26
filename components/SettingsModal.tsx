import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  TouchableOpacity,
  Image,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, fontSize } from "../styles/theme";
import { useSettings, type AppIcon } from "../contexts/SettingsContext";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const ICONS: { key: AppIcon; label: string; image: ReturnType<typeof require> }[] = [
  { key: "wowCooking", label: "Classic", image: require("../assets/wowCooking.png") },
  { key: "modern", label: "Modern", image: require("../assets/icon.png") },
];

export function SettingsModal({ visible, onClose }: Props) {
  const { appIcon, setAppIcon } = useSettings();

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.content} onPress={() => {}}>
          <Text style={styles.title}>Paramètres</Text>

          <Text style={styles.sectionLabel}>Icône de l'application</Text>
          <View style={styles.iconRow}>
            {ICONS.map(({ key, label, image }) => {
              const selected = appIcon === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.iconOption, selected && styles.iconOptionSelected]}
                  onPress={() => setAppIcon(key)}
                  activeOpacity={0.7}
                >
                  <Image source={image} style={styles.iconPreview} resizeMode="cover" />
                  <Text style={[styles.iconLabel, selected && styles.iconLabelSelected]}>
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
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "85%",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: "center",
    minHeight: 320,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textMuted,
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
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  iconOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  iconPreview: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },
  iconLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textMuted,
  },
  iconLabelSelected: {
    color: colors.primary,
  },
  iconCheck: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
  },
});
