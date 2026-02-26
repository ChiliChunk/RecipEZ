import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
} from "react-native";
import { colors, spacing, borderRadius, fontSize } from "../styles/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function SettingsModal({ visible, onClose }: Props) {
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

          {/* Contenu à venir */}
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Aucun paramètre disponible pour l'instant</Text>
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
    marginBottom: spacing.lg,
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: "center",
  },
});
