import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useMutation } from "convex/react";
import { RFValue } from "react-native-responsive-fontsize";
import { api } from "@packages/backend/convex/_generated/api";
import { useNativeSession } from "../session/NativeSessionProvider";

const CURRENT_YEAR = new Date().getFullYear();

const ProfileSetupScreen = () => {
  const { markProfileCompleted, sessionToken } = useNativeSession();
  const upsertMyProfile = useMutation(api.chatProfiles.upsertMyProfile);
  const [nickname, setNickname] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [year, setYear] = React.useState("");
  const [month, setMonth] = React.useState("");
  const [day, setDay] = React.useState("");
  const [city, setCity] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canSubmit =
    Boolean(sessionToken) &&
    nickname.trim().length > 0 &&
    gender.trim().length > 0 &&
    city.trim().length > 0 &&
    /^\d{4}$/.test(year) &&
    /^\d{1,2}$/.test(month) &&
    /^\d{1,2}$/.test(day);

  const onSave = React.useCallback(async () => {
    if (!sessionToken || !canSubmit || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const birthday = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      await upsertMyProfile({
        sessionToken,
        nickname: nickname.trim(),
        gender: gender.trim().toLowerCase(),
        birthday,
        city: city.trim(),
      });
      markProfileCompleted();
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : "Unable to save your profile.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }, [
    canSubmit,
    city,
    day,
    gender,
    markProfileCompleted,
    month,
    nickname,
    sessionToken,
    submitting,
    upsertMyProfile,
    year,
  ]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set up your profile</Text>
      <Text style={styles.subtitle}>Finish the basics before entering inbox.</Text>
      <TextInput
        onChangeText={setNickname}
        placeholder="Nickname"
        style={styles.input}
        value={nickname}
      />
      <TextInput
        autoCapitalize="none"
        onChangeText={setGender}
        placeholder="Gender (male / female / other)"
        style={styles.input}
        value={gender}
      />
      <View style={styles.row}>
        <TextInput
          keyboardType="number-pad"
          maxLength={4}
          onChangeText={setYear}
          placeholder={`${CURRENT_YEAR - 25}`}
          style={[styles.input, styles.rowInput]}
          value={year}
        />
        <TextInput
          keyboardType="number-pad"
          maxLength={2}
          onChangeText={setMonth}
          placeholder="MM"
          style={[styles.input, styles.rowInput]}
          value={month}
        />
        <TextInput
          keyboardType="number-pad"
          maxLength={2}
          onChangeText={setDay}
          placeholder="DD"
          style={[styles.input, styles.rowInput]}
          value={day}
        />
      </View>
      <TextInput
        onChangeText={setCity}
        placeholder="City"
        style={styles.input}
        value={city}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TouchableOpacity
        disabled={!canSubmit || submitting}
        onPress={() => {
          void onSave();
        }}
        style={[styles.button, !canSubmit || submitting ? styles.buttonDisabled : null]}
      >
        <Text style={styles.buttonText}>{submitting ? "Saving..." : "Continue"}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
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
    marginBottom: 24,
    color: "#6B7280",
    fontFamily: "Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  rowInput: {
    flex: 1,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D0D5DD",
    borderRadius: 10,
    borderWidth: 1,
    fontFamily: "Regular",
    fontSize: RFValue(14),
    marginBottom: 16,
    padding: 14,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#0D87E1",
    borderRadius: 10,
    marginTop: 8,
    paddingVertical: 14,
  },
  buttonDisabled: {
    backgroundColor: "#9EC9F0",
  },
  buttonText: {
    color: "#FFFFFF",
    fontFamily: "SemiBold",
    fontSize: 14,
  },
  errorText: {
    color: "tomato",
    fontFamily: "Medium",
    fontSize: RFValue(14),
    marginBottom: 8,
  },
});

export default ProfileSetupScreen;
