import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNativePreferences } from "../preferences/NativePreferencesProvider";

const QUESTIONS = {
  en: [
    "Do you prefer daily chatting in early dating?",
    "Can you accept a long-distance relationship?",
    "Should couples discuss finances before marriage?",
    "Can exes stay friends after a breakup?",
    "Do you prefer direct communication in conflicts?",
  ],
  zh: [
    "你希望在刚开始约会时每天都聊天吗？",
    "你能接受异地恋吗？",
    "你觉得情侣婚前应该聊清楚金钱观吗？",
    "分手后还能和前任做朋友吗？",
    "你在冲突里更喜欢直接沟通吗？",
  ],
} as const;

const DiscoveryScreen = ({ navigation }) => {
  const { language } = useNativePreferences();
  const [index, setIndex] = React.useState(0);
  const questions = QUESTIONS[language];
  const currentQuestion = questions[index];

  function handleNext() {
    setIndex((current) => (current + 1) % questions.length);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discovery</Text>
        <View style={styles.headerButton} />
      </View>
      <View style={styles.body}>
        <View style={styles.card}>
          <Text style={styles.cardQuestion}>{currentQuestion}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleNext} style={styles.actionButton}>
            <Ionicons name="close" size={24} color="#111827" />
            <Text style={styles.actionLabel}>
              {language === "zh" ? "不接受" : "Hell no"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext} style={styles.actionButton}>
            <Ionicons name="heart" size={24} color="#E11D48" />
            <Text style={styles.actionLabel}>{language === "zh" ? "我可以" : "I can"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF6EF",
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
  headerTitle: {
    color: "#111827",
    fontFamily: "SemiBold",
    fontSize: 18,
  },
  body: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 40,
  },
  card: {
    alignItems: "center",
    aspectRatio: 3 / 4,
    backgroundColor: "#43495E",
    borderRadius: 30,
    justifyContent: "center",
    maxWidth: 360,
    paddingHorizontal: 24,
    width: "100%",
  },
  cardQuestion: {
    color: "#FFFFFF",
    fontFamily: "Bold",
    fontSize: 30,
    lineHeight: 40,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 40,
    marginTop: 28,
  },
  actionButton: {
    alignItems: "center",
    gap: 8,
  },
  actionLabel: {
    color: "#111827",
    fontFamily: "SemiBold",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});

export default DiscoveryScreen;
