"use client";

import AppShell from "@/components/app-shell/AppShell";
import { CachedAvatar } from "@/components/common/CachedAvatar";
import { useI18n } from "@/lib/i18n";
import { useSessionToken } from "@/lib/session-token-context";
import { api } from "@packages/backend/convex/_generated/api";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { ChevronLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { resolveSeededSearchResult } from "./searchResultSeed";

export default function SearchResultClient() {
  const { t, language } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { sessionToken, sessionReady } = useSessionToken();
  const [adding, setAdding] = useState(false);
  const selectedUserId = searchParams.get("userId");
  const includeConnected = searchParams.get("includeConnected") === "1";
  const seededSelected = useMemo(
    () =>
      resolveSeededSearchResult({
        userId: selectedUserId,
        nickname: searchParams.get("nickname"),
        avatarUrl: searchParams.get("avatarUrl"),
      }),
    [searchParams, selectedUserId],
  );

  useEffect(() => {
    if (sessionReady && !sessionToken) {
      router.replace("/login");
    }
  }, [router, sessionReady, sessionToken]);

  const candidates = useQuery(
    api.chatConversations.discoverUsers,
    sessionToken ? { sessionToken, language, includeConnected } : "skip",
  );

  const createDirectConversationWithUser = useMutation(
    api.chatConversations.createDirectConversationWithUser,
  );

  const selected = useMemo(() => {
    const source = candidates ?? [];
    if (!source.length) {
      return seededSelected;
    }
    if (!selectedUserId) return source[0] ?? seededSelected;
    return (
      source.find((item) => String(item.userId) === selectedUserId) ??
      seededSelected ??
      source[0]
    );
  }, [candidates, seededSelected, selectedUserId]);

  async function handleAdd() {
    if (!sessionToken || !selected || adding) return;
    setAdding(true);

    try {
      const result = await createDirectConversationWithUser({
        sessionToken,
        targetUserId: selected.userId as Id<"users">,
      });
      router.push(`/chat?conversationId=${result.conversationId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : t.searchResult.failedToAdd;
      alert(message);
    } finally {
      setAdding(false);
    }
  }

  return (
    <AppShell>
      <div className="flex h-full min-h-0 flex-col bg-white">
        <div className="px-6 pt-12 pb-6">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <ChevronLeft className="size-7 text-black" strokeWidth={2} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 flex flex-col items-center">
          <div className="mt-8 mb-6">
            <CachedAvatar
              src={selected?.avatarUrl}
              alt={selected?.nickname ?? t.common.loading}
              fallback={selected?.nickname?.slice(0, 1).toUpperCase() ?? "?"}
              className="size-40 rounded-full"
              imgClassName="border border-gray-200"
              fallbackClassName="text-4xl font-semibold"
            />
          </div>

          <h1 className="text-3xl font-bold text-black mb-2">{selected?.nickname ?? t.common.loading}</h1>
          <p className="text-sm text-gray-400 mb-8">{t.personalProfile.idLabel}: {selected?.displayId ?? "-"}</p>

          <div className="w-full bg-gray-50 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-700 mb-4">{t.searchResult.compatibilityTitle}</h2>
            {(selected?.compatibility ?? []).map((line) => (
              <p key={line} className="text-sm text-gray-700">
                {line}
              </p>
            ))}
          </div>
        </div>

        <div className="px-6 pb-8 pt-6">
          <button
            onClick={() => void handleAdd()}
            disabled={adding || !selected || !!selected.isConnected}
            className={`w-full py-4 text-base font-semibold rounded-full ${
              adding || !selected || !!selected?.isConnected
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            {adding ? t.searchResult.addingButton : !selected ? t.searchResult.noUser : selected.isConnected ? t.searchResult.addedButton : t.searchResult.addFriendButton}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
