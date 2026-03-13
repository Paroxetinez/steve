"use client";

import { CachedAvatar } from "@/components/common/CachedAvatar";
import { useI18n } from "@/lib/i18n";
import { compressChatImage } from "@/lib/media/compressChatImage";
import {
  uploadConversationImageWithFallback,
} from "@/lib/media/uploadTargets";
import { formatChatMessageTime } from "@/lib/relativeMessageTime";
import { useSessionToken } from "@/lib/session-token-context";
import { api } from "@packages/backend/convex/_generated/api";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import { useAction, useMutation, useQuery } from "convex/react";
import { ChevronLeft, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { resolveChatAvatarHref } from "./chatAvatarNavigation";
import { getChatComposerTextareaClassName } from "./chatComposerInput";
import { resolveChatImageMessageState } from "./chatImageMessageState";
import { resolveChatPendingState } from "./chatPendingState";
import { getChatViewportShellClassName } from "./chatViewportShell";
import { resolveChatWorkspaceState } from "./chatWorkspaceState";

type ConversationItem = {
  id: Id<"conversations">;
  type: "direct" | "group" | "assistant";
  name: string;
  avatarUrl?: string;
  targetUserId?: Id<"users">;
  subtitle: string;
  unread: number;
  online: boolean;
  updatedAt: number;
};

type MessageItem = {
  id: Id<"messages">;
  senderType: "user" | "assistant" | "system";
  content: string;
  contentType: "text" | "image";
  imageUrl?: string;
  imageUploadStatus?: "uploading" | "ready" | "failed";
  imageUploadError?: string;
  createdAt: number;
  senderUserId?: Id<"users">;
};

type MeInfo = {
  id: Id<"users">;
  phone: string;
  hasProfile: boolean;
  profile?: {
    nickname?: string;
    avatarUrl?: string;
  } | null;
};

function avatarLabel(name: string) {
  return name.slice(0, 1).toUpperCase();
}

function UserAvatar({
  name,
  avatarUrl,
  sizeClass = "size-8",
}: {
  name: string;
  avatarUrl?: string;
  sizeClass?: string;
}) {
  return (
    <CachedAvatar
      src={avatarUrl}
      alt={name}
      fallback={avatarLabel(name)}
      className={`${sizeClass} rounded-full`}
      imgClassName="border border-gray-200"
      fallbackClassName="text-xs font-semibold text-gray-700"
    />
  );
}

export default function ChatWorkspace() {
  const { t, language } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearSessionToken, sessionReady, sessionToken } = useSessionToken();

  const [activeConversationId, setActiveConversationId] =
    useState<Id<"conversations"> | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);
  const [authError, setAuthError] = useState(false);

  const listMyConversations = useQuery(
    api.chatConversations.listMyConversations,
    sessionToken ? { sessionToken } : "skip",
  ) as ConversationItem[] | undefined;

  const me = useQuery(api.auth.me, sessionToken ? { sessionToken } : "skip") as
    | MeInfo
    | undefined;

  const activeMessages = useQuery(
    api.chatMessages.listMessages,
    sessionToken && activeConversationId
      ? {
          sessionToken,
          conversationId: activeConversationId,
          limit: 200,
        }
      : "skip",
  ) as MessageItem[] | undefined;

  useEffect(() => {
    if (sessionToken && me === undefined && listMyConversations === undefined) {
      const timer = setTimeout(() => {
        clearSessionToken();
        router.replace("/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [sessionToken, me, listMyConversations, router]);

  const sendMessage = useMutation(api.chatMessages.sendMessage);
  const createPendingImageMessage = useMutation(api.chatMessages.createPendingImageMessage);
  const finalizePendingImageMessage = useMutation(api.chatMessages.finalizePendingImageMessage);
  const markPendingImageMessageFailed = useMutation(api.chatMessages.markPendingImageMessageFailed);
  const markRead = useMutation(api.chatMessages.markRead);
  const callDirectReply = useAction(api.chatAssistantNode.callDirectReply);

  useEffect(() => {
    if (authError) {
      clearSessionToken();
      router.replace("/login");
    }
  }, [authError, clearSessionToken, router]);

  useEffect(() => {
    if (sessionReady && !sessionToken) {
      router.replace("/login");
    }
  }, [router, sessionReady, sessionToken]);

  useEffect(() => {
    if (!me) return;
    if (!me.hasProfile) {
      router.replace("/profile");
    }
  }, [me, router]);

  useEffect(() => {
    if (listMyConversations === undefined) return;

    const nextState = resolveChatWorkspaceState({
      conversations: listMyConversations.map((item) => ({ id: String(item.id) })),
      requestedConversationId: searchParams.get("conversationId"),
      activeConversationId: activeConversationId ? String(activeConversationId) : null,
    });

    if (nextState.shouldRedirectToInbox) {
      if (sessionToken) {
        router.replace("/inbox");
      }
      return;
    }

    if (
      nextState.nextActiveConversationId &&
      nextState.nextActiveConversationId !== String(activeConversationId)
    ) {
      const nextConversation = listMyConversations.find(
        (item) => String(item.id) === nextState.nextActiveConversationId,
      );
      if (nextConversation) {
        setActiveConversationId(nextConversation.id);
      }
    }
  }, [
    activeConversationId,
    listMyConversations,
    router,
    searchParams,
    sessionToken,
  ]);

  useEffect(() => {
    if (!sessionToken || !activeConversationId || !activeMessages) return;
    void markRead({ sessionToken, conversationId: activeConversationId });
  }, [activeConversationId, activeMessages, markRead, sessionToken]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [activeConversationId, activeMessages?.length]);

  const activeConversation = useMemo(() => {
    if (!activeConversationId || !listMyConversations) return null;
    return (
      listMyConversations.find((item) => item.id === activeConversationId) ?? null
    );
  }, [activeConversationId, listMyConversations]);

  const isBusy = sending || uploadingImage;
  const pendingState = resolveChatPendingState({
    sending,
    uploadingImage,
  });

  function openAvatarTarget(href: string | null) {
    if (!href) {
      return;
    }

    router.push(href);
  }

  function openActiveProfile() {
    openAvatarTarget(
      resolveChatAvatarHref({
        isCurrentUser: false,
        conversationType: activeConversation?.type,
        targetUserId: activeConversation?.targetUserId
          ? String(activeConversation.targetUserId)
          : undefined,
        nickname: activeConversation?.name,
        avatarUrl: activeConversation?.avatarUrl,
      }),
    );
  }

  function openMyProfile() {
    openAvatarTarget(
      resolveChatAvatarHref({
        isCurrentUser: true,
      }),
    );
  }

  async function handleSend() {
    if (!sessionToken || !activeConversationId) return;
    const content = draft.trim();
    if (!content || isBusy) return;

    setSending(true);
    setDraft("");

    try {
      await sendMessage({
        sessionToken,
        conversationId: activeConversationId,
        content,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : language === "zh"
            ? "发送消息失败"
            : "Failed to send message";
      alert(message);
      setDraft(content);
    } finally {
      setSending(false);
    }
  }

  async function handleCallSteve() {
    if (!sessionToken || !activeConversationId || isBusy) return;

    setSending(true);
    try {
      await callDirectReply({
        sessionToken,
        conversationId: activeConversationId,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : language === "zh"
            ? "唤起 Steve 失败"
            : "Failed to call Steve";
      alert(message);
    } finally {
      setSending(false);
    }
  }

  async function handleSendImage(file: File) {
    if (!sessionToken || !activeConversationId || isBusy) return;

    if (!file.type.startsWith("image/")) {
      alert(language === "zh" ? "请选择图片文件" : "Please choose an image file");
      return;
    }

    setUploadingImage(true);
    let pendingMessageId: Id<"messages"> | null = null;
    try {
      const pending = await createPendingImageMessage({
        sessionToken,
        conversationId: activeConversationId,
        clientMessageId: crypto.randomUUID(),
      });
      pendingMessageId = pending.id;
      const compressedImage = await compressChatImage(file);
      const uploaded = await uploadConversationImageWithFallback({
        sessionToken,
        conversationId: activeConversationId,
        file: compressedImage.file,
      });

      await finalizePendingImageMessage({
        sessionToken,
        conversationId: activeConversationId,
        messageId: pending.id,
        imageObjectKey: uploaded.objectKey,
        imageMimeType: compressedImage.metadata.mimeType,
        imageSizeBytes: compressedImage.metadata.sizeBytes,
        imageWidth: compressedImage.metadata.width,
        imageHeight: compressedImage.metadata.height,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : language === "zh"
            ? "发送图片失败"
            : "Failed to send image";
      if (pendingMessageId) {
        await markPendingImageMessageFailed({
          sessionToken,
          conversationId: activeConversationId,
          messageId: pendingMessageId,
          error: message,
        }).catch(() => undefined);
      }
      alert(message);
    } finally {
      setUploadingImage(false);
    }
  }

  if (!sessionToken) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{t.common.loading}</p>
        </div>
      </main>
    );
  }

  return (
    <main className={getChatViewportShellClassName()}>
      <section className="flex h-full flex-col">
        <div className="sticky top-0 z-20 border-b border-gray-100 bg-white px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/inbox")}
              className="grid size-9 place-items-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              <ChevronLeft className="size-4" />
            </button>
            {activeConversation?.type === "direct" && activeConversation.targetUserId ? (
              <button
                type="button"
                onClick={openActiveProfile}
                className="rounded-full"
              >
                <UserAvatar
                  name={activeConversation?.name ?? "S"}
                  avatarUrl={activeConversation?.avatarUrl}
                  sizeClass="size-10"
                />
              </button>
            ) : (
              <UserAvatar
                name={activeConversation?.name ?? "S"}
                avatarUrl={activeConversation?.avatarUrl}
                sizeClass="size-10"
              />
            )}
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                {activeConversation?.name ?? t.common.loading}
              </h2>
              {activeConversation?.online ? (
                <p className="truncate text-xs text-gray-500">{t.common.online}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,_#f8fbff_0%,_#ffffff_40%)] px-4 py-5 sm:px-6"
        >
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
            {(activeMessages ?? []).map((message, index, messages) => {
              const previous = index > 0 ? messages[index - 1] : null;
              const showTimeDivider =
                previous !== null && message.createdAt - previous.createdAt >= 2 * 60 * 1000;
              const imageUrl = message.imageUrl;

              if (message.senderType === "assistant") {
                const content = message.content;
                const steveMatch = content.match(/^((?:(?:🧖|👀)\s*)?Steve:)\s*/);
                const stevePrefix = steveMatch ? steveMatch[1] : null;
                const steveContent = stevePrefix ? content.slice(stevePrefix.length) : content;

                return (
                  <Fragment key={message.id}>
                    {showTimeDivider ? (
                      <div className="flex justify-center py-1">
                        <p className="rounded-full bg-gray-100 px-3 py-1 text-[11px] text-gray-500">
                          {formatChatMessageTime({
                            timestamp: message.createdAt,
                            language,
                          })}
                        </p>
                      </div>
                    ) : null}
                    <div className="flex justify-center py-1">
                      <div className="max-w-[88%] rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={language === "zh" ? "聊天图片" : "Chat image"}
                            className="max-h-72 rounded-xl object-cover"
                          />
                        ) : (
                          <p className="text-sm leading-6 text-gray-700">
                            {stevePrefix ? (
                              <>
                                <span className="font-semibold">{stevePrefix}</span>
                                {steveContent}
                              </>
                            ) : (
                              message.content
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </Fragment>
                );
              }

              if (message.senderType === "system") {
                return null;
              }

              const isMine = me?.id
                ? String(message.senderUserId) === String(me.id)
                : false;

              return (
                <Fragment key={message.id}>
                  {showTimeDivider ? (
                    <div className="flex justify-center py-1">
                      <p className="rounded-full bg-gray-100 px-3 py-1 text-[11px] text-gray-500">
                        {formatChatMessageTime({
                          timestamp: message.createdAt,
                          language,
                        })}
                      </p>
                    </div>
                  ) : null}
                  <div
                    className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    {!isMine ? (
                      activeConversation?.type === "direct" && activeConversation.targetUserId ? (
                        <button
                          type="button"
                          onClick={openActiveProfile}
                          className="rounded-full"
                        >
                          <UserAvatar
                            name={activeConversation?.name ?? "U"}
                            avatarUrl={activeConversation?.avatarUrl}
                          />
                        </button>
                      ) : (
                        <UserAvatar
                          name={activeConversation?.name ?? "U"}
                          avatarUrl={activeConversation?.avatarUrl}
                        />
                      )
                    ) : null}
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                        isMine
                          ? "rounded-br-sm bg-black text-white"
                          : "rounded-bl-sm border border-gray-200 bg-white text-gray-900"
                      }`}
                    >
                      {(() => {
                        const imageState = resolveChatImageMessageState({
                          contentType: message.contentType,
                          imageUrl,
                          imageUploadStatus: message.imageUploadStatus,
                          language,
                        });

                        if (imageState?.kind === "image") {
                          return (
                            <img
                              src={imageState.imageUrl}
                              alt={language === "zh" ? "聊天图片" : "Chat image"}
                              className="max-h-72 rounded-xl object-cover"
                            />
                          );
                        }

                        if (imageState?.kind === "status") {
                          return <p>{imageState.text}</p>;
                        }

                        return <p>{message.content}</p>;
                      })()}
                    </div>
                    {isMine ? (
                      <button
                        type="button"
                        onClick={openMyProfile}
                        className="rounded-full"
                      >
                        <UserAvatar
                          name={me?.profile?.nickname || "Me"}
                          avatarUrl={me?.profile?.avatarUrl}
                        />
                      </button>
                    ) : null}
                  </div>
                </Fragment>
              );
            })}

            {pendingState.showPending ? (
              <div className="flex items-center justify-end gap-2 pt-1">
                <div className="rounded-2xl rounded-br-sm bg-black px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 animate-bounce rounded-full bg-white/70 [animation-delay:-0.3s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-white/70 [animation-delay:-0.15s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-white/70" />
                  </div>
                </div>
                {pendingState.isMine ? (
                  <button
                    type="button"
                    onClick={openMyProfile}
                    className="rounded-full"
                  >
                    <UserAvatar
                      name={me?.profile?.nickname || "Me"}
                      avatarUrl={me?.profile?.avatarUrl}
                    />
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-3 sm:px-5">
          {activeConversation?.type === "direct" ? (
            <div className="mx-auto mb-3 flex max-w-3xl justify-start">
              <button
                type="button"
                onClick={() => void handleCallSteve()}
                disabled={isBusy}
                className="flex items-center gap-1.5 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1.5 text-xs font-medium text-yellow-800 transition hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>🧖</span>
                <span>{language === "zh" ? "让 Steve 帮看一下" : "Ask Steve to help"}</span>
              </button>
            </div>
          ) : null}
          <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
            <div className="flex min-h-10 flex-1 items-end rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                rows={1}
                placeholder={t.chat.messagePlaceholder}
                className={getChatComposerTextareaClassName()}
              />
            </div>
            <button
              type="button"
              disabled={isBusy || !activeConversationId}
              title={language === "zh" ? "发送图片" : "Send image"}
              onClick={() => imageFileInputRef.current?.click()}
              className="grid h-10 w-10 place-items-center rounded-2xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4" />
            </button>
            <input
              ref={imageFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.currentTarget.value = "";
                if (file) {
                  void handleSendImage(file);
                }
              }}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
