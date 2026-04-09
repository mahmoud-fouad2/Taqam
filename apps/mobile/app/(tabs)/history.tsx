import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/components/auth-provider";
import { useAppSettings } from "@/components/app-settings-provider";
import { humanizeApiError, t } from "@/lib/i18n";

type AttendanceRecordRow = {
  id: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
};

export default function HistoryScreen() {
  const { accessToken, authFetch } = useAuth();
  const { language } = useAppSettings();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<AttendanceRecordRow[]>([]);
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const hasMore = rows.length < total;

  const buildRangeQuery = (daysBack: 7 | 30 | 90) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (daysBack - 1));

    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { startDate: fmt(start), endDate: fmt(end) };
  };

  const load = useCallback(
    async (opts?: { nextPage?: number; reset?: boolean; nextDays?: 7 | 30 | 90 }) => {
      if (!accessToken) return;

      const nextDays = opts?.nextDays ?? days;
      const nextPage = opts?.nextPage ?? 1;
      const reset = opts?.reset ?? false;

      if (reset) setBusy(true);
      else setLoadingMore(true);

      setError(null);

      try {
        const range = buildRangeQuery(nextDays);
        const limit = 20;
        const qs = new URLSearchParams({
          page: String(nextPage),
          limit: String(limit),
          startDate: range.startDate,
          endDate: range.endDate,
        });

        const res = await authFetch<{ data: { items: AttendanceRecordRow[]; page: number; limit: number; total: number } }>(
          `/api/mobile/attendance?${qs.toString()}`
        );

        setTotal(res.data.total || 0);
        setPage(res.data.page || nextPage);
        setRows((prev) => (reset ? (res.data.items || []) : [...prev, ...(res.data.items || [])]));
      } catch (e: any) {
        setError(humanizeApiError(language, e?.message || ""));
      } finally {
        setBusy(false);
        setLoadingMore(false);
      }
    },
    [accessToken, authFetch, days, language]
  );

  useEffect(() => {
    void load({ reset: true, nextPage: 1 });
  }, [load]);

  const setFilter = (d: 7 | 30 | 90) => {
    setDays(d);
    setRows([]);
    setTotal(0);
    setPage(1);
    void load({ reset: true, nextDays: d, nextPage: 1 });
  };

  const loadMore = () => {
    if (busy || loadingMore || !hasMore) return;
    void load({ reset: false, nextPage: page + 1 });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t(language, "history_title")}</Text>
        <Pressable onPress={() => void load({ reset: true, nextPage: 1 })} disabled={busy} style={[styles.refresh, busy && styles.refreshDisabled]}>
          {busy ? <ActivityIndicator color="#0ea5e9" /> : <Text style={styles.refreshText}>{t(language, "refresh")}</Text>}
        </Pressable>
      </View>

      <View style={styles.filtersRow}>
        <Pressable onPress={() => setFilter(7)} style={[styles.chip, days === 7 && styles.chipActive]}>
          <Text style={[styles.chipText, days === 7 && styles.chipTextActive]}>{t(language, "last_7_days")}</Text>
        </Pressable>
        <Pressable onPress={() => setFilter(30)} style={[styles.chip, days === 30 && styles.chipActive]}>
          <Text style={[styles.chipText, days === 30 && styles.chipTextActive]}>{t(language, "last_30_days")}</Text>
        </Pressable>
        <Pressable onPress={() => setFilter(90)} style={[styles.chip, days === 90 && styles.chipActive]}>
          <Text style={[styles.chipText, days === 90 && styles.chipTextActive]}>{t(language, "last_90_days")}</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={busy && rows.length > 0} onRefresh={() => void load({ reset: true, nextPage: 1 })} colors={["#0ea5e9"]} tintColor="#0ea5e9" />
        }
        contentContainerStyle={rows.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={!busy ? <Text style={styles.empty}>{t(language, "empty_history")}</Text> : null}
        onEndReachedThreshold={0.4}
        onEndReached={loadMore}
        ListFooterComponent={
          rows.length > 0 ? (
            <View style={styles.footer}>
              <Pressable
                onPress={loadMore}
                disabled={!hasMore || busy || loadingMore}
                style={[styles.loadMore, (!hasMore || busy || loadingMore) && styles.loadMoreDisabled]}
              >
                {loadingMore ? (
                  <ActivityIndicator color="#3b82f6" />
                ) : (
                  <Text style={styles.loadMoreText}>{hasMore ? t(language, "load_more") : t(language, "no_more")}</Text>
                )}
              </Pressable>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const dateVal   = new Date(item.date);
          const dayName   = dateVal.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", { weekday: "short" });
          const dateStr   = dateVal.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", { month: "short", day: "numeric" });
          const checkIn   = item.checkInTime  ? new Date(item.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
          const checkOut  = item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

          let durationText = "";
          if (item.checkInTime && item.checkOutTime) {
            const mins = Math.round((new Date(item.checkOutTime).getTime() - new Date(item.checkInTime).getTime()) / 60000);
            if (mins > 0) {
              const h = Math.floor(mins / 60);
              const m = mins % 60;
              durationText = language === "ar" ? `${h}س ${m}د` : `${h}h ${m}m`;
            }
          }

          const hasIn  = !!item.checkInTime;
          const hasOut = !!item.checkOutTime;
          const accentColor = hasIn && hasOut ? "#22c55e" : hasIn ? "#3b82f6" : "#475569";

          return (
            <View style={[styles.card, { borderLeftColor: accentColor }]}>
              <View style={styles.cardRow}>
                <View style={styles.dateBlock}>
                  <Text style={styles.dayName}>{dayName}</Text>
                  <Text style={styles.dateStr}>{dateStr}</Text>
                </View>
                <View style={styles.timesBlock}>
                  <View style={styles.timeRow}>
                    <Text style={styles.timeIcon}>🟢</Text>
                    <Text style={styles.timeLabel}>{t(language, "last_check_in")}</Text>
                    <Text style={styles.timeVal}>{checkIn}</Text>
                  </View>
                  <View style={styles.timeRow}>
                    <Text style={styles.timeIcon}>🔴</Text>
                    <Text style={styles.timeLabel}>{t(language, "last_check_out")}</Text>
                    <Text style={styles.timeVal}>{checkOut}</Text>
                  </View>
                </View>
                {durationText ? (
                  <View style={styles.durationTag}>
                    <Text style={styles.durationText}>{durationText}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8fafc",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 10,
  },
  title: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "800",
  },
  filtersRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  chipActive: {
    borderColor: "rgba(59,130,246,0.5)",
    backgroundColor: "rgba(59,130,246,0.08)",
  },
  chipText: {
    color: "#64748b",
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
  },
  chipTextActive: {
    color: "#3b82f6",
    fontWeight: "800",
  },
  refresh: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  refreshDisabled: {
    opacity: 0.5,
  },
  refreshText: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 13,
  },
  error: {
    color: "#ef4444",
    marginBottom: 10,
    fontSize: 13,
  },
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderColor: "#e2e8f0",
    borderLeftColor: "#22c55e",
    backgroundColor: "#ffffff",
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateBlock: {
    width: 44,
    alignItems: "center",
    marginRight: 4,
  },
  dayName: {
    color: "#3b82f6",
    fontWeight: "800",
    fontSize: 11,
    textTransform: "uppercase",
  },
  dateStr: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
  },
  timesBlock: {
    flex: 1,
    gap: 4,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  timeIcon: {
    fontSize: 10,
  },
  timeLabel: {
    color: "#94a3b8",
    fontSize: 11,
    flex: 1,
  },
  timeVal: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 12,
  },
  durationTag: {
    backgroundColor: "rgba(59,130,246,0.08)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.20)",
  },
  durationText: {
    color: "#3b82f6",
    fontWeight: "800",
    fontSize: 11,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  empty: {
    color: "#94a3b8",
    fontSize: 15,
    marginTop: 8,
  },
  footer: {
    paddingTop: 6,
    paddingBottom: 14,
  },
  loadMore: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.25)",
    backgroundColor: "rgba(59,130,246,0.06)",
  },
  loadMoreDisabled: {
    opacity: 0.5,
  },
  loadMoreText: {
    color: "#3b82f6",
    fontWeight: "800",
    fontSize: 14,
  },
});
