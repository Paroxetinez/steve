import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const CreateNotePlaceholderScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Note</Text>
      <Text style={styles.subtitle}>
        This route is preserved as a placeholder until native product scope returns to notes.
      </Text>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.button}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Go back</Text>
      </TouchableOpacity>
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
  button: {
    marginTop: 20,
    alignSelf: "flex-start",
    backgroundColor: "#0D87E1",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontFamily: "SemiBold",
    fontSize: 14,
  },
});

export default CreateNotePlaceholderScreen;
