import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import Constants from "expo-constants";
import * as LocalAuthentication from "expo-local-authentication";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/components/auth-provider";
import { useAppSettings } from "@/components/app-settings-provider";
import { getApiBaseUrlInfo } from "@/lib/config";
import { humanizeApiError, t, tStr } from "@/lib/i18n";
import { useTheme } from "@/theme";
import type { ThemeMode } from "@/lib/settings-storage";

type BiometricState = "loading" | "ready" | "not-enrolled" | "unsupported";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
const APP_PACKAGE = Constants.expoConfig?.android?.package ?? Constants.expoConfig?.ios?.bundleIdentifier ?? "unknown";

export default function SettingsScreen() {
  const { user, signOut, accessToken, authFetch } = useAuth();
  const { language, setLanguage, biometricsEnabled, setBiometricsEnabled, themeMode, setThemeMode } = useAppSettings();
  const { colors, isDark, spacing, radius } = useTheme();
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

  const themeModes: { mode: ThemeMode; icon: "sun-o" | "moon-o" | "cog"; labelAr: string; labelEn: string }[] = [
    { mode: "system", icon: "cog", labelAr: "تلقائي", labelEn: "Auto" },
    { mode: "light", icon: "sun-o", labelAr: "فاتح", labelEn: "Light" },
    { mode: "dark", icon: "moon-o", labelAr: "داكن", labelEn: "Dark" },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: 28, gap: 12 }}
    >
      <BrandLogo style={{ alignItems: "center", marginTop: 10, marginBottom: 2 }} variant={isDark ? "dark" : "light"} />

      {/* Hero */}
      <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary + "30", borderRadius: 18, padding: 18 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>{t(language, "settings_title")}</Text>
        <Text style={[{ color: colors.textSecondary, marginTop: 6, lineHeight: 20 }, isRtl && { textAlign: "right" }]}>
          {user
            ? `${user.firstName} ${user.lastName} • ${user.email}`
            : tStr(language, "غير مسجل الدخول", "Not signed in")}
        </Text>
      </View>

      {/* Dark Mode */}
      <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md }}>
        <Text style={[{ color: colors.text, fontWeight: "800", marginBottom: 10 }, isRtl && { textAlign: "right" }]}>
          {tStr(language, "المظهر", "Appearance")}
        </Text>
        <View style={[{ flexDirection: "row", gap: 8 }, isRtl && { flexDirection: "row-reverse" }]}>
          {themeModes.map((tm) => {
            const active = themeMode === tm.mode;
            return (
              <Pressable
                key={tm.mode}
                onPress={() => void setThemeMode(tm.mode)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  alignItems: "center",
                  gap: 4,
                  borderColor: active ? colors.primary + "80" : colors.border,
                  backgroundColor: active ? colors.primaryLight : colors.surfaceSecondary,
                }}
              >
                <FontAwesome name={tm.icon} size={18} color={active ? colors.primary : colors.textMuted} />
                <Text style={{ color: active ? colors.primary : colors.textSecondary, fontWeight: "700", fontSize: 12 }}>
                  {isRtl ? tm.labelAr : tm.labelEn}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Security */}
      <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md }}>
        <Text style={[{ color: colors.text, fontWeight: "800", marginBottom: 10 }, isRtl && { textAlign: "right" }]}>
          {tStr(language, "الأمان والتحقق", "Security and verification")}
        </Text>

        <Pressable
          onPress={() => void toggleBiometrics()}
          disabled={biometricState !== "ready"}
          style={[
            {
              flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12,
              borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary,
              borderRadius: 14, padding: 14,
            },
            isRtl && { flexDirection: "row-reverse" },
            biometricState !== "ready" && { opacity: 0.72 },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[{ color: colors.text, fontWeight: "800", marginBottom: 4 }, isRtl && { textAlign: "right" }]}>
              {tStr(language, "تأكيد الحضور بالبصمة", "Biometric attendance confirmation")}
            </Text>
            <Text style={[{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }, isRtl && { textAlign: "right" }]}>
              {biometricStatusText}
            </Text>
          </View>

          <View
            style={{
              width: 54, height: 30, borderRadius: 999, padding: 4, justifyContent: "center",
              alignItems: biometricsEnabled && biometricState === "ready" ? "flex-end" : "flex-start",
              backgroundColor: biometricsEnabled && biometricState === "ready" ? colors.success : colors.border,
            }}
          >
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#ffffff" }} />
          </View>
        </Pressable>
      </View>

      {/* Language */}
      <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md }}>
        <Text style={[{ color: colors.text, fontWeight: "800", marginBottom: 10 }, isRtl && { textAlign: "right" }]}>
          {t(language, "language")}
        </Text>
        <View style={[{ flexDirection: "row", gap: 10 }, isRtl && { flexDirection: "row-reverse" }]}>
          <Pressable
            onPress={() => void setLanguage("ar")}
            style={{
              flex: 1, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, alignItems: "center",
              borderColor: language === "ar" ? colors.primary + "80" : colors.border,
              backgroundColor: language === "ar" ? colors.primaryLight : colors.surfaceSecondary,
            }}
          >
            <Text style={{ color: language === "ar" ? colors.primary : colors.text, fontWeight: "800" }}>
              {t(language, "arabic")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void setLanguage("en")}
            style={{
              flex: 1, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, alignItems: "center",
              borderColor: language === "en" ? colors.primary + "80" : colors.border,
              backgroundColor: language === "en" ? colors.primaryLight : colors.surfaceSecondary,
            }}
          >
            <Text style={{ color: language === "en" ? colors.primary : colors.text, fontWeight: "800" }}>
              {t(language, "english")}
            </Text>
          </Pressable>
        </View>
        <Text style={[{ marginTop: 10, color: colors.textMuted, fontSize: 12 }, isRtl && { textAlign: "right" }]}>
          {t(language, "restart_required")}
        </Text>
      </View>

      {/* Session */}
      <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md }}>
        <Text style={[{ color: colors.text, fontWeight: "800", marginBottom: 10 }, isRtl && { textAlign: "right" }]}>
          {tStr(language, "الجلسة", "Session")}
        </Text>

        <Pressable
          onPress={() => void signOut()}
          style={{
            borderRadius: radius.md, paddingVertical: 12, alignItems: "center",
            backgroundColor: colors.errorLight, borderWidth: 1, borderColor: colors.error + "30",
          }}
        >
          <Text style={{ color: colors.error, fontWeight: "800" }}>{t(language, "logout")}</Text>
        </Pressable>

        <Pressable
          onPress={() => void signOutAll()}
          style={{
            marginTop: 10, borderRadius: radius.md, paddingVertical: 12, alignItems: "center",
            backgroundColor: colors.errorLight, borderWidth: 1, borderColor: colors.error + "20",
          }}
        >
          <Text style={{ color: colors.error, fontWeight: "800" }}>{t(language, "logout_all")}</Text>
        </Pressable>

        {message ? (
          <Text style={[{ marginTop: 10, color: colors.textSecondary, fontSize: 12 }, isRtl && { textAlign: "right" }]}>
            {message}
          </Text>
        ) : null}
      </View>

      {/* Diagnostics */}
      <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md }}>
        <Text style={[{ color: colors.text, fontWeight: "800", marginBottom: 10 }, isRtl && { textAlign: "right" }]}>
          {tStr(language, "تشخيص التشغيل", "Runtime diagnostics")}
        </Text>

        {diagnostics.map((item) => (
          <View
            key={item.label}
            style={[{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight }, isRtl && { alignItems: "flex-end" }]}
          >
            <Text style={[{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }, isRtl && { textAlign: "right" }]}>
              {item.label}
            </Text>
            <Text
              style={[
                { color: colors.text, fontWeight: "700" },
                isRtl && { textAlign: "right" },
                item.isWarning && { color: colors.warning },
              ]}
            >
              {item.value}
            </Text>
          </View>
        ))}

        {apiInfo.isLocalFallback ? (
          <Text style={[{ marginTop: 12, borderRadius: radius.md, padding: 12, backgroundColor: colors.warningLight, color: colors.warning, lineHeight: 20 }, isRtl && { textAlign: "right" }]}>
            {tStr(
              language,
              "هذا البناء ما زال يعتمد على localhost كاحتياط. اضبط EXPO_PUBLIC_API_BASE_URL قبل مشاركة التطبيق خارج جهاز التطوير.",
              "This build is still using localhost as a fallback. Set EXPO_PUBLIC_API_BASE_URL before sharing the app outside the dev machine.",
            )}
          </Text>
        ) : (
          <Text style={[{ marginTop: 12, borderRadius: radius.md, padding: 12, backgroundColor: colors.successLight, color: colors.success, lineHeight: 20 }, isRtl && { textAlign: "right" }]}>
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
