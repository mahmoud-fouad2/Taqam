import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { useAuth } from "@/components/auth-provider";
import { useAppSettings } from "@/components/app-settings-provider";
import { BrandLogo } from "@/components/brand-logo";
import { humanizeApiError, tStr } from "@/lib/i18n";
import { useTheme } from "@/theme";

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
  const { user, signOut, accessToken, authFetch, refreshUser } = useAuth();
  const { language, setLanguage } = useAppSettings();
  const { colors, isDark, spacing, radius } = useTheme();
  const isRtl = language === "ar";

  const [msg, setMsg]             = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editFirstName, setEditFirstName] = useState(user?.firstName ?? "");
  const [editLastName, setEditLastName] = useState(user?.lastName ?? "");
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refreshUser(); } catch {} finally { setRefreshing(false); }
  }, [refreshUser]);

  // --- Avatar upload ---
  const pickAvatar = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        isRtl ? "صلاحية مطلوبة" : "Permission needed",
        isRtl ? "نحتاج صلاحية الوصول للصور لاختيار صورة ملفك الشخصي" : "We need photo library access to pick your avatar",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploadingAvatar(true);
    setMsg(null);
    try {
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append("avatar", {
        uri: asset.uri,
        type: asset.mimeType ?? "image/jpeg",
        name: `avatar.${asset.mimeType?.split("/")[1] ?? "jpg"}`,
      } as any);

      await authFetch("/api/mobile/me/avatar", {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      await refreshUser();
    } catch (e: any) {
      setMsg(humanizeApiError(language, e?.message ?? ""));
    } finally {
      setUploadingAvatar(false);
    }
  }, [authFetch, language, isRtl, refreshUser]);

  // --- Edit profile ---
  const saveProfile = async () => {
    if (!editFirstName.trim() || !editLastName.trim()) return;
    setSaving(true);
    setMsg(null);
    try {
      await authFetch("/api/mobile/me", {
        method: "PUT",
        body: JSON.stringify({ firstName: editFirstName.trim(), lastName: editLastName.trim() }),
      });
      await refreshUser();
      setEditMode(false);
    } catch (e: any) {
      setMsg(humanizeApiError(language, e?.message ?? ""));
    } finally {
      setSaving(false);
    }
  };

  // --- Change password ---
  const doChangePassword = async () => {
    if (!currentPassword || !newPassword) return;
    if (newPassword !== confirmPassword) {
      setMsg(isRtl ? "كلمة المرور الجديدة غير متطابقة" : "New passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      setMsg(isRtl ? "يجب أن تكون كلمة المرور 8 أحرف على الأقل" : "Password must be at least 8 characters");
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await authFetch("/api/mobile/me/password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert(
        isRtl ? "تم!" : "Done!",
        isRtl ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully",
      );
    } catch (e: any) {
      setMsg(humanizeApiError(language, e?.message ?? ""));
    } finally {
      setSaving(false);
    }
  };

  // --- Sign out ---
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
  const avatarUrl = (user as any)?.avatar;

  const infoRows = [
    { icon: "envelope" as const, labelAr: "البريد",       labelEn: "Email",         value: user?.email },
    { icon: "id-badge" as const, labelAr: "الدور",        labelEn: "Role",          value: user?.role ? roleName(user.role, language) : null },
    { icon: "building" as const, labelAr: "الشركة",       labelEn: "Company",       value: tenantName ?? null },
  ].filter((r) => !!r.value);

  const initials = user
    ? `${(user.firstName[0] ?? "").toUpperCase()}${(user.lastName[0] ?? "").toUpperCase()}`
    : "?";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 50 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
    >
      {/* Avatar + name */}
      <View style={{ alignItems: "center", paddingTop: 30, paddingBottom: 22 }}>
        <Pressable onPress={pickAvatar} disabled={uploadingAvatar}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: colors.primaryLight,
              borderWidth: 3,
              borderColor: colors.primary + "50",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            {uploadingAvatar ? (
              <ActivityIndicator color={colors.primary} />
            ) : avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={{ width: 90, height: 90, borderRadius: 45 }} />
            ) : (
              <Text style={{ color: colors.primary, fontSize: 32, fontWeight: "900" }}>{initials}</Text>
            )}
          </View>
          <View
            style={{
              position: "absolute",
              bottom: 12,
              right: 0,
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: colors.surface,
            }}
          >
            <FontAwesome name="camera" size={13} color="#fff" />
          </View>
        </Pressable>

        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800", textAlign: "center", marginBottom: 4 }} numberOfLines={1}>
          {user ? `${user.firstName} ${user.lastName}` : "—"}
        </Text>
        {tenantName ? (
          <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center" }}>{tenantName}</Text>
        ) : null}
      </View>

      {/* Edit Profile / Info */}
      <View style={{ marginHorizontal: spacing.md, marginBottom: 14, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
        <View style={[{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }, isRtl && { flexDirection: "row-reverse" }]}>
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 }}>
            {isRtl ? "معلومات الحساب" : "Account info"}
          </Text>
          {!editMode && (
            <Pressable
              onPress={() => { setEditMode(true); setEditFirstName(user?.firstName ?? ""); setEditLastName(user?.lastName ?? ""); }}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <FontAwesome name="pencil" size={12} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>
                {isRtl ? "تعديل" : "Edit"}
              </Text>
            </Pressable>
          )}
        </View>

        {editMode ? (
          <View style={{ gap: 10 }}>
            <TextInput
              value={editFirstName}
              onChangeText={setEditFirstName}
              placeholder={isRtl ? "الاسم الأول" : "First name"}
              placeholderTextColor={colors.textMuted}
              style={{
                borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
                padding: 12, color: colors.text, backgroundColor: colors.surfaceSecondary,
                textAlign: isRtl ? "right" : "left",
              }}
            />
            <TextInput
              value={editLastName}
              onChangeText={setEditLastName}
              placeholder={isRtl ? "اسم العائلة" : "Last name"}
              placeholderTextColor={colors.textMuted}
              style={{
                borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
                padding: 12, color: colors.text, backgroundColor: colors.surfaceSecondary,
                textAlign: isRtl ? "right" : "left",
              }}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={saveProfile}
                disabled={saving}
                style={{
                  flex: 1, backgroundColor: colors.primary, borderRadius: radius.md,
                  paddingVertical: 12, alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "800" }}>
                  {saving ? "..." : isRtl ? "حفظ" : "Save"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setEditMode(false)}
                style={{
                  flex: 1, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md,
                  paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: "700" }}>
                  {isRtl ? "إلغاء" : "Cancel"}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          infoRows.map((row, i) => (
            <View key={i} style={[{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 }, isRtl && { flexDirection: "row-reverse" }]}>
              <FontAwesome name={row.icon} size={16} color={colors.textMuted} style={{ marginTop: 2 }} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[{ color: colors.textMuted, fontSize: 12, fontWeight: "600" }, isRtl && { textAlign: "right" }]}>
                  {isRtl ? row.labelAr : row.labelEn}
                </Text>
                <Text style={[{ color: colors.text, fontSize: 14, fontWeight: "600" }, isRtl && { textAlign: "right" }]}>{row.value}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Change Password */}
      <View style={{ marginHorizontal: spacing.md, marginBottom: 14, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
        <Pressable
          onPress={() => setChangingPassword(!changingPassword)}
          style={[{ flexDirection: "row", alignItems: "center", gap: 10 }, isRtl && { flexDirection: "row-reverse" }]}
        >
          <FontAwesome name="lock" size={16} color={colors.primary} />
          <Text style={{ color: colors.text, fontWeight: "700", flex: 1, textAlign: isRtl ? "right" : "left" }}>
            {isRtl ? "تغيير كلمة المرور" : "Change password"}
          </Text>
          <FontAwesome name={changingPassword ? "chevron-up" : "chevron-down"} size={12} color={colors.textMuted} />
        </Pressable>

        {changingPassword && (
          <View style={{ marginTop: 14, gap: 10 }}>
            <TextInput
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder={isRtl ? "كلمة المرور الحالية" : "Current password"}
              placeholderTextColor={colors.textMuted}
              style={{
                borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
                padding: 12, color: colors.text, backgroundColor: colors.surfaceSecondary,
                textAlign: isRtl ? "right" : "left",
              }}
            />
            <TextInput
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={isRtl ? "كلمة المرور الجديدة" : "New password"}
              placeholderTextColor={colors.textMuted}
              style={{
                borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
                padding: 12, color: colors.text, backgroundColor: colors.surfaceSecondary,
                textAlign: isRtl ? "right" : "left",
              }}
            />
            <TextInput
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={isRtl ? "تأكيد كلمة المرور" : "Confirm password"}
              placeholderTextColor={colors.textMuted}
              style={{
                borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
                padding: 12, color: colors.text, backgroundColor: colors.surfaceSecondary,
                textAlign: isRtl ? "right" : "left",
              }}
            />
            <Pressable
              onPress={doChangePassword}
              disabled={saving}
              style={{
                backgroundColor: colors.primary, borderRadius: radius.md,
                paddingVertical: 12, alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>
                {saving ? "..." : isRtl ? "تغيير" : "Change"}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Language */}
      <View style={{ marginHorizontal: spacing.md, marginBottom: 14, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 12 }}>
        <Text style={[{ color: colors.textMuted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 }, isRtl && { textAlign: "right" }]}>
          {isRtl ? "اللغة" : "Language"}
        </Text>
        <View style={[{ flexDirection: "row", gap: 10 }, isRtl && { flexDirection: "row-reverse" }]}>
          {([{ code: "ar", label: "🇸🇦 العربية" }, { code: "en", label: "🇬🇧 English" }] as const).map((lng) => (
            <Pressable
              key={lng.code}
              onPress={() => void setLanguage(lng.code)}
              style={{
                flex: 1, paddingVertical: 11, borderRadius: radius.md, borderWidth: 1, alignItems: "center",
                borderColor: language === lng.code ? colors.primary + "80" : colors.border,
                backgroundColor: language === lng.code ? colors.primaryLight : colors.surfaceSecondary,
              }}
            >
              <Text style={{ color: language === lng.code ? colors.primary : colors.textSecondary, fontWeight: "700", fontSize: 13 }}>
                {lng.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Sign out */}
      <View style={{ marginHorizontal: spacing.md, marginBottom: 14, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 12 }}>
        {msg ? (
          <View style={{ backgroundColor: colors.errorLight, borderWidth: 1, borderColor: colors.error + "30", borderRadius: radius.md, padding: 10 }}>
            <Text style={[{ color: colors.error, fontSize: 13 }, isRtl && { textAlign: "right" }]}>{msg}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={confirmSignOut}
          disabled={signingOut}
          style={({ pressed }) => ({
            backgroundColor: colors.errorLight,
            borderWidth: 1, borderColor: colors.error + "30", borderRadius: radius.md,
            paddingVertical: 14, alignItems: "center",
            opacity: signingOut || pressed ? 0.75 : 1,
          })}
        >
          <Text style={{ color: colors.error, fontWeight: "800", fontSize: 15 }}>
            {isRtl ? "تسجيل الخروج" : "Sign out"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => void doSignOutAll()}
          style={({ pressed }) => ({
            backgroundColor: colors.errorLight,
            borderWidth: 1, borderColor: colors.error + "15", borderRadius: radius.md,
            paddingVertical: 12, alignItems: "center",
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <Text style={{ color: colors.error + "99", fontWeight: "700", fontSize: 13 }}>
            {isRtl ? "تسجيل الخروج من كل الأجهزة" : "Sign out from all devices"}
          </Text>
        </Pressable>
      </View>

      {/* App info */}
      <View style={{ alignItems: "center", paddingVertical: 20 }}>
        <BrandLogo style={{ alignItems: "center", marginBottom: 8 }} variant={isDark ? "dark" : "light"} />
        <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: "center", marginBottom: 3 }}>Taqam v{APP_VERSION}</Text>
        <Text style={{ color: colors.border, fontSize: 11, textAlign: "center" }}>© 2025 Taqam. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}
