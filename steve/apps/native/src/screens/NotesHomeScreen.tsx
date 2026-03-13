import React from "react";
import { StyleSheet, Text, View } from "react-native";

const NotesHomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notes</Text>
      <Text style={styles.subtitle}>
        The old notes prototype is no longer on the critical product path. This route stays
        in the app shell as a placeholder while native work focuses on inbox, chat, and
        profile.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    fontSize: 24,
    color: "#111827",
    fontFamily: "SemiBold",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#6B7280",
    fontFamily: "Regular",
  },
});

export default NotesHomeScreen;
