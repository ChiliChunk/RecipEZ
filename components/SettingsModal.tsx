import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { StorageAccessFramework, writeAsStringAsync, EncodingType } from "expo-file-system/legacy";
import { File } from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { spacing, borderRadius, fontSize } from "../styles/theme";
import { useSettings, useColors, type AppIcon } from "../contexts/SettingsContext";
import { useRecipes } from "../contexts/RecipesContext";

type Props = {
  visible: boolean;
  onClose: () => void;
};

type ImportStep =
  | { stage: "confirm"; parsed: unknown[]; details: string; recipeCount: number }
  | { stage: "loading" }
  | { stage: "done"; success: true; details: string; recipeCount: number }
  | { stage: "done"; success: false; message: string };

const ICONS: { key: AppIcon; label: string; image: ReturnType<typeof require> }[] = [
  { key: "wow_cooking", label: "Classic", image: require("../assets/wowCooking.png") },
  { key: "modern", label: "Modern", image: require("../assets/icon.png") },
];

export function SettingsModal({ visible, onClose }: Props) {
  const { appIcon, setAppIcon, darkMode, toggleDarkMode } = useSettings();
  const colors = useColors();
  const { items, importItems } = useRecipes();
  const [exporting, setExporting] = useState(false);
  const [importStep, setImportStep] = useState<ImportStep | null>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const json = JSON.stringify(items, null, 2);
      const filename = `recipease_export_${new Date().toISOString().slice(0, 10)}.json`;
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) { setExporting(false); return; }
      const uri = await StorageAccessFramework.createFileAsync(
        permissions.directoryUri, filename, "application/json",
      );
      await writeAsStringAsync(uri, json, { encoding: EncodingType.UTF8 });
      Alert.alert("Export réussi", `Fichier sauvegardé : ${filename}`);
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    try {
      const content = await new File(result.assets[0].uri).text();
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) throw new Error("Format invalide");
      const recipeCount = parsed.filter((i: { type?: string }) => i.type !== "separator").length;
      const sepCount = parsed.filter((i: { type?: string }) => i.type === "separator").length;
      const details = [
        `${recipeCount} recette${recipeCount > 1 ? "s" : ""}`,
        sepCount > 0 ? `${sepCount} séparateur${sepCount > 1 ? "s" : ""}` : null,
      ].filter(Boolean).join(" et ");
      setImportStep({ stage: "confirm", parsed, details, recipeCount });
    } catch (e) {
      setImportStep({ stage: "done", success: false, message: e instanceof Error ? e.message : String(e) });
    }
  };

  const confirmImport = async () => {
    if (!importStep || importStep.stage !== "confirm") return;
    const { parsed, details, recipeCount } = importStep;
    setImportStep({ stage: "loading" });
    try {
      await importItems(parsed as Parameters<typeof importItems>[0]);
      setImportStep({ stage: "done", success: true, details, recipeCount });
    } catch (e) {
      setImportStep({ stage: "done", success: false, message: e instanceof Error ? e.message : String(e) });
    }
  };

  const renderImportModalContent = () => {
    if (!importStep) return null;

    if (importStep.stage === "loading") {
      return (
        <View style={styles.importModalInner}>
          <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: spacing.md }} />
          <Text style={[styles.confirmTitle, { color: colors.text }]}>Import en cours…</Text>
        </View>
      );
    }

    if (importStep.stage === "done") {
      return (
        <View style={styles.importModalInner}>
          <MaterialIcons
            name={importStep.success ? "check-circle" : "error"}
            size={40}
            color={importStep.success ? colors.success : colors.error}
            style={{ marginBottom: spacing.md }}
          />
          <Text style={[styles.confirmTitle, { color: colors.text }]}>
            {importStep.success ? "Import réussi" : "Erreur"}
          </Text>
          <Text style={[styles.confirmBody, { color: colors.textMuted }]}>
            {importStep.success
              ? `${importStep.details} importé${importStep.recipeCount > 1 ? "es" : "e"} avec succès.`
              : importStep.message}
          </Text>
          <View style={styles.confirmButtons}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => setImportStep(null)}
            >
              <Text style={[styles.primaryButtonText, { color: colors.surface }]}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // stage === "confirm"
    return (
      <View style={styles.importModalInner}>
        <Text style={[styles.confirmTitle, { color: colors.text }]}>Confirmer l'import</Text>
        <Text style={[styles.confirmBody, { color: colors.textMuted }]}>
          Ce fichier contient {importStep.details}.{"\n\n"}
          Cet import remplacera toutes vos données actuelles. Cette action est irréversible.
        </Text>
        <View style={styles.confirmButtons}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={() => setImportStep(null)}
          >
            <Text style={[styles.cancelButtonText, { color: colors.textMuted }]}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.destructiveButton, { backgroundColor: colors.error }]}
            onPress={confirmImport}
          >
            <Text style={[styles.destructiveButtonText, { color: colors.surface }]}>Importer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <>
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

            <Text style={[styles.sectionLabel, { color: colors.textMuted, marginTop: spacing.lg }]}>Données</Text>
            <TouchableOpacity
              style={[styles.dataButton, { borderColor: colors.border }]}
              onPress={handleExport}
              disabled={exporting}
              activeOpacity={0.7}
            >
              <MaterialIcons name="download" size={20} color={colors.primary} />
              <Text style={[styles.dataButtonLabel, { color: colors.text }]}>
                {exporting ? "Export en cours…" : "Exporter mes recettes"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dataButton, { borderColor: colors.border, marginTop: spacing.sm }]}
              onPress={handleImport}
              activeOpacity={0.7}
            >
              <MaterialIcons name="upload" size={20} color={colors.primary} />
              <Text style={[styles.dataButtonLabel, { color: colors.text }]}>Importer des recettes</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={importStep !== null}
        onRequestClose={() => importStep?.stage !== "loading" && setImportStep(null)}
        statusBarTranslucent
      >
        <Pressable
          style={[styles.overlay, { backgroundColor: colors.overlay }]}
          onPress={() => importStep?.stage !== "loading" && setImportStep(null)}
        >
          <Pressable style={[styles.importModalContent, { backgroundColor: colors.surface }]} onPress={() => {}}>
            {renderImportModalContent()}
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
  dataButton: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  dataButtonLabel: {
    fontSize: fontSize.md,
    fontWeight: "500",
  },
  importModalContent: {
    width: "85%",
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: "center",
  },
  importModalInner: {
    width: "100%",
    alignItems: "center",
  },
  confirmTitle: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  confirmBody: {
    fontSize: fontSize.md,
    textAlign: "center",
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  confirmButtons: {
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
  destructiveButton: {
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
  },
  destructiveButtonText: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.sm,
  },
  primaryButtonText: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
});
