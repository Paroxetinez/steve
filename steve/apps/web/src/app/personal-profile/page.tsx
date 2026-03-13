"use client";

import AppShell from "@/components/app-shell/AppShell";
import { CachedAvatar } from "@/components/common/CachedAvatar";
import { useI18n } from "@/lib/i18n";
import { useSessionToken } from "@/lib/session-token-context";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ChevronRight, Settings, Sparkles, User, Edit3 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function PersonalProfilePage() {
  const { t } = useI18n();
  const router = useRouter();
  const logout = useMutation(api.auth.logout);
  const { clearSessionToken, sessionReady, sessionToken } = useSessionToken();
  const [loggingOut, setLoggingOut] = useState(false);
  const actionItemClass =
    "w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl transition-colors hover:bg-gray-50";

  useEffect(() => {
    if (sessionReady && !sessionToken) {
      router.replace("/login");
    }
  }, [router, sessionReady, sessionToken]);

  const me = useQuery(api.auth.me, sessionToken ? { sessionToken } : "skip");

  const profileName = useMemo(() => {
    if (me?.profile?.nickname) return me.profile.nickname;
    if (me?.phone) return `${t.personalProfile.userPrefix} ${me.phone.slice(-4)}`;
    return t.personalProfile.userPrefix;
  }, [me, t]);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);

    if (sessionToken) {
      try {
        await logout({ sessionToken });
      } catch (error) {
        console.error("logout_failed", error);
      }
    }

    clearSessionToken();
    router.replace("/login");
  }

  return (
    <AppShell>
      <div className="flex h-full min-h-0 flex-col bg-white">
        <div className="flex flex-col items-center px-6 pt-12 mb-8">
          <Link href="/profile/edit" className="relative group">
            <CachedAvatar
              src={me?.profile?.avatarUrl}
              alt={profileName}
              fallback={profileName.slice(0, 1).toUpperCase()}
              className="mb-4 size-24 rounded-full"
              fallbackClassName="text-2xl font-semibold"
            />
            <div className="absolute bottom-4 right-0 bg-black text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit3 className="size-4" />
            </div>
          </Link>
          <h2 className="text-xl font-bold text-black mb-1">{profileName}</h2>
          <p className="text-sm text-gray-400">{t.personalProfile.idLabel}: {me?.phone ?? t.common.loading}</p>
          <p className="mt-2 text-xs text-gray-400">
            {me?.profile?.city ? `${me.profile.city}` : t.personalProfile.completeProfileHint}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          <div className="space-y-4">
            {/* Edit Profile */}
            <Link
              href="/profile/edit"
              className={actionItemClass}
            >
              <div className="flex items-center gap-3">
                <User className="size-5 text-black" strokeWidth={2} />
                <span className="text-base font-medium text-black">{t.profileSetup.editTitle}</span>
              </div>
              <ChevronRight className="size-5 text-gray-300" strokeWidth={2} />
            </Link>

            <Link
              href="/reports"
              className={actionItemClass}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="size-5 text-black" strokeWidth={2} />
                <span className="text-base font-medium text-black">{t.personalProfile.steveReport}</span>
              </div>
              <ChevronRight className="size-5 text-gray-300" strokeWidth={2} />
            </Link>

            <Link
              href="/preferences"
              className={actionItemClass}
            >
              <div className="flex items-center gap-3">
                <Settings className="size-5 text-black" strokeWidth={2} />
                <span className="text-base font-medium text-black">{t.personalProfile.preferences}</span>
              </div>
              <ChevronRight className="size-5 text-gray-300" strokeWidth={2} />
            </Link>
          </div>
        </div>

        <div className="px-6 pb-3 pt-4">
          <button
            onClick={() => void handleLogout()}
            className="w-full py-3 text-center text-gray-400 text-sm hover:text-gray-600 transition-colors"
          >
            {loggingOut ? t.personalProfile.signingOut : t.personalProfile.signOut}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
