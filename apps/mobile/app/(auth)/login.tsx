import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/components/auth-provider";
import { BrandLogo } from "@/components/brand-logo";
import { useAppSettings } from "@/components/app-settings-provider";
import { humanizeApiError, t } from "@/lib/i18n";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { language } = useAppSettings();
  const isRtl = language === "ar";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length >= 4 && !submitting;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      setError(humanizeApiError(language, e?.message ?? ""));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: "height" })}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <BrandLogo style={styles.logo} />
        </View>

        {/* Title */}
        <Text style={[styles.title, isRtl && styles.rtlText]}>{t(language, "login_title")}</Text>
        <Text style={[styles.subtitle, isRtl && styles.rtlText]}>{t(language, "login_subtitle")}</Text>

        {/* Form */}
        <View style={styles.form}>
          {/* Email */}
          <View style={styles.field}>
            <Text style={[styles.label, isRtl && styles.rtlText]}>{t(language, "email_label")}</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              placeholder="name@company.com"
              placeholderTextColor="rgba(255,255,255,0.28)"
              value={email}
              onChangeText={setEmail}
              style={[styles.input, isRtl && styles.rtlInput]}
            />
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={[styles.label, isRtl && styles.rtlText]}>{t(language, "password_label")}</Text>
            <View style={styles.inputWrap}>
              <TextInput
                secureTextEntry={!showPass}
                textContentType="password"
                autoComplete="password"
                placeholder="••••••••"
                placeholderTextColor="rgba(255,255,255,0.28)"
                value={password}
                onChangeText={setPassword}
                style={[styles.input, isRtl ? styles.inputWithToggleRtl : styles.inputWithToggleLtr, isRtl && styles.rtlInput]}
              />
              <Pressable
                onPress={() => setShowPass((v) => !v)}
                style={[styles.toggleBtn, isRtl ? styles.toggleBtnRtl : styles.toggleBtnLtr]}
                hitSlop={8}
              >
                <Text style={styles.toggleText}>{showPass ? "🙈" : "👁"}</Text>
              </Pressable>
            </View>
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={[styles.errorText, isRtl && styles.rtlText]}>{error}</Text>
            </View>
          ) : null}

          {/* Submit */}
          <Pressable
            onPress={() => void submit()}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.btn,
              !canSubmit && styles.btnDisabled,
              pressed && canSubmit && styles.btnPressed,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>{t(language, "sign_in")}</Text>
            )}
          </Pressable>
        </View>

        {/* Dev hint */}
        <Text style={[styles.hint, isRtl && styles.rtlText]}>{t(language, "dev_base_url_hint")}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0a0f1e",
  },
  scroll: {
    flexGrow: 1,
    padding: 28,
    justifyContent: "center",
    minHeight: "100%",
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: 36,
  },
  logo: {
    alignItems: "center",
  },
  title: {
    color: "#f1f5f9",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 6,
  },
  subtitle: {
    color: "rgba(255,255,255,0.50)",
    fontSize: 15,
    marginBottom: 32,
    lineHeight: 22,
  },
  rtlText: {
    textAlign: "right",
  },
  form: {
    gap: 18,
    marginBottom: 24,
  },
  field: {
    gap: 7,
  },
  label: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 15 : 13,
    color: "#f1f5f9",
    fontSize: 15,
  },
  rtlInput: {
    textAlign: "right",
  },
  inputWrap: {
    position: "relative",
  },
  inputWithToggleLtr: {
    paddingRight: 50,
  },
  inputWithToggleRtl: {
    paddingLeft: 50,
  },
  toggleBtn: {
    position: "absolute",
    top: 0,
    bottom: 0,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  toggleBtnLtr: { right: 0 },
  toggleBtnRtl: { left: 0 },
  toggleText: {
    fontSize: 16,
  },
  errorBox: {
    backgroundColor: "rgba(239,68,68,0.10)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.28)",
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: "#f87171",
    fontSize: 14,
    lineHeight: 20,
  },
  btn: {
    backgroundColor: "#3b82f6",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.40,
    shadowRadius: 14,
    elevation: 8,
  },
  btnDisabled: {
    backgroundColor: "#1e293b",
    shadowOpacity: 0,
    elevation: 0,
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  hint: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 18,
  },
});
