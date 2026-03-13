import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@packages/backend/convex/_generated/api";
import { NativeAvatar } from "../components/NativeAvatar";
import {
  pickNativeImageFromLibrary,
  requestNativeAvatarUploadTarget,
  uploadNativeAssetToSignedUrl,
} from "../lib/nativeMediaUpload";
import { useNativeSession } from "../session/NativeSessionProvider";

const ProfileEditScreen = ({ navigation }) => {
  const { sessionToken } = useNativeSession();
  const profile = useQuery(
    api.chatProfiles.getMyProfile,
    sessionToken ? { sessionToken } : "skip",
  );
  const upsertMyProfile = useMutation(api.chatProfiles.upsertMyProfile);
  const [nickname, setNickname] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [year, setYear] = React.useState("");
  const [month, setMonth] = React.useState("");
  const [day, setDay] = React.useState("");
  const [city, setCity] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [avatarObjectKey, setAvatarObjectKey] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!profile) {
      return;
    }

    const [nextYear, nextMonth, nextDay] = (profile.birthday ?? "").split("-");
    setNickname(profile.nickname ?? "");
    setGender(profile.gender ?? "");
    setYear(nextYear ?? "");
    setMonth(nextMonth ? String(Number(nextMonth)) : "");
    setDay(nextDay ? String(Number(nextDay)) : "");
    setCity(profile.city ?? "");
    setAvatarUrl(profile.avatarUrl ?? null);
    setAvatarObjectKey(profile.avatarObjectKey ?? null);
  }, [profile]);

  const canSave =
    Boolean(sessionToken) &&
    Boolean(nickname.trim()) &&
    Boolean(gender.trim()) &&
    Boolean(city.trim()) &&
    /^\d{4}$/.test(year) &&
    /^\d{1,2}$/.test(month) &&
    /^\d{1,2}$/.test(day) &&
    !saving &&
    !uploading;

  async function handlePickAvatar() {
    if (!sessionToken || uploading) {
      return;
    }

    const asset = await pickNativeImageFromLibrary();
    if (!asset) {
      return;
    }

    setUploading(true);
    setAvatarUrl(asset.uri);
    try {
      const target = await requestNativeAvatarUploadTarget({
        sessionToken,
        contentType: asset.mimeType,
      });
      await uploadNativeAssetToSignedUrl({
        asset,
        uploadUrl: target.uploadUrl,
      });
      setAvatarObjectKey(target.objectKey);
      setAvatarUrl(target.publicUrl);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!sessionToken || !canSave) {
      return;
    }

    setSaving(true);
    try {
      await upsertMyProfile({
        sessionToken,
        nickname: nickname.trim(),
        gender: gender.trim().toLowerCase(),
        birthday: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
        city: city.trim(),
        avatarObjectKey: avatarObjectKey ?? undefined,
      });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit profile</Text>
        <View style={styles.headerButton} />
      </View>
      <View style={styles.avatarWrap}>
        <TouchableOpacity onPress={() => void handlePickAvatar()} style={styles.avatarButton}>
          <NativeAvatar fallback={nickname || "?"} size={100} uri={avatarUrl} />
          <View style={styles.avatarBadge}>
            <Ionicons name="camera-outline" size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>
      <TextInput
        onChangeText={setNickname}
        placeholder="Nickname"
        placeholderTextColor="#9CA3AF"
        style={styles.input}
        value={nickname}
      />
      <TextInput
        onChangeText={setGender}
        placeholder="Gender"
        placeholderTextColor="#9CA3AF"
        style={styles.input}
        value={gender}
      />
      <View style={styles.row}>
        <TextInput
          keyboardType="number-pad"
          maxLength={4}
          onChangeText={setYear}
          placeholder="Year"
          placeholderTextColor="#9CA3AF"
          style={[styles.input, styles.rowInput]}
          value={year}
        />
        <TextInput
          keyboardType="number-pad"
          maxLength={2}
          onChangeText={setMonth}
          placeholder="Month"
          placeholderTextColor="#9CA3AF"
          style={[styles.input, styles.rowInput]}
          value={month}
        />
        <TextInput
          keyboardType="number-pad"
          maxLength={2}
          onChangeText={setDay}
          placeholder="Day"
          placeholderTextColor="#9CA3AF"
          style={[styles.input, styles.rowInput]}
          value={day}
        />
      </View>
      <TextInput
        onChangeText={setCity}
        placeholder="City"
        placeholderTextColor="#9CA3AF"
        style={styles.input}
        value={city}
      />
      <TouchableOpacity
        disabled={!canSave}
        onPress={() => {
          void handleSave();
        }}
        style={[styles.saveButton, !canSave ? styles.saveButtonDisabled : null]}
      >
        <Text style={styles.saveButtonText}>
          {saving ? "Saving..." : uploading ? "Uploading..." : "Save"}
        </Text>
      </TouchableOpacity>
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
    marginBottom: 12,
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
  avatarWrap: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 12,
  },
  avatarButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBadge: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 999,
    bottom: 4,
    height: 30,
    justifyContent: "center",
    position: "absolute",
    right: 0,
    width: 30,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    borderRadius: 12,
    borderWidth: 1,
    color: "#111827",
    fontFamily: "Regular",
    fontSize: 14,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  rowInput: {
    flex: 1,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 14,
    marginTop: 8,
    paddingVertical: 15,
  },
  saveButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontFamily: "SemiBold",
    fontSize: 15,
  },
});

export default ProfileEditScreen;
