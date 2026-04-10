import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/components/auth-provider";
import { useAppSettings } from "@/components/app-settings-provider";
import { humanizeApiError } from "@/lib/i18n";
import { useTheme } from "@/theme";
import { SkeletonCard } from "@/components/ui";

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
  const { colors, radius, spacing } = useTheme();
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
    let cancelled = false;
    (async () => {
      try { await fetchData(); } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
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
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.md, gap: 12, paddingTop: 40 }}>
        <SkeletonCard style={{ height: 140 }} />
        <SkeletonCard style={{ height: 140 }} />
        <SkeletonCard style={{ height: 140 }} />
      </View>
    );
  }

  const rtl = isRtl ? { textAlign: "right" as const, writingDirection: "rtl" as const } : {};

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={items.length === 0
        ? { flex: 1, justifyContent: "center", alignItems: "center" }
        : { padding: spacing.md, paddingBottom: 40, gap: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
    >
      {items.length === 0 ? (
        <View style={{ alignItems: "center", gap: 12 }}>
          <Text style={{ fontSize: 48 }}>✅</Text>
          <Text style={{ fontSize: 16, color: colors.textMuted, fontWeight: "600" }}>
            {isRtl ? "لا توجد طلبات معلقة" : "No pending approvals"}
          </Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id} style={{ backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 12 }}>
            {/* Employee info */}
            <View style={{ flexDirection: isRtl ? "row-reverse" : "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.leaveTypeColor ?? colors.primary }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, ...rtl }}>{item.employeeName}</Text>
                {item.department && (
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2, ...rtl }}>
                    {item.department}{item.jobTitle ? ` — ${item.jobTitle}` : ""}
                  </Text>
                )}
              </View>
            </View>

            {/* Leave details */}
            <View style={{ gap: 4, paddingLeft: isRtl ? 0 : 20, paddingRight: isRtl ? 20 : 0 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, ...rtl }}>{item.leaveTypeName}</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, ...rtl }}>
                {item.startDate} → {item.endDate}  ({item.totalDays} {isRtl ? "يوم" : "days"})
              </Text>
              {item.reason ? (
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4, ...rtl }} numberOfLines={3}>{item.reason}</Text>
              ) : null}
            </View>

            {/* Actions */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
              <Pressable
                onPress={() => void handleAction(item.id, "approve")}
                disabled={actioning === item.id}
                style={({ pressed }) => ({ flex: 1, backgroundColor: "#22c55e", borderRadius: radius.lg, paddingVertical: 12, alignItems: "center", opacity: pressed ? 0.8 : 1 })}
              >
                {actioning === item.id ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800" }}>✓ {isRtl ? "موافقة" : "Approve"}</Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => void handleAction(item.id, "reject")}
                disabled={actioning === item.id}
                style={({ pressed }) => ({ flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: 12, alignItems: "center", borderWidth: 1.5, borderColor: "#ef4444", opacity: pressed ? 0.8 : 1 })}
              >
                <Text style={{ color: "#ef4444", fontSize: 14, fontWeight: "800" }}>✕ {isRtl ? "رفض" : "Reject"}</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
