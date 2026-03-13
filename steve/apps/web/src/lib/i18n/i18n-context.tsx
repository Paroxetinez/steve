"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { translations, Language, Translations } from "./translations";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = "steve-language";

function getStoredLanguage(): Language | null {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored && (stored === "en" || stored === "zh")) {
      return stored;
    }
  }
  return null;
}

function getBrowserLanguage(): Language {
  if (typeof window !== "undefined") {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith("zh")) {
      return "zh";
    }
  }
  return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize language on client side
  useEffect(() => {
    const stored = getStoredLanguage();
    const initialLang = stored || getBrowserLanguage();
    setLanguageState(initialLang);
    setIsInitialized(true);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, lang);
    }
  }, []);

  const t = translations[language];

  // Prevent hydration mismatch by rendering children only after initialization
  // or use the default language for server rendering
  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
