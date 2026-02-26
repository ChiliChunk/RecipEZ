import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, darkColors } from "../styles/theme";

export type AppIcon = "wow_cooking" | "modern";
export type ThemeColors = typeof colors;

type SettingsContextType = {
  appIcon: AppIcon;
  setAppIcon: (icon: AppIcon) => Promise<void>;
  darkMode: boolean;
  toggleDarkMode: () => void;
  themeColors: ThemeColors;
};

const SettingsContext = createContext<SettingsContextType | null>(null);

const KEY_ICON = "settings:appIcon";
const KEY_DARK = "settings:darkMode";

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [appIcon, setAppIconState] = useState<AppIcon>("wow_cooking");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([KEY_ICON, KEY_DARK]).then(([[, icon], [, dark]]) => {
      if (icon === "wow_cooking" || icon === "modern") setAppIconState(icon);
      if (dark === "true") setDarkMode(true);
    });
  }, []);

  const setAppIcon = async (icon: AppIcon) => {
    setAppIconState(icon);
    await AsyncStorage.setItem(KEY_ICON, icon);
    try {
      const { setAppIcon: setNativeIcon } = await import("expo-dynamic-app-icon");
      await setNativeIcon(icon);
    } catch {
      // Silently fails in Expo Go
    }
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      AsyncStorage.setItem(KEY_DARK, String(next));
      return next;
    });
  };

  const themeColors = darkMode ? darkColors : colors;

  return (
    <SettingsContext.Provider value={{ appIcon, setAppIcon, darkMode, toggleDarkMode, themeColors }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
}

export function useColors(): ThemeColors {
  return useSettings().themeColors;
}
