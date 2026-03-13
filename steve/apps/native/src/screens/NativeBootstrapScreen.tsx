import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const NativeBootstrapScreen = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color="#0D87E1" />
      <Text style={styles.text}>Loading session...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Regular",
  },
});

export default NativeBootstrapScreen;
