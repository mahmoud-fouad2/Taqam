import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/components/auth-provider";
import { useAppSettings } from "@/components/app-settings-provider";
import { humanizeApiError } from "@/lib/i18n";

const BRAND = "#3b82f6";

type ApprovalItem = {
  id: string;
  employeeName: string;
  employeeNumber: string;
  department: string | null;
  jobTitle: string | null;
  leaveTypeName: string;
  leaveTypeColor: string | null;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  createdAt: string;
};

export default function ApprovalsScreen() {
  const { authFetch } = useAuth();
  const { language } = useAppSettings();
  const isRtl = language === "ar";

  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await authFetch<{ data: ApprovalItem[] }>("/api/mobile/approvals/pending");
      setItems(res.data ?? []);
    } catch (e: any) {
      console.warn("Approvals fetch:", e?.message);
    }
  }, [authFetch]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    if (action === "reject") {
      Alert.prompt?.(
        isRtl ? "سبب الرفض" : "Rejection reason",
        isRtl ? "اختياري" : "Optional",
        [
          { text: isRtl ? "إلغاء" : "Cancel", style: "cancel" },
          {
            text: isRtl ? "رفض" : "Reject",
            style: "destructive",
            onPress: (reason?: string) => void doAction(id, "reject", reason),
          },
        ],
        "plain-text",
      );
      // Alert.prompt not available on Android, fallback:
      if (!Alert.prompt) {
        doAction(id, "reject");
      }
      return;
    }
    await doAction(id, "approve");
  };

  const doAction = async (id: string, action: "approve" | "reject", reason?: string) => {
    setActioning(id);
    try {
      await authFetch(`/api/mobile/approvals/${id}/${action}`, {
        method: "POST",
        ...(reason ? { body: JSON.stringify({ reason }) } : {}),
      });
      setItems((prev) => prev.filter((it) => it.id !== id));
      Alert.alert("", action === "approve"
        ? (isRtl ? "تمت الموافقة ✓" : "Approved ✓")
        : (isRtl ? "تم الرفض" : "Rejected"),
      );
    } catch (e: any) {
      Alert.alert("", humanizeApiError(language, e?.message ?? ""));
    } finally {
      setActioning(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BRAND} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND]} />}
    >
      {items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={[styles.emptyText, isRtl && styles.rtl]}>
            {isRtl ? "لا توجد طلبات معلقة" : "No pending approvals"}
          </Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.card}>
            {/* Employee info */}
            <View style={[styles.row, isRtl && { flexDirection: "row-reverse" }]}>
              <View style={[styles.dot, item.leaveTypeColor ? { backgroundColor: item.leaveTypeColor } : undefined]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.empName, isRtl && styles.rtl]}>{item.employeeName}</Text>
                {item.department && (
                  <Text style={[styles.empSub, isRtl && styles.rtl]}>
                    {item.department}{item.jobTitle ? ` — ${item.jobTitle}` : ""}
                  </Text>
                )}
              </View>
            </View>

            {/* Leave details */}
            <View style={styles.details}>
              <Text style={[styles.leaveType, isRtl && styles.rtl]}>{item.leaveTypeName}</Text>
              <Text style={[styles.dates, isRtl && styles.rtl]}>
                {item.startDate} → {item.endDate}  ({item.totalDays} {isRtl ? "يوم" : "days"})
              </Text>
              {item.reason ? (
                <Text style={[styles.reason, isRtl && styles.rtl]} numberOfLines={3}>{item.reason}</Text>
              ) : null}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable
                onPress={() => void handleAction(item.id, "approve")}
                disabled={actioning === item.id}
                style={({ pressed }) => [styles.approveBtn, pressed && { opacity: 0.8 }]}
              >
                {actioning === item.id ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.approveBtnText}>✓ {isRtl ? "موافقة" : "Approve"}</Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => void handleAction(item.id, "reject")}
                disabled={actioning === item.id}
                style={({ pressed }) => [styles.rejectBtn, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.rejectBtnText}>✕ {isRtl ? "رفض" : "Reject"}</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center" },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyBox: { alignItems: "center", gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, color: "#94a3b8", fontWeight: "600" },
  rtl: { textAlign: "right", writingDirection: "rtl" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 12,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: BRAND },
  empName: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  empSub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  details: { gap: 4, paddingLeft: 20 },
  leaveType: { fontSize: 14, fontWeight: "700", color: "#334155" },
  dates: { fontSize: 13, color: "#64748b" },
  reason: { fontSize: 12, color: "#94a3b8", marginTop: 4 },

  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  approveBtn: {
    flex: 1,
    backgroundColor: "#22c55e",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  approveBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  rejectBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#ef4444",
  },
  rejectBtnText: { color: "#ef4444", fontSize: 14, fontWeight: "800" },
});
