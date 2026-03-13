import React, { createContext, startTransition, useContext, useEffect, useState } from "react";
import {
  loadNativeLanguagePreference,
  saveNativeLanguagePreference,
  type NativeAppLanguage,
} from "./nativePreferencesStorage";

type NativePreferencesContextValue = {
  language: NativeAppLanguage;
  preferencesReady: boolean;
  setLanguage: (language: NativeAppLanguage) => Promise<void>;
};

const NativePreferencesContext = createContext<NativePreferencesContextValue | null>(null);

export function NativePreferencesProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<NativeAppLanguage>("en");
  const [preferencesReady, setPreferencesReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const storedLanguage = await loadNativeLanguagePreference();
      if (cancelled) {
        return;
      }

      startTransition(() => {
        setLanguageState(storedLanguage ?? "en");
        setPreferencesReady(true);
      });
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  async function setLanguage(languageInput: NativeAppLanguage) {
    await saveNativeLanguagePreference(languageInput);
    startTransition(() => {
      setLanguageState(languageInput);
    });
  }

  return (
    <NativePreferencesContext.Provider
      value={{
        language,
        preferencesReady,
        setLanguage,
      }}
    >
      {children}
    </NativePreferencesContext.Provider>
  );
}

export function useNativePreferences() {
  const context = useContext(NativePreferencesContext);
  if (!context) {
    throw new Error("useNativePreferences must be used within NativePreferencesProvider");
  }

  return context;
}
