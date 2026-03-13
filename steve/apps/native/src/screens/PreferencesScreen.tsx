import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNativePreferences } from "../preferences/NativePreferencesProvider";

const PreferencesScreen = ({ navigation }) => {
  const { language, setLanguage } = useNativePreferences();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Preferences</Text>
        <View style={styles.headerButton} />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Language</Text>
        <Text style={styles.sectionDescription}>Choose your preferred language.</Text>
        <View style={styles.languageRow}>
          <TouchableOpacity
            onPress={() => {
              void setLanguage("en");
            }}
            style={[styles.languageButton, language === "en" ? styles.languageButtonActive : null]}
          >
            <Text
              style={[
                styles.languageButtonText,
                language === "en" ? styles.languageButtonTextActive : null,
              ]}
            >
              English
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              void setLanguage("zh");
            }}
            style={[styles.languageButton, language === "zh" ? styles.languageButtonActive : null]}
          >
            <Text
              style={[
                styles.languageButtonText,
                language === "zh" ? styles.languageButtonTextActive : null,
              ]}
            >
              中文
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    color: "#111827",
    fontFamily: "SemiBold",
    fontSize: 18,
  },
  sectionDescription: {
    color: "#6B7280",
    fontFamily: "Regular",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  languageRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  languageButton: {
    borderColor: "#E5E7EB",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 14,
  },
  languageButtonActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  languageButtonText: {
    color: "#111827",
    fontFamily: "SemiBold",
    fontSize: 15,
    textAlign: "center",
  },
  languageButtonTextActive: {
    color: "#FFFFFF",
  },
});

export default PreferencesScreen;
