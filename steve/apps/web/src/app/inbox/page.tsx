"use client";

import AppShell from "@/components/app-shell/AppShell";
import { CachedAvatar } from "@/components/common/CachedAvatar";
import { InviteModal } from "@/components/invite/InviteModal";
import { useI18n } from "@/lib/i18n";
import { formatInboxMessageTime } from "@/lib/relativeMessageTime";
import { useSessionToken } from "@/lib/session-token-context";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Search, Share2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Id } from "@packages/backend/convex/_generated/dataModel";

type Tab = "active" | "archived";
type ConversationItem = {
  id: Id<"conversations">;
  type: "direct" | "group" | "assistant";
  name: string;
  avatarUrl?: string;
  subtitle: string;
  unread: number;
  online: boolean;
  updatedAt: number;
};

export default function InboxPage() {
  const { t, language } = useI18n();
  const { sessionToken, sessionReady } = useSessionToken();
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [keyword, setKeyword] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const hasSyncedDemoRef = useRef(false);
  const syncDemoConversations = useMutation(api.auth.syncDemoConversations);

  const conversations = useQuery(
    api.chatConversations.listMyConversations,
    sessionToken ? { sessionToken } : "skip",
  ) as ConversationItem[] | undefined;

  useEffect(() => {
    if (sessionReady && !sessionToken) {
      window.location.href = "/login";
    }
  }, [sessionReady, sessionToken]);

  useEffect(() => {
    if (!sessionToken || hasSyncedDemoRef.current || conversations === undefined) return;
    if (conversations.length > 0) {
      hasSyncedDemoRef.current = true;
      return;
    }

    hasSyncedDemoRef.current = true;

    void syncDemoConversations({ sessionToken }).catch((error) => {
      console.error("sync_demo_conversations_failed", error);
      hasSyncedDemoRef.current = false;
    });
  }, [conversations, sessionToken, syncDemoConversations]);

  const filteredConversations = useMemo(() => {
    const source = (conversations ?? []).filter(
      (item) => item.type !== "assistant",
    );
    if (activeTab === "archived") return [];

    const q = keyword.trim().toLowerCase();
    if (!q) return source;

    return source.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q),
    );
  }, [activeTab, conversations, keyword]);

  return (
    <AppShell>
      <div className="flex h-full min-h-0 flex-col bg-white">
        <div className="px-6 pt-6 pb-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              type="text"
              placeholder={t.inbox.searchPlaceholder}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 text-black placeholder:text-gray-400 outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-5 py-2 rounded-full text-sm font-medium ${
                activeTab === "active"
                  ? "bg-black text-white"
                  : "bg-white text-black border border-black"
              }`}
            >
              {t.inbox.activeTab}
            </button>
            <button
              onClick={() => setActiveTab("archived")}
              className={`px-5 py-2 rounded-full text-sm font-medium ${
                activeTab === "archived"
                  ? "bg-black text-white"
                  : "bg-white text-black border border-black"
              }`}
            >
              {t.inbox.archivedTab}
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="ml-auto px-4 py-2 rounded-full text-sm font-medium bg-black text-white flex items-center gap-2"
            >
              <Share2 className="size-4" />
              {t.invitation.inviteFriend}
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/chat?conversationId=${conversation.id}`}
              className="w-full px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors block"
              style={{
                contentVisibility: "auto",
                containIntrinsicSize: "88px",
              }}
            >
              <div className="flex items-center gap-4">
                <CachedAvatar
                  src={conversation.avatarUrl}
                  alt={conversation.name}
                  fallback={conversation.name.slice(0, 1).toUpperCase()}
                  className="size-12 flex-shrink-0 rounded-full"
                  imgClassName="border border-gray-200"
                  fallbackClassName="font-semibold"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <h3 className="font-semibold text-black truncate">{conversation.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {formatInboxMessageTime({
                          timestamp: conversation.updatedAt,
                          language,
                        })}
                      </span>
                      {conversation.unread > 0 ? (
                        <span className="size-2 rounded-full bg-black flex-shrink-0" />
                      ) : null}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{conversation.subtitle}</p>
                </div>
              </div>
            </Link>
          ))}

          {filteredConversations.length === 0 ? (
            <div className="px-6 py-8 text-sm text-gray-400">{t.inbox.noConversations}</div>
          ) : null}
        </div>

        <InviteModal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} />
      </div>
    </AppShell>
  );
}
