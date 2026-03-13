import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { NativeAvatar } from "../components/NativeAvatar";
import { useNativeSession } from "../session/NativeSessionProvider";

const SearchResultScreen = ({ navigation, route }) => {
  const { sessionToken } = useNativeSession();
  const seededCandidate = route.params?.candidate ?? null;
  const selectedUserId = seededCandidate?.userId ?? null;
  const [adding, setAdding] = React.useState(false);
  const candidates = useQuery(
    api.chatConversations.discoverUsers,
    sessionToken && selectedUserId
      ? { sessionToken, language: "en", includeConnected: true }
      : "skip",
  );
  const createDirectConversationWithUser = useMutation(
    api.chatConversations.createDirectConversationWithUser,
  );

  const selected =
    candidates?.find((item) => String(item.userId) === String(selectedUserId)) ?? seededCandidate;

  async function handleAdd() {
    if (!sessionToken || !selected || adding) {
      return;
    }

    if (selected.isConnected && selected.conversationId) {
      navigation.replace("ChatScreen", {
        conversationId: selected.conversationId,
        conversationName: selected.nickname,
        targetUserId: selected.userId,
      });
      return;
    }

    setAdding(true);
    try {
      const result = await createDirectConversationWithUser({
        sessionToken,
        targetUserId: selected.userId,
      });
      navigation.replace("ChatScreen", {
        conversationId: result.conversationId,
        conversationName: selected.nickname,
        targetUserId: selected.userId,
      });
    } finally {
      setAdding(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <NativeAvatar
          fallback={selected?.nickname ?? "?"}
          size={140}
          uri={selected?.avatarUrl}
        />
        <Text style={styles.name}>{selected?.nickname ?? "Loading..."}</Text>
        <Text style={styles.idText}>ID: {selected?.displayId ?? "-"}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Match Info</Text>
          {(selected?.compatibility ?? []).map((line) => (
            <Text key={line} style={styles.cardLine}>
              {line}
            </Text>
          ))}
        </View>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity
          disabled={!selected || adding}
          onPress={() => {
            void handleAdd();
          }}
          style={[styles.button, !selected ? styles.buttonDisabled : null]}
        >
          <Text style={styles.buttonText}>
            {adding
              ? "Adding..."
              : selected?.isConnected
                ? "Open chat"
                : selected
                  ? "Add friend"
                  : "No user"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  content: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  name: {
    color: "#111827",
    fontFamily: "Bold",
    fontSize: 28,
    marginTop: 20,
  },
  idText: {
    color: "#9CA3AF",
    fontFamily: "Regular",
    fontSize: 13,
    marginTop: 8,
  },
  card: {
    alignSelf: "stretch",
    backgroundColor: "#F9FAFB",
    borderRadius: 24,
    marginTop: 28,
    padding: 20,
  },
  cardTitle: {
    color: "#374151",
    fontFamily: "SemiBold",
    fontSize: 15,
    marginBottom: 12,
  },
  cardLine: {
    color: "#4B5563",
    fontFamily: "Regular",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 999,
    paddingVertical: 16,
  },
  buttonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  buttonText: {
    color: "#FFFFFF",
    fontFamily: "SemiBold",
    fontSize: 15,
  },
});

export default SearchResultScreen;
