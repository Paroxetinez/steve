import React from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation, useQuery } from "convex/react";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@packages/backend/convex/_generated/api";
import { NativeAvatar } from "../components/NativeAvatar";
import { useNativeSession } from "../session/NativeSessionProvider";

const AddFriendsScreen = ({ navigation }) => {
  const { sessionToken } = useNativeSession();
  const [keyword, setKeyword] = React.useState("");
  const [pendingUserId, setPendingUserId] = React.useState<string | null>(null);
  const [addedUserIds, setAddedUserIds] = React.useState<Set<string>>(new Set());
  const candidates = useQuery(
    api.chatConversations.discoverUsers,
    sessionToken
      ? { sessionToken, keyword, language: "en", includeConnected: false }
      : "skip",
  );
  const createDirectConversationWithUser = useMutation(
    api.chatConversations.createDirectConversationWithUser,
  );

  const rows = candidates ?? [];

  async function handleAdd(userId) {
    if (!sessionToken || pendingUserId) {
      return;
    }

    const candidateKey = String(userId);
    setPendingUserId(candidateKey);

    try {
      const result = await createDirectConversationWithUser({
        sessionToken,
        targetUserId: userId,
      });
      setAddedUserIds((current) => new Set(current).add(candidateKey));
      navigation.navigate("ChatScreen", { conversationId: result.conversationId });
    } finally {
      setPendingUserId(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Add friends</Text>
        <View style={styles.headerButton} />
      </View>
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
        <TextInput
          onChangeText={setKeyword}
          placeholder="Search by nickname or city"
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
          value={keyword}
        />
      </View>
      <FlatList
        contentContainerStyle={rows.length === 0 ? styles.emptyList : styles.list}
        data={rows}
        keyExtractor={(item) => String(item.userId)}
        renderItem={({ item }) => {
          const candidateKey = String(item.userId);
          const added = item.isConnected || addedUserIds.has(candidateKey);
          const busy = pendingUserId === candidateKey;

          return (
            <Pressable
              onPress={() =>
                navigation.navigate("SearchResultScreen", {
                  candidate: item,
                })
              }
              style={styles.row}
            >
              <NativeAvatar fallback={item.nickname} size={60} uri={item.avatarUrl} />
              <View style={styles.rowBody}>
                <Text numberOfLines={1} style={styles.rowTitle}>
                  {item.nickname}
                </Text>
                <Text numberOfLines={1} style={styles.rowSubtitle}>
                  {item.city || "Unknown city"}
                </Text>
                <Text numberOfLines={2} style={styles.rowCompatibility}>
                  {item.compatibility[0]}
                </Text>
              </View>
              <TouchableOpacity
                disabled={added || busy || Boolean(pendingUserId)}
                onPress={() => {
                  void handleAdd(item.userId);
                }}
                style={[styles.addButton, added || busy ? styles.addButtonDisabled : null]}
              >
                <Text
                  style={[styles.addButtonText, added || busy ? styles.addButtonTextDisabled : null]}
                >
                  {busy ? "Adding..." : added ? "Added" : "Add"}
                </Text>
              </TouchableOpacity>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No recommended users for now.</Text>
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
    paddingTop: 16,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  title: {
    color: "#111827",
    fontFamily: "SemiBold",
    fontSize: 18,
  },
  searchWrap: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    color: "#111827",
    flex: 1,
    fontFamily: "Regular",
    fontSize: 14,
    paddingVertical: 0,
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
    borderRadius: 22,
    flexDirection: "row",
    marginBottom: 12,
    padding: 16,
  },
  rowBody: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  rowTitle: {
    color: "#111827",
    fontFamily: "SemiBold",
    fontSize: 16,
  },
  rowSubtitle: {
    color: "#6B7280",
    fontFamily: "Regular",
    fontSize: 12,
    marginTop: 4,
  },
  rowCompatibility: {
    color: "#4B5563",
    fontFamily: "Regular",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  addButton: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 999,
    justifyContent: "center",
    minWidth: 72,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontFamily: "SemiBold",
    fontSize: 13,
  },
  addButtonTextDisabled: {
    color: "#9CA3AF",
  },
  emptyText: {
    color: "#6B7280",
    fontFamily: "Regular",
    fontSize: 14,
    textAlign: "center",
  },
});

export default AddFriendsScreen;
