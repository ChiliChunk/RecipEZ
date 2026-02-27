import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, darkColors } from "../styles/theme";

export type ThemeColors = typeof colors;

type SettingsContextType = {
  darkMode: boolean;
  toggleDarkMode: () => void;
  themeColors: ThemeColors;
};

const SettingsContext = createContext<SettingsContextType | null>(null);

const KEY_DARK = "settings:darkMode";

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY_DARK).then((dark) => {
      if (dark === "true") setDarkMode(true);
    });
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      AsyncStorage.setItem(KEY_DARK, String(next));
      return next;
    });
  };

  const themeColors = darkMode ? darkColors : colors;

  return (
    <SettingsContext.Provider value={{ darkMode, toggleDarkMode, themeColors }}>
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
