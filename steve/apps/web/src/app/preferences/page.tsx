"use client";

import AppShell from "@/components/app-shell/AppShell";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useI18n } from "@/lib/i18n";
import { ChevronLeft, Globe } from "lucide-react";
import Link from "next/link";

export default function PreferencesPage() {
  const { t } = useI18n();

  return (
    <AppShell>
      <div className="flex h-full min-h-0 flex-col bg-white">
        {/* Header */}
        <div className="flex items-center gap-4 px-4 py-4 border-b border-gray-100">
          <Link
            href="/personal-profile"
            className="flex items-center justify-center size-10 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="size-6 text-black" strokeWidth={2} />
          </Link>
          <h1 className="text-lg font-semibold text-black">{t.preferences.title}</h1>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {/* Language Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="size-5 text-gray-600" />
              <h2 className="text-base font-medium text-gray-900">{t.preferences.language}</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">{t.preferences.languageDesc}</p>
            <LanguageSwitcher variant="buttons" className="w-full max-w-xs" />
          </div>

          {/* Additional preferences sections can be added here */}
          <div className="border-t border-gray-100 pt-6">
            <p className="text-xs text-gray-400">
              More preferences coming soon...
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
