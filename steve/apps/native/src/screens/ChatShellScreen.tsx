import React from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { NativeAvatar } from "../components/NativeAvatar";
import {
  pickNativeImageFromLibrary,
  requestNativeConversationImageUploadTarget,
  uploadNativeAssetToSignedUrl,
} from "../lib/nativeMediaUpload";
import { formatNativeChatTime } from "../lib/nativeRelativeMessageTime";
import { useNativeSession } from "../session/NativeSessionProvider";
import { canSendNativeChatDraft } from "./nativeChatComposerModel";

const ChatShellScreen = ({ navigation, route }) => {
  const { sessionToken } = useNativeSession();
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [callingSteve, setCallingSteve] = React.useState(false);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [pendingImagePreviews, setPendingImagePreviews] = React.useState<Record<string, string>>(
    {},
  );
  const conversationId = route.params?.conversationId ?? null;
  const conversations = useQuery(
    api.chatConversations.listMyConversations,
    sessionToken ? { sessionToken } : "skip",
  );
  const activeConversation =
    conversations?.find((item) => item.id === conversationId) ?? null;
  const conversationName = activeConversation?.name ?? route.params?.conversationName ?? "Chat";
  const messages = useQuery(
    api.chatMessages.listMessages,
    sessionToken && conversationId
      ? {
          sessionToken,
          conversationId,
          limit: 200,
        }
      : "skip",
  );
  const sendMessage = useMutation(api.chatMessages.sendMessage);
  const markRead = useMutation(api.chatMessages.markRead);
  const createPendingImageMessage = useMutation(api.chatMessages.createPendingImageMessage);
  const finalizePendingImageMessage = useMutation(api.chatMessages.finalizePendingImageMessage);
  const markPendingImageMessageFailed = useMutation(api.chatMessages.markPendingImageMessageFailed);
  const callDirectReply = useAction(api.chatAssistantNode.callDirectReply);
  const canSend = canSendNativeChatDraft({
    conversationId,
    draft,
    sending,
    sessionToken,
  });

  React.useEffect(() => {
    if (!sessionToken || !conversationId || !messages) {
      return;
    }

    void markRead({ sessionToken, conversationId });
  }, [conversationId, markRead, messages, sessionToken]);

  React.useEffect(() => {
    if (!messages?.length) {
      return;
    }

    setPendingImagePreviews((current) => {
      const next = { ...current };
      for (const message of messages) {
        if (message.imageUploadStatus === "ready" && next[message.id]) {
          delete next[message.id];
        }
      }
      return next;
    });
  }, [messages]);

  const onSend = React.useCallback(async () => {
    if (!canSend || !sessionToken || !conversationId) {
      return;
    }

    const content = draft.trim();
    setSending(true);
    setDraft("");

    try {
      await sendMessage({
        sessionToken,
        conversationId,
        content,
      });
    } finally {
      setSending(false);
    }
  }, [canSend, conversationId, draft, sendMessage, sessionToken]);

  const onAskSteve = React.useCallback(async () => {
    if (!sessionToken || !conversationId || callingSteve) {
      return;
    }

    setCallingSteve(true);
    try {
      await callDirectReply({
        sessionToken,
        conversationId,
      });
    } finally {
      setCallingSteve(false);
    }
  }, [callDirectReply, callingSteve, conversationId, sessionToken]);

  const onPickImage = React.useCallback(async () => {
    if (!sessionToken || !conversationId || uploadingImage) {
      return;
    }

    const asset = await pickNativeImageFromLibrary();
    if (!asset) {
      return;
    }

    setUploadingImage(true);
    const pending = await createPendingImageMessage({
      sessionToken,
      conversationId,
    });

    setPendingImagePreviews((current) => ({
      ...current,
      [pending.id]: asset.uri,
    }));

    try {
      const target = await requestNativeConversationImageUploadTarget({
        sessionToken,
        conversationId,
        contentType: asset.mimeType,
      });
      await uploadNativeAssetToSignedUrl({
        asset,
        uploadUrl: target.uploadUrl,
      });
      await finalizePendingImageMessage({
        sessionToken,
        conversationId,
        messageId: pending.id,
        imageObjectKey: target.objectKey,
        imageMimeType: asset.mimeType,
        imageSizeBytes: asset.fileSize,
        imageWidth: asset.width,
        imageHeight: asset.height,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Image upload failed";
      await markPendingImageMessageFailed({
        sessionToken,
        conversationId,
        messageId: pending.id,
        error: message,
      });
    } finally {
      setUploadingImage(false);
    }
  }, [
    conversationId,
    createPendingImageMessage,
    finalizePendingImageMessage,
    markPendingImageMessageFailed,
    sessionToken,
    uploadingImage,
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
              return;
            }

            navigation.navigate("MainTabs", { screen: "InboxScreen" });
          }}
          style={styles.headerIconButton}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            if (activeConversation?.targetUserId) {
              navigation.navigate("ProfileScreen", { userId: activeConversation.targetUserId });
            }
          }}
          style={styles.headerTitleWrap}
        >
          <NativeAvatar fallback={conversationName} size={36} uri={activeConversation?.avatarUrl} />
          <View>
            <Text style={styles.headerTitle}>{conversationName}</Text>
            <Text style={styles.headerSubtitle}>Live conversation</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("ProfileScreen")}
          style={styles.headerIconButton}
        >
          <Ionicons name="person-outline" size={20} color="#111827" />
        </TouchableOpacity>
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={messages ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageRow,
              item.senderType === "user" ? styles.messageRowOutgoing : null,
            ]}
          >
            <View
              style={[
                styles.bubble,
                item.senderType === "user" ? styles.bubbleOutgoing : styles.bubbleIncoming,
              ]}
            >
              {item.contentType === "image" ? (
                <>
                  {item.imageUrl || pendingImagePreviews[item.id] ? (
                    <Image
                      source={{ uri: item.imageUrl ?? pendingImagePreviews[item.id] }}
                      style={styles.imageBubble}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.messageText,
                      item.senderType === "user" ? styles.messageTextOutgoing : null,
                    ]}
                  >
                    {item.imageUploadStatus === "failed"
                      ? item.imageUploadError ?? "Image failed to upload"
                      : item.imageUploadStatus === "uploading"
                        ? "Sending image..."
                        : ""}
                  </Text>
                </>
              ) : (
                <Text
                  style={[
                    styles.messageText,
                    item.senderType === "user" ? styles.messageTextOutgoing : null,
                  ]}
                >
                  {item.content}
                </Text>
              )}
              <Text
                style={[
                  styles.messageTime,
                  item.senderType === "user" ? styles.messageTimeOutgoing : null,
                ]}
              >
                {formatNativeChatTime({ timestamp: item.createdAt })}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No messages yet.</Text>}
      />
      <View style={styles.composer}>
        <TouchableOpacity
          onPress={() => {
            void onPickImage();
          }}
          style={styles.iconButton}
        >
          <Ionicons name="add" size={20} color="#111827" />
        </TouchableOpacity>
        <TextInput
          onChangeText={setDraft}
          placeholder="Type a message"
          style={styles.composerInput}
          value={draft}
        />
        <TouchableOpacity
          onPress={() => {
            void onAskSteve();
          }}
          style={[styles.askSteveButton, callingSteve ? styles.sendButtonDisabled : null]}
        >
          <Text style={styles.askSteveText}>
            {callingSteve ? "..." : uploadingImage ? "Img..." : "Steve"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!canSend}
          onPress={() => {
            void onSend();
          }}
          style={[styles.sendButton, !canSend ? styles.sendButtonDisabled : null]}
        >
          <Text style={styles.sendButtonText}>{sending ? "..." : "Send"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    height: 60,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 16,
    color: "#111827",
    fontFamily: "SemiBold",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    fontFamily: "Regular",
  },
  listContent: {
    flex: 1,
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  messageRow: {
    alignItems: "flex-start",
    marginBottom: 12,
  },
  messageRowOutgoing: {
    alignItems: "flex-end",
  },
  bubble: {
    borderRadius: 16,
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleIncoming: {
    backgroundColor: "#FFFFFF",
  },
  bubbleOutgoing: {
    backgroundColor: "#0D87E1",
  },
  messageText: {
    color: "#111827",
    fontFamily: "Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextOutgoing: {
    color: "#FFFFFF",
  },
  messageTime: {
    color: "#9CA3AF",
    fontFamily: "Regular",
    fontSize: 11,
    marginTop: 6,
  },
  messageTimeOutgoing: {
    color: "#DBEAFE",
  },
  imageBubble: {
    borderRadius: 12,
    height: 180,
    marginBottom: 6,
    width: 180,
  },
  emptyText: {
    color: "#6B7280",
    fontFamily: "Regular",
    fontSize: 14,
    marginTop: 24,
    textAlign: "center",
  },
  composer: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopColor: "#E5E7EB",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  composerInput: {
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    flex: 1,
    fontFamily: "Regular",
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  askSteveButton: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 42,
    minWidth: 72,
    paddingHorizontal: 14,
  },
  askSteveText: {
    color: "#FFFFFF",
    fontFamily: "SemiBold",
    fontSize: 13,
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: "#0D87E1",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 42,
    minWidth: 72,
    paddingHorizontal: 16,
  },
  sendButtonDisabled: {
    backgroundColor: "#9EC9F0",
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontFamily: "SemiBold",
    fontSize: 14,
  },
});

export default ChatShellScreen;
