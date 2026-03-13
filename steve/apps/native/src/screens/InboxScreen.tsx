import React from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { NativeAvatar } from "../components/NativeAvatar";
import { formatNativeInboxTime } from "../lib/nativeRelativeMessageTime";
import { useNativeSession } from "../session/NativeSessionProvider";

const InboxScreen = ({ navigation }) => {
  const { sessionToken, signOut } = useNativeSession();
  const conversations = useQuery(
    api.chatConversations.listMyConversations,
    sessionToken ? { sessionToken } : "skip",
  );
  const rows = (conversations ?? []).filter((conversation) => conversation.type !== "assistant");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Inbox</Text>
          <Text style={styles.subtitle}>Your latest conversations.</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate("DiscoveryScreen")}
            style={styles.secondaryButton}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Discover</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("AddFriendsScreen")}
            style={styles.secondaryButton}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>People</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              void signOut();
            }}
            style={styles.button}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        contentContainerStyle={rows.length === 0 ? styles.emptyList : styles.list}
        data={rows}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate("ChatScreen", {
                conversationId: item.id,
                conversationName: item.name,
                targetUserId: item.targetUserId,
              })
            }
            style={styles.row}
          >
            <NativeAvatar fallback={item.name} uri={item.avatarUrl} />
            <View style={styles.rowBody}>
              <View style={styles.rowTop}>
                <Text numberOfLines={1} style={styles.rowTitle}>
                  {item.name}
                </Text>
                <View style={styles.rowMeta}>
                  <Text style={styles.rowTime}>
                    {formatNativeInboxTime({ timestamp: item.updatedAt })}
                  </Text>
                  {item.unread > 0 ? <View style={styles.unreadDot} /> : null}
                </View>
              </View>
              <Text numberOfLines={1} style={styles.rowSubtitle}>
                {item.subtitle || "Start chatting"}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No conversations yet.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  title: {
    fontSize: 24,
    color: "#111827",
    fontFamily: "SemiBold",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
    fontFamily: "Regular",
  },
  list: {
    paddingBottom: 24,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  row: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    flexDirection: "row",
    marginBottom: 12,
    padding: 14,
  },
  rowBody: {
    flex: 1,
    marginLeft: 12,
  },
  rowTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  rowTitle: {
    color: "#111827",
    flex: 1,
    fontFamily: "SemiBold",
    fontSize: 16,
    marginRight: 8,
  },
  rowSubtitle: {
    color: "#6B7280",
    fontFamily: "Regular",
    fontSize: 13,
    marginTop: 4,
  },
  rowTime: {
    color: "#9CA3AF",
    fontFamily: "Regular",
    fontSize: 12,
  },
  unreadDot: {
    backgroundColor: "#0D87E1",
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  button: {
    alignSelf: "flex-start",
    backgroundColor: "#0D87E1",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryButton: {
    alignSelf: "flex-start",
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontFamily: "SemiBold",
    fontSize: 14,
  },
  secondaryButtonText: {
    color: "#111827",
    fontFamily: "SemiBold",
    fontSize: 13,
  },
  emptyText: {
    color: "#6B7280",
    fontFamily: "Regular",
    fontSize: 14,
    textAlign: "center",
  },
});

export default InboxScreen;
