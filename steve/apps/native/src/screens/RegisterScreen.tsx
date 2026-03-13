import React from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { useNativeSession } from "../session/NativeSessionProvider";
import {
  canSubmitNativePhoneRegistration,
  normalizeNativePhone,
} from "../session/nativePhoneAuthForm";

const RegisterScreen = ({ navigation }) => {
  const { registerWithPhone } = useNativeSession();
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [inviteCode, setInviteCode] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const canSubmit = canSubmitNativePhoneRegistration({
    phone,
    password,
    confirmPassword,
    inviteCode,
  });

  const onPress = React.useCallback(async () => {
    if (!canSubmit || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await registerWithPhone({
        phone: normalizeNativePhone(phone),
        password,
        confirmPassword,
        inviteCode: inviteCode.trim().toUpperCase(),
      });
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : "Unable to create your account.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, confirmPassword, inviteCode, password, phone, registerWithPhone, submitting]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image source={require("../assets/icons/logo.png")} style={styles.logo} />
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Register with your phone number and invitation code.</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="phone-pad"
          onChangeText={setPhone}
          placeholder="Phone number"
          style={styles.input}
          textContentType="telephoneNumber"
          value={phone}
        />
        <TextInput
          autoCapitalize="characters"
          autoCorrect={false}
          onChangeText={setInviteCode}
          placeholder="Invitation code"
          style={styles.input}
          value={inviteCode}
        />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          style={styles.input}
          textContentType="newPassword"
          value={password}
        />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setConfirmPassword}
          placeholder="Confirm password"
          secureTextEntry
          style={styles.input}
          textContentType="password"
          value={confirmPassword}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity
          disabled={!canSubmit || submitting}
          onPress={onPress}
          style={[
            styles.buttonPrimary,
            !canSubmit || submitting ? styles.buttonPrimaryDisabled : null,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Create account</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.secondaryAction}>
          <Text style={styles.secondaryActionText}>Back to login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  card: {
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    width: "98%",
  },
  logo: {
    width: 74,
    height: 74,
    marginTop: 20,
  },
  title: {
    marginTop: 49,
    fontSize: RFValue(21),
    fontFamily: "SemiBold",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 32,
    color: "#000",
    fontFamily: "Regular",
    fontSize: RFValue(14),
    textAlign: "center",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontFamily: "Regular",
    fontSize: RFValue(14),
  },
  buttonPrimary: {
    alignItems: "center",
    backgroundColor: "#0D87E1",
    borderRadius: 10,
    justifyContent: "center",
    marginBottom: 16,
    minHeight: 48,
    width: "100%",
  },
  buttonPrimaryDisabled: {
    backgroundColor: "#9EC9F0",
  },
  buttonText: {
    color: "#FFF",
    fontFamily: "SemiBold",
    fontSize: RFValue(14),
    textAlign: "center",
  },
  secondaryAction: {
    paddingVertical: 8,
  },
  secondaryActionText: {
    color: "#0D87E1",
    fontFamily: "SemiBold",
    fontSize: RFValue(14),
  },
  errorText: {
    alignSelf: "flex-start",
    color: "tomato",
    fontFamily: "Medium",
    fontSize: RFValue(14),
    marginBottom: 8,
    marginLeft: 4,
  },
});

export default RegisterScreen;
