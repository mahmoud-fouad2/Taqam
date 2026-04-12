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
import Ionicons from "@expo/vector-icons/Ionicons";

import { useAuth } from "@/components/auth-provider";
import { BrandLogo } from "@/components/brand-logo";
import { useAppSettings } from "@/components/app-settings-provider";
import { humanizeApiError, t } from "@/lib/i18n";
import { useTheme } from "@/theme";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { language } = useAppSettings();
  const { colors, radius } = useTheme();
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
      style={[styles.root, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { backgroundColor: colors.primaryLight }]}> 
          <View style={[styles.heroOrb, styles.heroOrbPrimary, { backgroundColor: colors.primary + "1c" }]} />
          <View style={[styles.heroOrb, styles.heroOrbSecondary, { backgroundColor: colors.primary + "12" }]} />
          <View style={styles.logoWrap}>
            <BrandLogo style={styles.logo} variant="light" />
          </View>
          <Text style={[styles.title, { color: colors.text }, isRtl && styles.rtlText]}>{t(language, "login_title")}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }, isRtl && styles.rtlText]}>{t(language, "login_subtitle")}</Text>

          <View style={[styles.heroChips, isRtl && styles.rowReverse]}>
            <View style={[styles.heroChip, { backgroundColor: colors.surface }]}> 
              <Ionicons name="finger-print-outline" size={16} color={colors.primary} />
              <Text style={[styles.heroChipText, { color: colors.text }, isRtl && styles.rtlText]}>
                {isRtl ? "بصمة آمنة" : "Biometric secure"}
              </Text>
            </View>
            <View style={[styles.heroChip, { backgroundColor: colors.surface }]}> 
              <Ionicons name="location-outline" size={16} color={colors.primary} />
              <Text style={[styles.heroChipText, { color: colors.text }, isRtl && styles.rtlText]}>
                {isRtl ? "تحقق بالموقع" : "Location verified"}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl }]}> 
          {/* Email */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }, isRtl && styles.rtlText]}>{t(language, "email_label")}</Text>
              <View style={[styles.inputShell, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}> 
                <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  placeholder="name@company.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  style={[styles.inputModern, { color: colors.text }, isRtl && styles.rtlInput]}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }, isRtl && styles.rtlText]}>{t(language, "password_label")}</Text>
              <View style={[styles.inputShell, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }, isRtl && styles.rowReverse]}> 
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                <TextInput
                  secureTextEntry={!showPass}
                  textContentType="password"
                  autoComplete="password"
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  style={[styles.inputModern, { color: colors.text }, isRtl && styles.rtlInput]}
                />
                <Pressable
                  onPress={() => setShowPass((v) => !v)}
                  style={styles.toggleBtnModern}
                  hitSlop={8}
                >
                  <Ionicons
                    name={showPass ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={colors.textMuted}
                  />
                </Pressable>
              </View>
            </View>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: colors.errorLight, borderColor: colors.error + "30" }]}> 
                <Text style={[styles.errorText, { color: colors.error }, isRtl && styles.rtlText]}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={() => void submit()}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: canSubmit ? colors.primary : colors.border, shadowColor: colors.primary },
                !canSubmit && styles.btnDisabled,
                pressed && canSubmit && styles.btnPressed,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={[styles.btnContent, isRtl && styles.rowReverse]}>
                  <Text style={styles.btnText}>{t(language, "sign_in")}</Text>
                  <Ionicons name={isRtl ? "arrow-back-outline" : "arrow-forward-outline"} size={18} color="#fff" />
                </View>
              )}
            </Pressable>

            <Text style={[styles.helperText, { color: colors.textSecondary }, isRtl && styles.rtlText]}>
              {isRtl ? "الدخول يربط الحضور والإشعارات والبيانات الشخصية بحسابك مباشرة." : "Sign in to connect attendance, notifications, and your employee profile."}
            </Text>
          </View>
        </View>

        {__DEV__ && (
          <Text style={[styles.hint, { color: colors.textSecondary }, isRtl && styles.rtlText]}>{t(language, "dev_base_url_hint")}</Text>
        )}

        <Text style={[styles.copyright, { color: colors.textMuted }, isRtl && styles.rtlText]}>
          {t(language, "copyright")}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
    minHeight: "100%",
  },
  hero: {
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 22,
    marginBottom: 18,
    overflow: "hidden",
  },
  heroOrb: {
    position: "absolute",
    borderRadius: 999,
  },
  heroOrbPrimary: {
    width: 180,
    height: 180,
    top: -70,
    right: -50,
  },
  heroOrbSecondary: {
    width: 130,
    height: 130,
    bottom: -45,
    left: -30,
  },
  logoWrap: {
    alignItems: "flex-start",
    marginBottom: 26,
  },
  logo: {
    alignItems: "center",
  },
  title: {
    color: "#0f172a",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 18,
    lineHeight: 22,
  },
  heroChips: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
  },
  heroChipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  rtlText: {
    textAlign: "right",
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
  formCard: {
    borderWidth: 1,
    padding: 18,
    marginBottom: 18,
  },
  form: {
    gap: 18,
  },
  field: {
    gap: 7,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  inputShell: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inputModern: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Platform.OS === "ios" ? 15 : 12,
  },
  rtlInput: {
    textAlign: "right",
  },
  toggleBtnModern: {
    paddingLeft: 6,
    paddingRight: 2,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
  },
  btn: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.26,
    shadowRadius: 18,
    elevation: 8,
  },
  btnDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  btnPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.988 }],
  },
  btnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  helperText: {
    fontSize: 13,
    lineHeight: 20,
  },
  hint: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 18,
  },
  copyright: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
  },
});
