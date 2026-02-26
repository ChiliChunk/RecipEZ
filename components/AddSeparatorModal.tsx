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
import { colors, spacing, borderRadius, fontSize } from "../styles/theme";
import { useRecipes } from "../contexts/RecipesContext";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function AddSeparatorModal({ visible, onClose }: Props) {
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
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.content} onPress={() => {}}>
          <Text style={styles.title}>Nouveau séparateur</Text>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Nom du séparateur"
            placeholderTextColor={colors.textMuted}
            value={separatorName}
            onChangeText={setSeparatorName}
          />
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, !separatorName.trim() && styles.submitButtonDisabled]}
              disabled={!separatorName.trim()}
              onPress={handleAdd}
            >
              <Text style={styles.submitButtonText}>Ajouter</Text>
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
    backgroundColor: colors.overlay,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 120,
  },
  content: {
    width: "85%",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: "center",
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
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
  buttons: {
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
});
