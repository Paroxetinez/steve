"use client";

import AppShell from "@/components/app-shell/AppShell";
import { CachedAvatar } from "@/components/common/CachedAvatar";
import { buildSearchResultHref } from "@/components/search/searchResultSeed";
import { useI18n } from "@/lib/i18n";
import { useSessionToken } from "@/lib/session-token-context";
import { api } from "@packages/backend/convex/_generated/api";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AddFriendsPage() {
  const { t, language } = useI18n();
  const router = useRouter();
  const { sessionToken, sessionReady } = useSessionToken();
  const [keyword, setKeyword] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [addedUserIds, setAddedUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (sessionReady && !sessionToken) {
      router.replace("/login");
    }
  }, [router, sessionReady, sessionToken]);

  const candidates = useQuery(
    api.chatConversations.discoverUsers,
    sessionToken ? { sessionToken, keyword, language, includeConnected: false } : "skip",
  );
  const createDirectConversationWithUser = useMutation(
    api.chatConversations.createDirectConversationWithUser,
  );

  async function handleAdd(userId: Id<"users">) {
    if (!sessionToken || pendingUserId) return;
    const key = String(userId);
    setPendingUserId(key);

    try {
      const result = await createDirectConversationWithUser({
        sessionToken,
        targetUserId: userId,
      });
      setAddedUserIds((prev) => new Set(prev).add(key));
      router.push(`/chat?conversationId=${result.conversationId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : t.searchResult.failedToAdd;
      alert(message);
    } finally {
      setPendingUserId(null);
    }
  }

  return (
    <AppShell>
      <div className="flex h-full min-h-0 flex-col bg-white">
        <div className="px-6 pt-8 pb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-300" />
            <input
              type="text"
              placeholder={t.addFriends.searchPlaceholder}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-full bg-gray-50 text-black placeholder:text-gray-300 outline-none"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          <h2 className="text-xs font-medium text-gray-400 mb-6 tracking-wide">{t.addFriends.todayRecommendation}</h2>

          {(candidates ?? []).map((candidate) => {
            const candidateKey = String(candidate.userId);
            const added = candidate.isConnected || addedUserIds.has(candidateKey);
            const busy = pendingUserId === candidateKey;

            return (
              <div
                key={candidateKey}
                className="mb-4 bg-white rounded-3xl p-5"
                style={{
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)",
                }}
              >
                <div className="flex items-center gap-4">
                  <Link
                    href={buildSearchResultHref({
                      userId: String(candidate.userId),
                      nickname: candidate.nickname,
                      avatarUrl: candidate.avatarUrl,
                    })}
                    className="flex-shrink-0"
                  >
                    <CachedAvatar
                      src={candidate.avatarUrl}
                      alt={candidate.nickname}
                      fallback={candidate.nickname.slice(0, 1).toUpperCase()}
                      className="size-16 rounded-full"
                      imgClassName="border border-gray-200"
                      fallbackClassName="font-semibold"
                    />
                  </Link>

                  <Link
                    href={buildSearchResultHref({
                      userId: String(candidate.userId),
                      nickname: candidate.nickname,
                      avatarUrl: candidate.avatarUrl,
                    })}
                    className="flex-1 min-w-0 text-left"
                  >
                    <h3 className="text-lg font-semibold text-black mb-2">{candidate.nickname}</h3>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-600">{candidate.city || t.addFriends.unknownCity}</p>
                      <p className="text-xs text-gray-600">{candidate.compatibility[0]}</p>
                    </div>
                  </Link>

                  <button
                    onClick={() => void handleAdd(candidate.userId)}
                    disabled={added || !!pendingUserId}
                    className={`px-5 py-2.5 text-sm font-medium rounded-full whitespace-nowrap flex-shrink-0 ${
                      added || busy
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-black text-white hover:bg-gray-800"
                    }`}
                  >
                    {busy ? t.addFriends.addingButton : added ? t.addFriends.addedButton : t.addFriends.addButton}
                  </button>
                </div>
              </div>
            );
          })}

          {candidates && candidates.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-5 text-sm text-gray-500">
              {t.addFriends.noUsers}
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
