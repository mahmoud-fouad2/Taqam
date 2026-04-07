import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import Constants from "expo-constants";
import * as LocalAuthentication from "expo-local-authentication";

import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/components/auth-provider";
import { useAppSettings } from "@/components/app-settings-provider";
import { getApiBaseUrlInfo } from "@/lib/config";
import { humanizeApiError, t, tStr } from "@/lib/i18n";

type BiometricState = "loading" | "ready" | "not-enrolled" | "unsupported";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
const APP_PACKAGE = Constants.expoConfig?.android?.package ?? Constants.expoConfig?.ios?.bundleIdentifier ?? "unknown";

export default function SettingsScreen() {
  const { user, signOut, accessToken, authFetch } = useAuth();
  const { language, setLanguage, biometricsEnabled, setBiometricsEnabled } = useAppSettings();
  const [message, setMessage] = useState<string | null>(null);
  const [biometricState, setBiometricState] = useState<BiometricState>("loading");
  const isRtl = language === "ar";
  const apiInfo = getApiBaseUrlInfo();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [hasHardware, isEnrolled] = await Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
        ]);

        if (!mounted) return;

        if (!hasHardware) {
          setBiometricState("unsupported");
          return;
        }

        setBiometricState(isEnrolled ? "ready" : "not-enrolled");
      } catch {
        if (mounted) setBiometricState("unsupported");
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const signOutAll = async () => {
    setMessage(null);
    try {
      if (accessToken) {
        await authFetch("/api/mobile/auth/logout-all", { method: "POST" });
      }
      await signOut();
    } catch (e: any) {
      setMessage(humanizeApiError(language, e?.message || ""));
    }
  };

  const toggleBiometrics = async () => {
    if (biometricState !== "ready") return;
    setMessage(null);

    try {
      await setBiometricsEnabled(!biometricsEnabled);
    } catch (e: any) {
      setMessage(humanizeApiError(language, e?.message || ""));
    }
  };

  const biometricStatusText =
    biometricState === "loading"
      ? tStr(language, "جارٍ فحص البصمة على هذا الجهاز...", "Checking biometric support on this device...")
      : biometricState === "ready"
        ? biometricsEnabled
          ? tStr(language, "البصمة مفعلة لتأكيد الحضور والانصراف.", "Biometrics are enabled for attendance confirmation.")
          : tStr(language, "البصمة متاحة لكن معطلة من إعدادات التطبيق.", "Biometrics are available but disabled in app settings.")
        : biometricState === "not-enrolled"
          ? tStr(language, "الجهاز يدعم البصمة لكن لا توجد بصمة أو وجه مسجلان عليه.", "This device supports biometrics, but none are enrolled.")
          : tStr(language, "هذا الجهاز لا يدعم المصادقة الحيوية.", "This device does not support biometric authentication.");

  const diagnostics = [
    {
      label: tStr(language, "إصدار التطبيق", "App version"),
      value: `v${APP_VERSION}`,
    },
    {
      label: tStr(language, "معرّف الحزمة", "Package ID"),
      value: APP_PACKAGE,
    },
    {
      label: tStr(language, "عنوان الخادم", "API base URL"),
      value: apiInfo.value,
    },
    {
      label: tStr(language, "مصدر الإعداد", "Config source"),
      value:
        apiInfo.source === "env"
          ? tStr(language, "ملف البيئة EXPO_PUBLIC_API_BASE_URL", "EXPO_PUBLIC_API_BASE_URL")
          : apiInfo.source === "default"
            ? tStr(language, "الافتراضي الإنتاجي المدمج (taqam.net)", "Built-in production default (taqam.net)")
            : tStr(language, "Fallback محلي مؤقت", "Temporary localhost fallback"),
      isWarning: apiInfo.isLocalFallback,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BrandLogo style={styles.logo} />

      <View style={styles.heroCard}>
        <Text style={styles.title}>{t(language, "settings_title")}</Text>
        <Text style={[styles.heroText, isRtl && styles.rtlText]}>
          {user
            ? `${user.firstName} ${user.lastName} • ${user.email}`
            : tStr(language, "غير مسجل الدخول", "Not signed in")}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={[styles.sectionTitle, isRtl && styles.rtlText]}>
          {tStr(language, "الأمان والتحقق", "Security and verification")}
        </Text>

        <Pressable
          onPress={() => void toggleBiometrics()}
          disabled={biometricState !== "ready"}
          style={[
            styles.preferenceRow,
            isRtl && styles.preferenceRowRtl,
            biometricState !== "ready" && styles.preferenceRowDisabled,
          ]}
        >
          <View style={styles.preferenceCopy}>
            <Text style={[styles.preferenceTitle, isRtl && styles.rtlText]}>
              {tStr(language, "تأكيد الحضور بالبصمة", "Biometric attendance confirmation")}
            </Text>
            <Text style={[styles.preferenceMeta, isRtl && styles.rtlText]}>{biometricStatusText}</Text>
          </View>

          <View
            style={[
              styles.toggleTrack,
              biometricsEnabled && biometricState === "ready" && styles.toggleTrackActive,
              biometricState !== "ready" && styles.toggleTrackDisabled,
            ]}
          >
            <View
              style={[
                styles.toggleThumb,
                biometricsEnabled && biometricState === "ready" && styles.toggleThumbActive,
              ]}
            />
          </View>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={[styles.sectionTitle, isRtl && styles.rtlText]}>{t(language, "language")}</Text>
        <View style={[styles.langRow, isRtl && styles.langRowRtl]}>
          <Pressable
            onPress={() => void setLanguage("ar")}
            style={[styles.langBtn, language === "ar" && styles.langBtnActive]}
          >
            <Text style={styles.langText}>{t(language, "arabic")}</Text>
          </Pressable>
          <Pressable
            onPress={() => void setLanguage("en")}
            style={[styles.langBtn, language === "en" && styles.langBtnActive]}
          >
            <Text style={styles.langText}>{t(language, "english")}</Text>
          </Pressable>
        </View>
        <Text style={[styles.restartHint, isRtl && styles.rtlText]}>{t(language, "restart_required")}</Text>
      </View>

      <View style={styles.card}>
        <Text style={[styles.sectionTitle, isRtl && styles.rtlText]}>
          {tStr(language, "الجلسة", "Session")}
        </Text>

        <Pressable onPress={() => void signOut()} style={[styles.button, styles.logout]}>
          <Text style={styles.buttonText}>{t(language, "logout")}</Text>
        </Pressable>

        <Pressable onPress={() => void signOutAll()} style={[styles.button, styles.logoutAll]}>
          <Text style={styles.buttonText}>{t(language, "logout_all")}</Text>
        </Pressable>

        {message ? <Text style={[styles.msg, isRtl && styles.rtlText]}>{message}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={[styles.sectionTitle, isRtl && styles.rtlText]}>
          {tStr(language, "تشخيص التشغيل", "Runtime diagnostics")}
        </Text>

        {diagnostics.map((item) => (
          <View key={item.label} style={[styles.infoRow, isRtl && styles.infoRowRtl]}>
            <Text style={[styles.infoLabel, isRtl && styles.rtlText]}>{item.label}</Text>
            <Text
              style={[
                styles.infoValue,
                isRtl && styles.rtlText,
                item.isWarning && styles.warningText,
              ]}
            >
              {item.value}
            </Text>
          </View>
        ))}

        {apiInfo.isLocalFallback ? (
          <Text style={[styles.warningBanner, isRtl && styles.rtlText]}>
            {tStr(
              language,
              "هذا البناء ما زال يعتمد على localhost كاحتياط. اضبط EXPO_PUBLIC_API_BASE_URL قبل مشاركة التطبيق خارج جهاز التطوير.",
              "This build is still using localhost as a fallback. Set EXPO_PUBLIC_API_BASE_URL before sharing the app outside the dev machine.",
            )}
          </Text>
        ) : (
          <Text style={[styles.successBanner, isRtl && styles.rtlText]}>
            {tStr(
              language,
              "التطبيق مربوط حاليًا بعنوان خادم صريح ويمكن مراجعته من هذه الشاشة.",
              "The app is currently wired to an explicit backend URL visible on this screen.",
            )}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1220",
  },
  content: {
    padding: 16,
    paddingBottom: 28,
    gap: 12,
  },
  logo: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 2,
  },
  heroCard: {
    backgroundColor: "rgba(15,23,42,0.92)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.24)",
    borderRadius: 18,
    padding: 18,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: 16,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  heroText: {
    color: "rgba(255,255,255,0.70)",
    marginTop: 6,
    lineHeight: 20,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  logout: {
    backgroundColor: "rgba(248,113,113,0.18)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.35)",
  },
  logoutAll: {
    marginTop: 10,
    backgroundColor: "rgba(248,113,113,0.10)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.25)",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
  },
  msg: {
    marginTop: 10,
    color: "rgba(255,255,255,0.70)",
    fontSize: 12,
  },
  sectionTitle: {
    color: "rgba(255,255,255,0.85)",
    fontWeight: "800",
    marginBottom: 10,
  },
  rtlText: {
    textAlign: "right",
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    padding: 14,
  },
  preferenceRowRtl: {
    flexDirection: "row-reverse",
  },
  preferenceRowDisabled: {
    opacity: 0.72,
  },
  preferenceCopy: {
    flex: 1,
  },
  preferenceTitle: {
    color: "#fff",
    fontWeight: "800",
    marginBottom: 4,
  },
  preferenceMeta: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    lineHeight: 18,
  },
  toggleTrack: {
    width: 54,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(148,163,184,0.28)",
    padding: 4,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  toggleTrackActive: {
    alignItems: "flex-end",
    backgroundColor: "rgba(34,197,94,0.34)",
  },
  toggleTrackDisabled: {
    backgroundColor: "rgba(71,85,105,0.35)",
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#e2e8f0",
  },
  toggleThumbActive: {
    backgroundColor: "#ffffff",
  },
  langRow: {
    flexDirection: "row",
    gap: 10,
  },
  langRowRtl: {
    flexDirection: "row-reverse",
  },
  langBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
  },
  langBtnActive: {
    borderColor: "rgba(34,197,94,0.45)",
    backgroundColor: "rgba(34,197,94,0.12)",
  },
  langText: {
    color: "#fff",
    fontWeight: "800",
  },
  restartHint: {
    marginTop: 10,
    color: "rgba(255,255,255,0.60)",
    fontSize: 12,
  },
  infoRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  infoRowRtl: {
    alignItems: "flex-end",
  },
  infoLabel: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    color: "#fff",
    fontWeight: "700",
  },
  warningText: {
    color: "#fbbf24",
  },
  warningBanner: {
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "rgba(251,191,36,0.12)",
    color: "#fcd34d",
    lineHeight: 20,
  },
  successBanner: {
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "rgba(34,197,94,0.12)",
    color: "#86efac",
    lineHeight: 20,
  },
});
