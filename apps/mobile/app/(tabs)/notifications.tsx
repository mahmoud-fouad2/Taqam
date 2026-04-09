import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/components/auth-provider";
import { useAppSettings } from "@/components/app-settings-provider";

const BRAND = "#3b82f6";

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
    setLoading(true);
    fetchData().finally(() => setLoading(false));
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BRAND} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, isRtl && styles.rtl]}>
          {isRtl ? "الإشعارات" : "Notifications"}
          {unreadCount > 0 ? ` (${unreadCount})` : ""}
        </Text>
        {unreadCount > 0 && (
          <Pressable onPress={() => void markAllRead()} style={styles.readAllBtn}>
            <Text style={styles.readAllText}>
              {isRtl ? "قراءة الكل" : "Mark all read"}
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND]} />}
      >
        {items.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={[styles.emptyText, isRtl && styles.rtl]}>
              {isRtl ? "لا توجد إشعارات" : "No notifications yet"}
            </Text>
          </View>
        ) : (
          items.map((n) => (
            <Pressable
              key={n.id}
              onPress={() => !n.isRead && void markRead(n.id)}
              style={[styles.card, !n.isRead && styles.cardUnread]}
            >
              <View style={[styles.cardRow, isRtl && { flexDirection: "row-reverse" }]}>
                {!n.isRead && <View style={styles.unreadDot} />}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.notifTitle, isRtl && styles.rtl]} numberOfLines={1}>
                    {n.title}
                  </Text>
                  <Text style={[styles.notifMsg, isRtl && styles.rtl]} numberOfLines={2}>
                    {n.message}
                  </Text>
                  <Text style={[styles.notifTime, isRtl && styles.rtl]}>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center" },
  rtl: { textAlign: "right", writingDirection: "rtl" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  readAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(59,130,246,0.1)",
  },
  readAllText: { color: BRAND, fontSize: 12, fontWeight: "700" },

  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 30, gap: 8 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyBox: { alignItems: "center", gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, color: "#94a3b8", fontWeight: "600" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardUnread: {
    backgroundColor: "rgba(59,130,246,0.04)",
    borderColor: "rgba(59,130,246,0.2)",
  },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND,
    marginTop: 5,
  },
  notifTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 2 },
  notifMsg: { fontSize: 13, color: "#64748b", lineHeight: 18 },
  notifTime: { fontSize: 11, color: "#94a3b8", marginTop: 6 },
});
