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
  canSubmitNativePhoneLogin,
  normalizeNativePhone,
} from "../session/nativePhoneAuthForm";

const LoginScreen = ({ navigation }) => {
  const { signInWithPhone } = useNativeSession();
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const canSubmit = canSubmitNativePhoneLogin({ phone, password });

  const onPress = React.useCallback(async () => {
    if (!canSubmit || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await signInWithPhone(normalizeNativePhone(phone), password);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : "Unable to sign in right now.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, password, phone, signInWithPhone, submitting]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image source={require("../assets/icons/logo.png")} style={styles.logo} />
        <Text style={styles.title}>Log in to your account</Text>
        <Text style={styles.subtitle}>Use your registered phone number and password.</Text>
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
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          style={styles.input}
          textContentType="password"
          value={password}
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
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate("RegisterScreen")}>
            <Text style={styles.signupAction}>Create one</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 32,
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
  signupContainer: {
    flexDirection: "row",
  },
  signupText: {
    color: "#667085",
    fontFamily: "Regular",
  },
  signupAction: {
    color: "#0D87E1",
    fontFamily: "SemiBold",
    marginLeft: 6,
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

export default LoginScreen;
