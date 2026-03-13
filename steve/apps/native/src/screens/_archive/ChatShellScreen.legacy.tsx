import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { useNativeSession } from "../session/NativeSessionProvider";
import { canSendNativeChatDraft } from "./nativeChatComposerModel";

const ChatShellScreen = ({ navigation, route }) => {
  const { sessionToken } = useNativeSession();
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const conversationId = route.params?.conversationId ?? null;
  const conversationName = route.params?.conversationName ?? "Chat";
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
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{conversationName}</Text>
          <Text style={styles.headerSubtitle}>Live conversation</Text>
        </View>
        <View style={styles.headerIconButton} />
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
              <Text
                style={[
                  styles.messageText,
                  item.senderType === "user" ? styles.messageTextOutgoing : null,
                ]}
              >
                {item.contentType === "image"
                  ? item.imageUploadStatus === "failed"
                    ? "Image failed to upload"
                    : "[image]"
                  : item.content}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No messages yet.</Text>}
      />
      <View style={styles.composer}>
        <TextInput
          onChangeText={setDraft}
          placeholder="Type a message"
          style={styles.composerInput}
          value={draft}
        />
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
  composerInput: {
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    flex: 1,
    fontFamily: "Regular",
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
