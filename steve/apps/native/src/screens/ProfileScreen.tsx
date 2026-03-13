import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { NativeAvatar } from "../components/NativeAvatar";
import { useNativeSession } from "../session/NativeSessionProvider";

const ProfileScreen = ({ navigation, route }) => {
  const { sessionToken, signOut } = useNativeSession();
  const userId = route.params?.userId;
  const isSelf = !userId;
  const myProfile = useQuery(
    api.chatProfiles.getMyProfile,
    sessionToken && isSelf ? { sessionToken } : "skip",
  );
  const targetProfile = useQuery(
    api.chatProfiles.getProfileForViewer,
    sessionToken && !isSelf && userId ? { sessionToken, userId } : "skip",
  );
  const profile = isSelf ? myProfile : targetProfile;
  const displayName = profile?.nickname ?? "Profile";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {!isSelf ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerButton} />
        )}
        <Text style={styles.headerTitle}>{isSelf ? "Profile" : "User profile"}</Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.hero}>
        <NativeAvatar fallback={displayName} size={88} uri={profile?.avatarUrl} />
        <Text style={styles.title}>{displayName}</Text>
        <Text style={styles.idText}>{profile?.city ?? "Unknown city"}</Text>
        {profile?.gender ? <Text style={styles.meta}>{profile.gender}</Text> : null}
        {profile?.birthday ? <Text style={styles.meta}>{profile.birthday}</Text> : null}
      </View>

      {isSelf ? (
        <View style={styles.menu}>
          <TouchableOpacity
            onPress={() => navigation.navigate("ProfileEditScreen")}
            style={styles.menuRow}
          >
            <Text style={styles.menuText}>Edit profile</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("ReportsScreen")}
            style={styles.menuRow}
          >
            <Text style={styles.menuText}>Steve report</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("PreferencesScreen")}
            style={styles.menuRow}
          >
            <Text style={styles.menuText}>Preferences</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      ) : null}

      {isSelf ? (
        <TouchableOpacity
          onPress={() => {
            void signOut();
          }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Sign out</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F8FAFC",
    flex: 1,
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
  hero: {
    alignItems: "center",
    marginTop: 24,
  },
  title: {
    color: "#111827",
    fontFamily: "SemiBold",
    fontSize: 24,
    marginTop: 16,
  },
  idText: {
    color: "#6B7280",
    fontFamily: "Regular",
    fontSize: 14,
    marginTop: 8,
  },
  meta: {
    color: "#6B7280",
    fontFamily: "Regular",
    fontSize: 14,
    marginTop: 6,
  },
  menu: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginTop: 28,
    overflow: "hidden",
    width: "100%",
  },
  menuRow: {
    alignItems: "center",
    borderBottomColor: "#F3F4F6",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  menuText: {
    color: "#111827",
    fontFamily: "Medium",
    fontSize: 15,
  },
  button: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#0D87E1",
    borderRadius: 10,
    marginTop: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontFamily: "SemiBold",
    fontSize: 14,
  },
});

export default ProfileScreen;
