import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import * as Location from "expo-location";
import * as LocalAuthentication from "expo-local-authentication";

import { useAuth } from "@/components/auth-provider";
import { useAppSettings } from "@/components/app-settings-provider";
import { humanizeApiError, t, tStr } from "@/lib/i18n";
import { useTheme } from "@/theme";
import { Skeleton, SkeletonCard } from "@/components/ui";

const BRAND = "#3b82f6";

type LastResult = {
  ok: boolean;
  message: string;
};

type TodayStatus = {
  status: "NONE" | "CHECKED_IN" | "CHECKED_OUT";
  canCheckIn: boolean;
  canCheckOut: boolean;
  record: {
    id: string;
    date: string;
    checkInTime: string | null;
    checkOutTime: string | null;
  } | null;
};

type DashboardData = {
  leaves: {
    pendingCount: number;
    balances: Array<{ typeName: string; color: string | null; entitled: number; remaining: number }>;
  };
  approvals: { pendingCount: number };
} | null;

type LocationReadiness = {
  servicesEnabled: boolean;
  permissionGranted: boolean;
  accuracyMeters: number | null;
  capturedAt: string | null;
};

export default function AttendanceScreen() {
  const { accessToken, user, authFetch } = useAuth();
  const { language, biometricsEnabled } = useAppSettings();
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<LastResult | null>(null);
  const [today, setToday] = useState<TodayStatus | null>(null);
  const [loadingToday, setLoadingToday] = useState(false);
  const [locationIssue, setLocationIssue] = useState<"PERMISSION" | "SERVICES" | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData>(null);
  const [locationReadiness, setLocationReadiness] = useState<LocationReadiness | null>(null);

  const header = useMemo(() => {
    const name = user ? `${user.firstName} ${user.lastName}` : "";
    return name ? `${t(language, "greeting")} ${name}` : t(language, "attendance_title");
  }, [user, language]);

  const loadToday = useCallback(async () => {
    if (!accessToken) {
      setToday(null);
      return;
    }
    setLoadingToday(true);
    setLocationIssue(null);
    try {
      const [todayRes, dashRes] = await Promise.all([
        authFetch<{ data: TodayStatus }>("/api/mobile/attendance/today"),
        authFetch<{ data: DashboardData }>("/api/mobile/dashboard").catch(() => null),
      ]);
      setToday(todayRes.data);
      if (dashRes?.data) setDashboard(dashRes.data);
    } catch (e: any) {
      setLast({ ok: false, message: humanizeApiError(language, e?.message || "") });
    } finally {
      setLoadingToday(false);
    }
  }, [accessToken, authFetch, language]);

  const loadLocationReadiness = useCallback(async () => {
    try {
      const [servicesEnabled, permission] = await Promise.all([
        Location.hasServicesEnabledAsync(),
        Location.getForegroundPermissionsAsync(),
      ]);

      setLocationReadiness((current) => ({
        servicesEnabled,
        permissionGranted: permission.status === "granted",
        accuracyMeters: current?.accuracyMeters ?? null,
        capturedAt: current?.capturedAt ?? null,
      }));
    } catch {
      setLocationReadiness((current) =>
        current ?? {
          servicesEnabled: false,
          permissionGranted: false,
          accuracyMeters: null,
          capturedAt: null,
        }
      );
    }
  }, []);

  useEffect(() => {
    void loadToday();
    void loadLocationReadiness();
  }, [loadLocationReadiness, loadToday]);

  const doAttendance = async (type: "check-in" | "check-out") => {
    if (!accessToken) {
      setLast({ ok: false, message: humanizeApiError(language, "Unauthorized") });
      return;
    }

    setBusy(true);
    setLast(null);
    setLocationIssue(null);

    try {
      if (biometricsEnabled) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (hasHardware && isEnrolled) {
          const res = await LocalAuthentication.authenticateAsync({
            promptMessage: type === "check-in" ? t(language, "biometric_prompt_checkin") : t(language, "biometric_prompt_checkout"),
            cancelLabel: t(language, "cancel"),
            disableDeviceFallback: false,
          });
          if (!res.success) {
            throw new Error(t(language, "biometric_failed"));
          }
        }
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setLocationIssue("SERVICES");
        setLocationReadiness((current) => ({
          servicesEnabled: false,
          permissionGranted: current?.permissionGranted ?? false,
          accuracyMeters: current?.accuracyMeters ?? null,
          capturedAt: current?.capturedAt ?? null,
        }));
        throw new Error("Location services are off");
      }

      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        setLocationIssue("PERMISSION");
        setLocationReadiness((current) => ({
          servicesEnabled: true,
          permissionGranted: false,
          accuracyMeters: current?.accuracyMeters ?? null,
          capturedAt: current?.capturedAt ?? null,
        }));
        throw new Error("Location permission is required");
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocationReadiness({
        servicesEnabled: true,
        permissionGranted: true,
        accuracyMeters: pos.coords.accuracy ?? null,
        capturedAt: new Date().toISOString(),
      });

      const challenge = await authFetch<{ data: { nonce: string } }>("/api/mobile/auth/challenge", { method: "POST" });

      const nonce = challenge?.data?.nonce;
      if (!nonce) throw new Error(t(language, "challenge_failed"));

      await authFetch("/api/mobile/attendance", {
        method: "POST",
        headers: {
          "x-mobile-challenge": nonce,
        },
        body: JSON.stringify({
          type,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? undefined,
        }),
      });

      setLast({ ok: true, message: type === "check-in" ? t(language, "checked_in_msg") : t(language, "checked_out_msg") });
      await loadToday();
    } catch (e: any) {
      setLast({ ok: false, message: humanizeApiError(language, e?.message || "") });
    } finally {
      setBusy(false);
    }
  };

  const statusText = useMemo(() => {
    if (!today) return loadingToday ? t(language, "loading") : "";
    if (today.status === "NONE") return t(language, "status_none");
    if (today.status === "CHECKED_IN") return t(language, "status_checked_in");
    return t(language, "status_checked_out");
  }, [today, loadingToday, language]);

  const canCheckIn = !!accessToken && !busy && (today?.canCheckIn ?? true);
  const canCheckOut = !!accessToken && !busy && (today?.canCheckOut ?? true);
  const locationReady = Boolean(
    locationReadiness?.servicesEnabled && locationReadiness?.permissionGranted
  );

  const fmt = (iso: string | null | undefined) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleTimeString();
    } catch {
      return iso;
    }
  };

  const fmtAccuracy = (value: number | null | undefined) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "—";
    return `${Math.round(value)}m`;
  };

  const locationStatusText = locationReady
    ? tStr(language, "الموقع جاهز للتوثيق", "Location ready for verification")
    : tStr(language, "الموقع يحتاج تفعيل قبل الحضور", "Location needs attention before attendance");

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={loadingToday}
          onRefresh={() => void loadToday()}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{header}</Text>
        <Text style={[styles.todayDate, { color: colors.textSecondary }] }>
          {new Date().toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </Text>
      </View>

      {/* Status card */}
      <View style={[
        styles.statusCard,
        {
          backgroundColor:
            today?.status === "CHECKED_IN"
              ? colors.successLight
              : today?.status === "CHECKED_OUT"
                ? colors.primaryLight
                : colors.surface,
          borderColor:
            today?.status === "CHECKED_IN"
              ? colors.success
              : today?.status === "CHECKED_OUT"
                ? colors.primary
                : colors.border,
        },
      ]}>
        <View style={styles.statusRow}>
          <View style={[
            styles.statusDot,
            {
              backgroundColor:
                today?.status === "CHECKED_IN"
                  ? colors.success
                  : today?.status === "CHECKED_OUT"
                    ? colors.primary
                    : colors.textMuted,
            },
          ]} />
          <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>{t(language, "today")}</Text>
          <Pressable
            onPress={() => void loadToday()}
            disabled={loadingToday || busy}
            style={[
              styles.refreshBtn,
              { borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
              (loadingToday || busy) && { opacity: 0.5 }
            ]}
          >
            {loadingToday
              ? <ActivityIndicator color={colors.primary} size="small" />
              : <Text style={[styles.refreshText, { color: colors.text }]}>{t(language, "refresh")}</Text>}
          </Pressable>
        </View>
        <Text style={[styles.statusValue, { color: colors.text }]}>{statusText}</Text>
        <View style={styles.timesRow}>
          <View style={styles.timeBlock}>
            <Text style={[styles.timeLabel, { color: colors.textMuted }]}>{t(language, "last_check_in")}</Text>
            <Text style={[styles.timeValue, { color: colors.text }]}>{fmt(today?.record?.checkInTime)}</Text>
          </View>
          <View style={[styles.timeDivider, { backgroundColor: colors.border }]} />
          <View style={styles.timeBlock}>
            <Text style={[styles.timeLabel, { color: colors.textMuted }]}>{t(language, "last_check_out")}</Text>
            <Text style={[styles.timeValue, { color: colors.text }]}>{fmt(today?.record?.checkOutTime)}</Text>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.locationCard,
          locationReady
            ? { backgroundColor: colors.successLight, borderColor: colors.success }
            : { backgroundColor: colors.warningLight, borderColor: colors.warning }
        ]}>
        <View style={styles.locationHeaderRow}>
          <View>
            <Text style={[styles.locationTitle, { color: colors.text }]}>{tStr(language, "حالة التحقق بالموقع", "Location verification")}</Text>
            <Text style={[styles.locationSubtitle, { color: colors.textSecondary }]}>{locationStatusText}</Text>
          </View>
          <View
            style={[
              styles.locationBadge,
              locationReady
                ? { backgroundColor: colors.surface, borderColor: colors.success }
                : { backgroundColor: colors.surface, borderColor: colors.warning }
            ]}>
            <Text
              style={[
                styles.locationBadgeText,
                { color: locationReady ? colors.success : colors.warning }
              ]}>
              {locationReady ? tStr(language, "جاهز", "Ready") : tStr(language, "تحقق مطلوب", "Needs action")}
            </Text>
          </View>
        </View>

        <View style={styles.locationStatsRow}>
          <View style={[styles.locationStatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.locationStatLabel, { color: colors.textSecondary }]}>{tStr(language, "الخدمات", "Services")}</Text>
            <Text style={[styles.locationStatValue, { color: colors.text }]}>
              {locationReadiness?.servicesEnabled
                ? tStr(language, "مفعلة", "Enabled")
                : tStr(language, "متوقفة", "Off")}
            </Text>
          </View>
          <View style={[styles.locationStatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.locationStatLabel, { color: colors.textSecondary }]}>{tStr(language, "الصلاحية", "Permission")}</Text>
            <Text style={[styles.locationStatValue, { color: colors.text }]}>
              {locationReadiness?.permissionGranted
                ? tStr(language, "مسموح", "Granted")
                : tStr(language, "غير مسموح", "Not granted")}
            </Text>
          </View>
          <View style={[styles.locationStatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.locationStatLabel, { color: colors.textSecondary }]}>{tStr(language, "الدقة", "Accuracy")}</Text>
            <Text style={[styles.locationStatValue, { color: colors.text }]}>{fmtAccuracy(locationReadiness?.accuracyMeters)}</Text>
          </View>
        </View>

        <Text style={[styles.locationMeta, { color: colors.textSecondary }]}>
          {locationReadiness?.capturedAt
            ? `${tStr(language, "آخر تحقق", "Last verified")} ${fmt(locationReadiness.capturedAt)}`
            : tStr(language, "سيتم تسجيل آخر دقة موقع بعد أول حضور أو انصراف ناجح.", "Latest verified accuracy will appear after the next successful check-in or check-out.")}
        </Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable
          onPress={() => void doAttendance("check-in")}
          disabled={!canCheckIn}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.success, shadowColor: colors.success },
            !canCheckIn && styles.buttonDisabled,
            pressed && canCheckIn && { opacity: 0.88, transform: [{ scale: 0.98 }] },
          ]}
        >
          {busy ? <ActivityIndicator color={colors.text} /> : <Text style={styles.buttonText}>{t(language, "check_in")}</Text>}
        </Pressable>

        <Pressable
          onPress={() => void doAttendance("check-out")}
          disabled={!canCheckOut}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, borderWidth: 1 },
            !canCheckOut && styles.buttonDisabled,
            pressed && canCheckOut && { opacity: 0.88, transform: [{ scale: 0.98 }] },
          ]}
        >
          {busy ? <ActivityIndicator color={colors.text} /> : <Text style={[styles.buttonText, styles.buttonTextAlt, { color: colors.text }]}>{t(language, "check_out")}</Text>}
        </Pressable>
      </View>

      {/* Last result */}
      {last ? (
        <View
          style={[
            styles.alert,
            last.ok
              ? { backgroundColor: colors.successLight, borderColor: colors.success }
              : { backgroundColor: colors.errorLight, borderColor: colors.error }
          ]}>
          <Text style={[styles.alertText, { color: colors.text }]}>{last.message}</Text>
          {!last.ok && (locationIssue === "PERMISSION" || locationIssue === "SERVICES") ? (
            <View style={styles.alertActions}>
              <Pressable
                onPress={() => void Linking.openSettings()}
                style={[styles.smallBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                <Text style={[styles.smallBtnText, { color: colors.primary }]}>{t(language, "open_settings")}</Text>
              </Pressable>
              <Pressable
                onPress={() => void loadToday()}
                style={[styles.smallBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                <Text style={[styles.smallBtnText, { color: colors.primary }]}>{t(language, "try_again")}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Dashboard Summary */}
      {loadingToday && !dashboard && (
        <View style={styles.dashSection}>
          <SkeletonCard style={{ height: 100, marginBottom: 10 }} />
          <SkeletonCard style={{ height: 60 }} />
        </View>
      )}
      {dashboard && (
        <View style={styles.dashSection}>
          {/* Leave balances */}
          {dashboard.leaves.balances.length > 0 && (
            <View style={[styles.dashCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.dashTitle, { color: colors.textMuted }] }>
                {tStr(language, "رصيد الإجازات", "Leave Balances")}
              </Text>
              <View style={styles.dashBalGrid}>
                {dashboard.leaves.balances.map((b, i) => (
                  <View key={i} style={styles.dashBalItem}>
                    <View style={[styles.dashBalDot, { backgroundColor: b.color || colors.primary }]} />
                    <Text style={[styles.dashBalLabel, { color: colors.textSecondary }]} numberOfLines={1}>{b.typeName}</Text>
                    <Text style={[styles.dashBalNum, { color: colors.text }]}>{b.remaining}<Text style={[styles.dashBalTotal, { color: colors.textMuted }]}>/{b.entitled}</Text></Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Quick stats row */}
          <View style={styles.dashStatsRow}>
            {dashboard.leaves.pendingCount > 0 && (
              <View style={[styles.dashStat, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: colors.warning, borderLeftWidth: 3 }]}>
                <Text style={[styles.dashStatNum, { color: colors.text }]}>{dashboard.leaves.pendingCount}</Text>
                <Text style={[styles.dashStatLabel, { color: colors.textSecondary }]}>
                  {tStr(language, "طلبات معلقة", "Pending")}
                </Text>
              </View>
            )}
            {dashboard.approvals.pendingCount > 0 && (
              <View style={[styles.dashStat, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: colors.error, borderLeftWidth: 3 }]}>
                <Text style={[styles.dashStatNum, { color: colors.text }]}>{dashboard.approvals.pendingCount}</Text>
                <Text style={[styles.dashStatLabel, { color: colors.textSecondary }]}>
                  {tStr(language, "بانتظار موافقتك", "Need approval")}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Note */}
      <View style={[styles.note, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
        <Text style={[styles.noteText, { color: colors.textSecondary }]}>
          {t(language, "geofence_note")}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginTop: 8,
    marginBottom: 16,
  },
  title: {
    color: "#0f172a",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  todayDate: {
    color: "#64748b",
    fontSize: 13,
  },
  statusCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statusCardGreen: {
    borderColor: "rgba(34,197,94,0.35)",
    backgroundColor: "rgba(34,197,94,0.06)",
  },
  statusCardBlue: {
    borderColor: "rgba(59,130,246,0.35)",
    backgroundColor: "rgba(59,130,246,0.06)",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotGreen: { backgroundColor: "#22c55e" },
  dotBlue:  { backgroundColor: BRAND },
  dotGray:  { backgroundColor: "#cbd5e1" },
  statusLabel: {
    color: "#64748b",
    fontWeight: "700",
    flex: 1,
  },
  refreshBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f1f5f9",
  },
  refreshText: { color: "#0f172a", fontWeight: "700", fontSize: 12 },
  statusValue: {
    color: "#0f172a",
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 14,
  },
  locationCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  locationCardReady: {
    backgroundColor: "rgba(34,197,94,0.06)",
    borderColor: "rgba(34,197,94,0.22)",
  },
  locationCardNeedsAttention: {
    backgroundColor: "rgba(245,158,11,0.08)",
    borderColor: "rgba(245,158,11,0.22)",
  },
  locationHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  locationTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  locationSubtitle: {
    color: "#64748b",
    fontSize: 12,
  },
  locationBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  locationBadgeReady: {
    backgroundColor: "rgba(34,197,94,0.10)",
    borderColor: "rgba(34,197,94,0.20)",
  },
  locationBadgeWarn: {
    backgroundColor: "rgba(245,158,11,0.10)",
    borderColor: "rgba(245,158,11,0.20)",
  },
  locationBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  locationBadgeTextReady: {
    color: "#15803d",
  },
  locationBadgeTextWarn: {
    color: "#b45309",
  },
  locationStatsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  locationStatCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.9)",
  },
  locationStatLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
  },
  locationStatValue: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "900",
  },
  locationMeta: {
    color: "#475569",
    fontSize: 12,
    lineHeight: 18,
  },
  timesRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeBlock: { flex: 1 },
  timeDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 12,
  },
  timeLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 3,
  },
  timeValue: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "800",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  button: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  checkIn: {
    backgroundColor: "#22c55e",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  checkOut: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  buttonDisabled: {
    opacity: 0.38,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 15,
  },
  buttonTextAlt: {
    color: "#0f172a",
  },
  alert: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  alertOk: {
    backgroundColor: "rgba(34,197,94,0.10)",
    borderColor: "rgba(34,197,94,0.30)",
  },
  alertErr: {
    backgroundColor: "rgba(239,68,68,0.10)",
    borderColor: "rgba(239,68,68,0.30)",
  },
  alertText: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 14,
  },
  alertActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  smallBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  smallBtnPrimary: {
    backgroundColor: "rgba(59,130,246,0.12)",
    borderColor: "rgba(59,130,246,0.30)",
  },
  smallBtnSecondary: {
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
  },
  smallBtnText: { color: BRAND, fontWeight: "700", fontSize: 12 },
  note: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(59,130,246,0.06)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.15)",
  },
  noteText: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 18,
  },

  // Dashboard summary
  dashSection: { gap: 10, marginBottom: 14 },
  dashCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  dashTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  dashBalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  dashBalItem: { alignItems: "center", minWidth: 70 },
  dashBalDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND, marginBottom: 4 },
  dashBalLabel: { fontSize: 11, color: "#64748b", fontWeight: "600", marginBottom: 2 },
  dashBalNum: { fontSize: 18, fontWeight: "900", color: "#0f172a" },
  dashBalTotal: { fontSize: 12, fontWeight: "600", color: "#94a3b8" },
  dashStatsRow: { flexDirection: "row", gap: 10 },
  dashStat: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  dashStatNum: { fontSize: 22, fontWeight: "900", color: "#0f172a", marginBottom: 2 },
  dashStatLabel: { fontSize: 12, color: "#64748b", fontWeight: "600" },
});
