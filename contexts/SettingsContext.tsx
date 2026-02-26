import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AppIcon = "wowCooking" | "modern";

type SettingsContextType = {
  appIcon: AppIcon;
  setAppIcon: (icon: AppIcon) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextType | null>(null);

const STORAGE_KEY = "settings:appIcon";

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [appIcon, setAppIconState] = useState<AppIcon>("wowCooking");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === "wowCooking" || val === "modern") setAppIconState(val);
    });
  }, []);

  const setAppIcon = async (icon: AppIcon) => {
    setAppIconState(icon);
    await AsyncStorage.setItem(STORAGE_KEY, icon);
    try {
      const { setAppIcon: setNativeIcon } = await import("expo-dynamic-app-icon");
      await setNativeIcon(icon);
    } catch {
      // Silently fails in Expo Go
    }
  };

  return (
    <SettingsContext.Provider value={{ appIcon, setAppIcon }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
}
