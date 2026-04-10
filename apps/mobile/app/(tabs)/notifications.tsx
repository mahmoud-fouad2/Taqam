import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/components/auth-provider";
import { useAppSettings } from "@/components/app-settings-provider";
import { useTheme } from "@/theme";
import { SkeletonCard } from "@/components/ui";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

function timeAgo(iso: string, lang: "ar" | "en"): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return lang === "ar" ? "الآن" : "Just now";
  if (mins < 60) return lang === "ar" ? `منذ ${mins} دقيقة` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return lang === "ar" ? `منذ ${hours} ساعة` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return lang === "ar" ? `منذ ${days} يوم` : `${days}d ago`;
}

export default function NotificationsScreen() {
  const { authFetch } = useAuth();
  const { language } = useAppSettings();
  const { colors, radius, spacing } = useTheme();
  const isRtl = language === "ar";

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await authFetch<{ data: NotificationItem[]; unreadCount: number }>(
        "/api/mobile/notifications?limit=50",
      );
      setItems(res.data ?? []);
      setUnreadCount(res.unreadCount ?? 0);
    } catch (e: any) {
      console.warn("Notifications fetch:", e?.message);
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

  const markAllRead = async () => {
    try {
      await authFetch("/api/mobile/notifications", { method: "POST" });
      setItems((prev) => prev.map((it) => ({ ...it, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const markRead = async (id: string) => {
    try {
      await authFetch(`/api/mobile/notifications/${id}/read`, { method: "PUT" });
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, isRead: true } : it)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.md, gap: 12, paddingTop: 40 }}>
        <SkeletonCard style={{ height: 72 }} />
        <SkeletonCard style={{ height: 72 }} />
        <SkeletonCard style={{ height: 72 }} />
        <SkeletonCard style={{ height: 72 }} />
      </View>
    );
  }

  const rtl = isRtl ? { textAlign: "right" as const, writingDirection: "rtl" as const } : {};

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: isRtl ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingTop: 12, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, ...rtl }}>
          {isRtl ? "الإشعارات" : "Notifications"}
          {unreadCount > 0 ? ` (${unreadCount})` : ""}
        </Text>
        {unreadCount > 0 && (
          <Pressable onPress={() => void markAllRead()} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.lg, backgroundColor: colors.primaryLight }}>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>
              {isRtl ? "قراءة الكل" : "Mark all read"}
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={items.length === 0
          ? { flex: 1, justifyContent: "center", alignItems: "center" }
          : { paddingHorizontal: spacing.md, paddingTop: 4, paddingBottom: 30, gap: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        {items.length === 0 ? (
          <View style={{ alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 48 }}>🔔</Text>
            <Text style={{ fontSize: 16, color: colors.textMuted, fontWeight: "600" }}>
              {isRtl ? "لا توجد إشعارات" : "No notifications yet"}
            </Text>
          </View>
        ) : (
          items.map((n) => (
            <Pressable
              key={n.id}
              onPress={() => !n.isRead && void markRead(n.id)}
              style={({ pressed }) => ({
                backgroundColor: n.isRead ? colors.surface : colors.primaryLight,
                borderRadius: radius.lg,
                padding: 14,
                borderWidth: 1,
                borderColor: n.isRead ? colors.border : colors.primary + "33",
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View style={{ flexDirection: isRtl ? "row-reverse" : "row", alignItems: "flex-start", gap: 10 }}>
                {!n.isRead && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 5 }} />}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, ...rtl }} numberOfLines={1}>
                    {n.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2, ...rtl }} numberOfLines={2}>
                    {n.message}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4, ...rtl }}>
                    {timeAgo(n.createdAt, language)}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
