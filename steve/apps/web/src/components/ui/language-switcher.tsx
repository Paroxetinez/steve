"use client";

import { useI18n, Language } from "@/lib/i18n";
import { Globe } from "lucide-react";
import { useState } from "react";

interface LanguageSwitcherProps {
  variant?: "dropdown" | "buttons" | "minimal";
  className?: string;
}

export function LanguageSwitcher({ variant = "dropdown", className = "" }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  if (variant === "minimal") {
    return (
      <button
        onClick={() => setLanguage(language === "en" ? "zh" : "en")}
        className={`flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors ${className}`}
      >
        <Globe className="size-3" />
        {language === "en" ? "EN" : "中"}
      </button>
    );
  }

  if (variant === "buttons") {
    return (
      <div className={`flex gap-1 bg-gray-100 rounded-lg p-1 ${className}`}>
        <button
          onClick={() => handleLanguageChange("en")}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            language === "en"
              ? "bg-white text-black shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {t.preferences.english}
        </button>
        <button
          onClick={() => handleLanguageChange("zh")}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            language === "zh"
              ? "bg-white text-black shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {t.preferences.chinese}
        </button>
      </div>
    );
  }

  // Dropdown variant (default)
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Globe className="size-4" />
        <span>{language === "en" ? t.preferences.english : t.preferences.chinese}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
            <button
              onClick={() => handleLanguageChange("en")}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                language === "en" ? "text-black font-medium" : "text-gray-600"
              }`}
            >
              {t.preferences.english}
            </button>
            <button
              onClick={() => handleLanguageChange("zh")}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                language === "zh" ? "text-black font-medium" : "text-gray-600"
              }`}
            >
              {t.preferences.chinese}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
