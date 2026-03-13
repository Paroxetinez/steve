import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useQuery } from "convex/react";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@packages/backend/convex/_generated/api";
import { useNativePreferences } from "../preferences/NativePreferencesProvider";
import { useNativeSession } from "../session/NativeSessionProvider";
import {
  formatNativeReportRelativeTime,
  getNativeReportTagLabel,
} from "./nativeReportsPresentation";

const ReportsScreen = ({ navigation }) => {
  const { sessionToken } = useNativeSession();
  const { language } = useNativePreferences();
  const report = useQuery(
    api.chatConversations.getMyReport,
    sessionToken ? { sessionToken } : "skip",
  );
  const highlights = report?.highlights ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Steve report</Text>
        <View style={styles.headerButton} />
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{report?.stats.totalAssists ?? 0}</Text>
          <Text style={styles.statLabel}>Total assists</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{report?.stats.icebreaks ?? 0}</Text>
          <Text style={styles.statLabel}>Icebreaks</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{report?.stats.offlineMeetups ?? 0}</Text>
          <Text style={styles.statLabel}>Offline meetups</Text>
        </View>
      </View>
      <Text style={styles.highlightsTitle}>Highlights</Text>
      <FlatList
        contentContainerStyle={highlights.length === 0 ? styles.emptyList : styles.list}
        data={highlights}
        keyExtractor={(item) => item.conversationId}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("ChatScreen", {
                conversationId: item.conversationId,
                conversationName: item.title,
              })
            }
            style={styles.highlightCard}
          >
            <View style={styles.highlightTop}>
              <Text numberOfLines={1} style={styles.highlightTitle}>
                {item.title}
              </Text>
              <Text style={styles.highlightTag}>
                {getNativeReportTagLabel({ language, tag: item.tag })}
              </Text>
            </View>
            <Text numberOfLines={3} style={styles.highlightPreview}>
              {item.preview}
            </Text>
            <Text style={styles.highlightTime}>
              {formatNativeReportRelativeTime({ language, timestamp: item.updatedAt })}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No highlights yet.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
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
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 28,
  },
  statCard: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    color: "#111827",
    fontFamily: "Bold",
    fontSize: 32,
  },
  statLabel: {
    color: "#6B7280",
    fontFamily: "Regular",
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
  highlightsTitle: {
    color: "#9CA3AF",
    fontFamily: "SemiBold",
    fontSize: 12,
    marginBottom: 12,
    marginTop: 28,
    textTransform: "uppercase",
  },
  list: {
    paddingBottom: 24,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  highlightCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F3F4F6",
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    padding: 18,
  },
  highlightTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  highlightTitle: {
    color: "#111827",
    flex: 1,
    fontFamily: "SemiBold",
    fontSize: 15,
    marginRight: 8,
  },
  highlightTag: {
    backgroundColor: "#111827",
    borderRadius: 999,
    color: "#FFFFFF",
    fontFamily: "SemiBold",
    fontSize: 11,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  highlightPreview: {
    color: "#4B5563",
    fontFamily: "Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  highlightTime: {
    color: "#9CA3AF",
    fontFamily: "Regular",
    fontSize: 12,
    marginTop: 12,
  },
  emptyText: {
    color: "#6B7280",
    fontFamily: "Regular",
    fontSize: 14,
    textAlign: "center",
  },
});

export default ReportsScreen;
