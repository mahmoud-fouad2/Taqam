import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import * as Location from "expo-location";
import * as LocalAuthentication from "expo-local-authentication";

import { useAuth } from "@/components/auth-provider";
import { useAppSettings } from "@/components/app-settings-provider";
import { humanizeApiError, t } from "@/lib/i18n";

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

export default function AttendanceScreen() {
  const { accessToken, user, authFetch } = useAuth();
  const { language, biometricsEnabled } = useAppSettings();
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<LastResult | null>(null);
  const [today, setToday] = useState<TodayStatus | null>(null);
  const [loadingToday, setLoadingToday] = useState(false);
  const [locationIssue, setLocationIssue] = useState<"PERMISSION" | "SERVICES" | null>(null);

  const header = useMemo(() => {
    const name = user ? `${user.firstName} ${user.lastName}` : "";
    return name ? `مرحبًا ${name}` : "الحضور";
  }, [user]);

  const loadToday = useCallback(async () => {
    if (!accessToken) {
      setToday(null);
      return;
    }
    setLoadingToday(true);
    setLocationIssue(null);
    try {
      const res = await authFetch<{ data: TodayStatus }>("/api/mobile/attendance/today");
      setToday(res.data);
    } catch (e: any) {
      setLast({ ok: false, message: humanizeApiError(language, e?.message || "") });
    } finally {
      setLoadingToday(false);
    }
  }, [accessToken, authFetch, language]);

  useEffect(() => {
    void loadToday();
  }, [loadToday]);

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
            promptMessage: type === "check-in" ? (language === "ar" ? "تأكيد البصمة لتسجيل الحضور" : "Confirm biometrics to check in") : (language === "ar" ? "تأكيد البصمة لتسجيل الانصراف" : "Confirm biometrics to check out"),
            cancelLabel: "إلغاء",
            disableDeviceFallback: false,
          });
          if (!res.success) {
            throw new Error(language === "ar" ? "لم يتم تأكيد البصمة" : "Biometric verification failed");
          }
        }
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setLocationIssue("SERVICES");
        throw new Error("Location services are off");
      }

      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        setLocationIssue("PERMISSION");
        throw new Error("Location permission is required");
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

      const challenge = await authFetch<{ data: { nonce: string } }>("/api/mobile/auth/challenge", { method: "POST" });

      const nonce = challenge?.data?.nonce;
      if (!nonce) throw new Error(language === "ar" ? "فشل إنشاء التحدي" : "Failed to create challenge");

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

      setLast({ ok: true, message: type === "check-in" ? (language === "ar" ? "تم تسجيل الحضور" : "Checked in") : (language === "ar" ? "تم تسجيل الانصراف" : "Checked out") });
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

  const fmt = (iso: string | null | undefined) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleTimeString();
    } catch {
      return iso;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{header}</Text>
        <Text style={styles.todayDate}>
          {new Date().toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </Text>
      </View>

      {/* Status card */}
      <View style={[
        styles.statusCard,
        today?.status === "CHECKED_IN"  && styles.statusCardGreen,
        today?.status === "CHECKED_OUT" && styles.statusCardBlue,
      ]}>
        <View style={styles.statusRow}>
          <View style={[
            styles.statusDot,
            today?.status === "CHECKED_IN"  ? styles.dotGreen :
            today?.status === "CHECKED_OUT" ? styles.dotBlue : styles.dotGray,
          ]} />
          <Text style={styles.statusLabel}>{t(language, "today")}</Text>
          <Pressable
            onPress={() => void loadToday()}
            disabled={loadingToday || busy}
            style={[styles.refreshBtn, (loadingToday || busy) && { opacity: 0.5 }]}
          >
            {loadingToday
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.refreshText}>{t(language, "refresh")}</Text>}
          </Pressable>
        </View>
        <Text style={styles.statusValue}>{statusText}</Text>
        <View style={styles.timesRow}>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>{t(language, "last_check_in")}</Text>
            <Text style={styles.timeValue}>{fmt(today?.record?.checkInTime)}</Text>
          </View>
          <View style={styles.timeDivider} />
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>{t(language, "last_check_out")}</Text>
            <Text style={styles.timeValue}>{fmt(today?.record?.checkOutTime)}</Text>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable
          onPress={() => void doAttendance("check-in")}
          disabled={!canCheckIn}
          style={({ pressed }) => [
            styles.button,
            styles.checkIn,
            !canCheckIn && styles.buttonDisabled,
            pressed && canCheckIn && { opacity: 0.88, transform: [{ scale: 0.98 }] },
          ]}
        >
          {busy ? <ActivityIndicator color="#0b1220" /> : <Text style={styles.buttonText}>{t(language, "check_in")}</Text>}
        </Pressable>

        <Pressable
          onPress={() => void doAttendance("check-out")}
          disabled={!canCheckOut}
          style={({ pressed }) => [
            styles.button,
            styles.checkOut,
            !canCheckOut && styles.buttonDisabled,
            pressed && canCheckOut && { opacity: 0.88, transform: [{ scale: 0.98 }] },
          ]}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={[styles.buttonText, styles.buttonTextAlt]}>{t(language, "check_out")}</Text>}
        </Pressable>
      </View>

      {/* Last result */}
      {last ? (
        <View style={[styles.alert, last.ok ? styles.alertOk : styles.alertErr]}>
          <Text style={styles.alertText}>{last.message}</Text>
          {!last.ok && (locationIssue === "PERMISSION" || locationIssue === "SERVICES") ? (
            <View style={styles.alertActions}>
              <Pressable onPress={() => void Linking.openSettings()} style={[styles.smallBtn, styles.smallBtnPrimary]}>
                <Text style={styles.smallBtnText}>{t(language, "open_settings")}</Text>
              </Pressable>
              <Pressable onPress={() => void loadToday()} style={[styles.smallBtn, styles.smallBtnSecondary]}>
                <Text style={styles.smallBtnText}>{t(language, "try_again")}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Note */}
      <View style={styles.note}>
        <Text style={styles.noteText}>
          {language === "ar"
            ? "🔒 إذا كان نظام Geofence مفعلاً، التسجيل خارج مواقع العمل سيتم رفضه."
            : "🔒 If geofence is enabled, check-ins outside allowed locations will be rejected."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#0a0f1e",
  },
  header: {
    marginTop: 8,
    marginBottom: 16,
  },
  title: {
    color: "#f1f5f9",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  todayDate: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
  },
  statusCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  statusCardGreen: {
    borderColor: "rgba(34,197,94,0.25)",
    backgroundColor: "rgba(34,197,94,0.06)",
  },
  statusCardBlue: {
    borderColor: "rgba(59,130,246,0.25)",
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
  dotBlue:  { backgroundColor: "#3b82f6" },
  dotGray:  { backgroundColor: "rgba(255,255,255,0.25)" },
  statusLabel: {
    color: "rgba(255,255,255,0.65)",
    fontWeight: "700",
    flex: 1,
  },
  refreshBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  refreshText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  statusValue: {
    color: "#f1f5f9",
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 14,
  },
  timesRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeBlock: { flex: 1 },
  timeDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.10)",
    marginHorizontal: 12,
  },
  timeLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 3,
  },
  timeValue: {
    color: "#f1f5f9",
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
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  buttonDisabled: {
    opacity: 0.38,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#0b1220",
    fontWeight: "800",
    fontSize: 15,
  },
  buttonTextAlt: {
    color: "#f1f5f9",
  },
  alert: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  alertOk: {
    backgroundColor: "rgba(34,197,94,0.10)",
    borderColor: "rgba(34,197,94,0.28)",
  },
  alertErr: {
    backgroundColor: "rgba(239,68,68,0.10)",
    borderColor: "rgba(239,68,68,0.28)",
  },
  alertText: {
    color: "#f1f5f9",
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
    backgroundColor: "rgba(59,130,246,0.18)",
    borderColor: "rgba(59,130,246,0.35)",
  },
  smallBtnSecondary: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.12)",
  },
  smallBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  note: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(59,130,246,0.06)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.13)",
  },
  noteText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    lineHeight: 18,
  },
});
