import { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
} from "react-native";
import { spacing, borderRadius, fontSize } from "../styles/theme";
import { useColors } from "../contexts/SettingsContext";
import { useRecipes } from "../contexts/RecipesContext";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function AddSeparatorModal({ visible, onClose }: Props) {
  const colors = useColors();
  const { addSeparator } = useRecipes();
  const [separatorName, setSeparatorName] = useState("");
  const inputRef = useRef<TextInput>(null);

  const handleAdd = async () => {
    const name = separatorName.trim();
    if (!name) return;
    await addSeparator(name);
    setSeparatorName("");
    onClose();
  };

  const handleClose = () => {
    setSeparatorName("");
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
        <Pressable style={[styles.content, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <Text style={[styles.title, { color: colors.text }]}>Nouveau séparateur</Text>
          <TextInput
            ref={inputRef}
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
            placeholder="Nom du séparateur"
            placeholderTextColor={colors.textMuted}
            value={separatorName}
            onChangeText={setSeparatorName}
          />
          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.border }]} onPress={handleClose}>
              <Text style={[styles.cancelButtonText, { color: colors.textMuted }]}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }, !separatorName.trim() && styles.submitButtonDisabled]}
              disabled={!separatorName.trim()}
              onPress={handleAdd}
            >
              <Text style={[styles.submitButtonText, { color: colors.surface }]}>Ajouter</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 120,
  },
  content: {
    width: "85%",
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: "center",
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginBottom: spacing.sm,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
  },
  buttons: {
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
  submitButton: {
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
});
