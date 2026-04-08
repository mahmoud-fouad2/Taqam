import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Constants from "expo-constants";

import { useAuth } from "@/components/auth-provider";
import { useAppSettings } from "@/components/app-settings-provider";
import { BrandLogo } from "@/components/brand-logo";
import { humanizeApiError } from "@/lib/i18n";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

function roleName(role: string, lang: "ar" | "en"): string {
  const map: Record<string, { ar: string; en: string }> = {
    TENANT_ADMIN: { ar: "مدير الشركة",         en: "Company Admin" },
    HR_MANAGER:   { ar: "مدير موارد بشرية",    en: "HR Manager" },
    MANAGER:      { ar: "مدير",                en: "Manager" },
    EMPLOYEE:     { ar: "موظف",               en: "Employee" },
    SUPER_ADMIN:  { ar: "مدير المنصة",         en: "Platform Admin" },
  };
  return map[role]?.[lang] ?? role;
}

export default function ProfileScreen() {
  const { user, signOut, accessToken, authFetch } = useAuth();
  const { language, setLanguage } = useAppSettings();
  const isRtl = language === "ar";

  const [msg, setMsg]             = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const doSignOut = async () => {
    setSigningOut(true);
    setMsg(null);
    try {
      await signOut();
    } catch (e: any) {
      setMsg(humanizeApiError(language, e?.message ?? ""));
      setSigningOut(false);
    }
  };

  const doSignOutAll = async () => {
    setMsg(null);
    try {
      if (accessToken) {
        await authFetch("/api/mobile/auth/logout-all", { method: "POST" });
      }
      await signOut();
    } catch (e: any) {
      setMsg(humanizeApiError(language, e?.message ?? ""));
    }
  };

  const confirmSignOut = () => {
    Alert.alert(
      isRtl ? "تسجيل الخروج" : "Sign out",
      isRtl ? "هل أنت متأكد من تسجيل الخروج؟" : "Are you sure you want to sign out?",
      [
        { text: isRtl ? "إلغاء" : "Cancel", style: "cancel" },
        { text: isRtl ? "خروج" : "Sign out", style: "destructive", onPress: () => void doSignOut() },
      ],
    );
  };

  const tenantName = (user as any)?.tenant?.nameAr || (user as any)?.tenant?.name;

  const infoRows = [
    { icon: "✉️", labelAr: "البريد",       labelEn: "Email",         value: user?.email },
    { icon: "🏷️", labelAr: "الدور",        labelEn: "Role",          value: user?.role ? roleName(user.role, language) : null },
    { icon: "🏢", labelAr: "الشركة",       labelEn: "Company",       value: tenantName ?? null },
  ].filter((r) => !!r.value);

  const initials = user
    ? `${(user.firstName[0] ?? "").toUpperCase()}${(user.lastName[0] ?? "").toUpperCase()}`
    : "?";

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar + name */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.fullName} numberOfLines={1}>
          {user ? `${user.firstName} ${user.lastName}` : "—"}
        </Text>
        {tenantName ? (
          <Text style={styles.tenantName}>{tenantName}</Text>
        ) : null}
      </View>

      {/* Profile info */}
      {infoRows.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRtl && styles.rtlText]}>
            {isRtl ? "معلومات الحساب" : "Account info"}
          </Text>
          {infoRows.map((row, i) => (
            <View key={i} style={[styles.infoRow, isRtl && { flexDirection: "row-reverse" }]}>
              <Text style={styles.infoIcon}>{row.icon}</Text>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, isRtl && styles.rtlText]}>
                  {isRtl ? row.labelAr : row.labelEn}
                </Text>
                <Text style={[styles.infoValue, isRtl && styles.rtlText]}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Language */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isRtl && styles.rtlText]}>
          {isRtl ? "اللغة" : "Language"}
        </Text>
        <View style={[styles.langRow, isRtl && { flexDirection: "row-reverse" }]}>
          {([{ code: "ar", label: "🇸🇦 العربية" }, { code: "en", label: "🇬🇧 English" }] as const).map((lng) => (
            <Pressable
              key={lng.code}
              onPress={() => void setLanguage(lng.code)}
              style={[styles.langBtn, language === lng.code && styles.langBtnActive]}
            >
              <Text style={[styles.langBtnText, language === lng.code && styles.langBtnTextActive]}>
                {lng.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.restartHint, isRtl && styles.rtlText]}>
          {isRtl
            ? "سيُعاد تحميل التطبيق لتطبيق اتجاه الكتابة."
            : "The app will reload to apply text direction."}
        </Text>
      </View>

      {/* Sign out */}
      <View style={styles.section}>
        {msg ? (
          <View style={styles.msgBox}>
            <Text style={[styles.msgText, isRtl && styles.rtlText]}>{msg}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={confirmSignOut}
          disabled={signingOut}
          style={({ pressed }) => [styles.signOutBtn, (signingOut || pressed) && { opacity: 0.75 }]}
        >
          <Text style={styles.signOutText}>
            {isRtl ? "تسجيل الخروج" : "Sign out"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => void doSignOutAll()}
          style={({ pressed }) => [styles.signOutAllBtn, pressed && { opacity: 0.75 }]}
        >
          <Text style={styles.signOutAllText}>
            {isRtl ? "تسجيل الخروج من كل الأجهزة" : "Sign out from all devices"}
          </Text>
        </Pressable>
      </View>

      {/* App info */}
      <View style={styles.appInfo}>
        <BrandLogo style={{ alignItems: "center", marginBottom: 8 }} variant="light" />
        <Text style={styles.appVer}>Taqam v{APP_VERSION}</Text>
        <Text style={styles.appCopy}>© 2025 Taqam. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { paddingBottom: 50 },
  rtlText: { textAlign: "right" },

  avatarSection: {
    alignItems: "center",
    paddingTop: 30,
    paddingBottom: 22,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(59,130,246,0.10)",
    borderWidth: 3,
    borderColor: "rgba(59,130,246,0.30)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarText: {
    color: "#3b82f6",
    fontSize: 28,
    fontWeight: "900",
  },
  fullName: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
  },
  tenantName: {
    color: "#64748b",
    fontSize: 14,
    textAlign: "center",
  },

  section: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 12,
  },
  sectionTitle: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoIcon: { fontSize: 17, marginTop: 2 },
  infoContent: { flex: 1, gap: 2 },
  infoLabel: { color: "#94a3b8", fontSize: 12, fontWeight: "600" },
  infoValue: { color: "#0f172a", fontSize: 14, fontWeight: "600" },

  langRow: { flexDirection: "row", gap: 10 },
  langBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    alignItems: "center",
  },
  langBtnActive: {
    borderColor: "rgba(59,130,246,0.50)",
    backgroundColor: "rgba(59,130,246,0.08)",
  },
  langBtnText: { color: "#64748b", fontWeight: "700", fontSize: 13 },
  langBtnTextActive: { color: "#3b82f6" },
  restartHint: { color: "#94a3b8", fontSize: 12, lineHeight: 18 },

  msgBox: {
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.20)",
    borderRadius: 10,
    padding: 10,
  },
  msgText: { color: "#ef4444", fontSize: 13 },

  signOutBtn: {
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.20)",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  signOutText: { color: "#ef4444", fontWeight: "800", fontSize: 15 },

  signOutAllBtn: {
    backgroundColor: "rgba(239,68,68,0.04)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.10)",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  signOutAllText: { color: "rgba(239,68,68,0.60)", fontWeight: "700", fontSize: 13 },

  appInfo: {
    alignItems: "center",
    paddingVertical: 20,
  },
  appVer: { color: "#94a3b8", fontSize: 12, textAlign: "center", marginBottom: 3 },
  appCopy: { color: "#cbd5e1", fontSize: 11, textAlign: "center" },
});
