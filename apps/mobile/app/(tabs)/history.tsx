import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { useAuth } from "@/components/auth-provider";
import { useAppSettings } from "@/components/app-settings-provider";
import { humanizeApiError, t, tStr } from "@/lib/i18n";
import { useTheme } from "@/theme";

type AttendanceRecordRow = {
  id: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
};

export default function HistoryScreen() {
  const { accessToken, authFetch } = useAuth();
  const { language } = useAppSettings();
  const { colors, spacing, radius } = useTheme();
  const isRtl = language === "ar";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<AttendanceRecordRow[]>([]);
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

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

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const { year, month } = calMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calMonth]);

  const attendanceMap = useMemo(() => {
    const map: Record<string, AttendanceRecordRow> = {};
    for (const r of rows) {
      const d = r.date.slice(0, 10);
      map[d] = r;
    }
    return map;
  }, [rows]);

  const calMonthLabel = useMemo(() => {
    const d = new Date(calMonth.year, calMonth.month, 1);
    return d.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", { month: "long", year: "numeric" });
  }, [calMonth, language]);

  const prevMonth = () =>
    setCalMonth((prev) => (prev.month === 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 }));
  const nextMonth = () =>
    setCalMonth((prev) => (prev.month === 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 }));

  const dayHeaders = useMemo(() => {
    return language === "ar"
      ? ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  }, [language]);

  // Load calendar month data when user switches to calendar view or changes month
  useEffect(() => {
    if (viewMode !== "calendar" || !accessToken) return;
    const { year, month } = calMonth;
    const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
    setBusy(true);
    authFetch<{ data: { items: AttendanceRecordRow[]; total: number } }>(
      `/api/mobile/attendance?startDate=${start}&endDate=${end}&page=1&limit=31`,
    )
      .then((res) => {
        setRows(res.data.items || []);
        setTotal(res.data.total || 0);
      })
      .catch((e: any) => setError(humanizeApiError(language, e?.message || "")))
      .finally(() => setBusy(false));
  }, [viewMode, calMonth, accessToken, authFetch, language]);

  return (
    <View style={{ flex: 1, padding: spacing.md, backgroundColor: colors.background }}>
      {/* Header: title + view mode toggle */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10, marginBottom: 10 }}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800" }}>{t(language, "history_title")}</Text>
        <View style={{ flexDirection: "row", gap: 6 }}>
          <Pressable
            onPress={() => setViewMode("list")}
            style={{
              padding: 8, borderRadius: radius.sm, borderWidth: 1,
              borderColor: viewMode === "list" ? colors.primary + "80" : colors.border,
              backgroundColor: viewMode === "list" ? colors.primaryLight : colors.surface,
            }}
          >
            <FontAwesome name="list" size={16} color={viewMode === "list" ? colors.primary : colors.textMuted} />
          </Pressable>
          <Pressable
            onPress={() => setViewMode("calendar")}
            style={{
              padding: 8, borderRadius: radius.sm, borderWidth: 1,
              borderColor: viewMode === "calendar" ? colors.primary + "80" : colors.border,
              backgroundColor: viewMode === "calendar" ? colors.primaryLight : colors.surface,
            }}
          >
            <FontAwesome name="calendar" size={16} color={viewMode === "calendar" ? colors.primary : colors.textMuted} />
          </Pressable>
        </View>
      </View>

      {viewMode === "list" ? (
        <>
          {/* Day filters */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            {([7, 30, 90] as const).map((d) => (
              <Pressable
                key={d}
                onPress={() => setFilter(d)}
                style={{
                  flex: 1, paddingVertical: 9, borderRadius: radius.md, borderWidth: 1, alignItems: "center",
                  borderColor: days === d ? colors.primary + "80" : colors.border,
                  backgroundColor: days === d ? colors.primaryLight : colors.surface,
                }}
              >
                <Text style={{ color: days === d ? colors.primary : colors.textSecondary, fontWeight: "700", fontSize: 12 }}>
                  {t(language, d === 7 ? "last_7_days" : d === 30 ? "last_30_days" : "last_90_days")}
                </Text>
              </Pressable>
            ))}
          </View>

          {error ? <Text style={{ color: colors.error, marginBottom: 10, fontSize: 13 }}>{error}</Text> : null}

          <FlatList
            data={rows}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={busy && rows.length > 0} onRefresh={() => void load({ reset: true, nextPage: 1 })} colors={[colors.primary]} tintColor={colors.primary} />
            }
            contentContainerStyle={rows.length === 0 ? { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 } : undefined}
            ListEmptyComponent={!busy ? <Text style={{ color: colors.textMuted, fontSize: 15, marginTop: 8 }}>{t(language, "empty_history")}</Text> : null}
            onEndReachedThreshold={0.4}
            onEndReached={loadMore}
            ListFooterComponent={
              rows.length > 0 ? (
                <View style={{ paddingTop: 6, paddingBottom: 14 }}>
                  <Pressable
                    onPress={loadMore}
                    disabled={!hasMore || busy || loadingMore}
                    style={{
                      borderRadius: radius.md, paddingVertical: 13, alignItems: "center",
                      borderWidth: 1, borderColor: colors.primary + "40",
                      backgroundColor: colors.primaryLight,
                      opacity: !hasMore || busy || loadingMore ? 0.5 : 1,
                    }}
                  >
                    {loadingMore ? (
                      <ActivityIndicator color={colors.primary} />
                    ) : (
                      <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 14 }}>
                        {hasMore ? t(language, "load_more") : t(language, "no_more")}
                      </Text>
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
              const accentColor = hasIn && hasOut ? colors.success : hasIn ? colors.primary : colors.textSecondary;

              return (
                <View style={{
                  padding: 14, borderRadius: 14, borderWidth: 1, borderLeftWidth: 3,
                  borderColor: colors.border, borderLeftColor: accentColor,
                  backgroundColor: colors.surface, marginBottom: 10,
                }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{ width: 44, alignItems: "center", marginRight: 4 }}>
                      <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 11, textTransform: "uppercase" }}>{dayName}</Text>
                      <Text style={{ color: colors.text, fontWeight: "700", fontSize: 12, textAlign: "center" }}>{dateStr}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <Text style={{ fontSize: 10 }}>🟢</Text>
                        <Text style={{ color: colors.textMuted, fontSize: 11, flex: 1 }}>{t(language, "last_check_in")}</Text>
                        <Text style={{ color: colors.text, fontWeight: "700", fontSize: 12 }}>{checkIn}</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <Text style={{ fontSize: 10 }}>🔴</Text>
                        <Text style={{ color: colors.textMuted, fontSize: 11, flex: 1 }}>{t(language, "last_check_out")}</Text>
                        <Text style={{ color: colors.text, fontWeight: "700", fontSize: 12 }}>{checkOut}</Text>
                      </View>
                    </View>
                    {durationText ? (
                      <View style={{ backgroundColor: colors.primaryLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: colors.primary + "30" }}>
                        <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 11 }}>{durationText}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            }}
          />
        </>
      ) : (
        /* Calendar view */
        <View style={{ flex: 1 }}>
          {/* Month nav */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Pressable onPress={prevMonth} style={{ padding: 10 }}>
              <FontAwesome name={isRtl ? "chevron-right" : "chevron-left"} size={16} color={colors.primary} />
            </Pressable>
            <Text style={{ color: colors.text, fontWeight: "800", fontSize: 16 }}>{calMonthLabel}</Text>
            <Pressable onPress={nextMonth} style={{ padding: 10 }}>
              <FontAwesome name={isRtl ? "chevron-left" : "chevron-right"} size={16} color={colors.primary} />
            </Pressable>
          </View>

          {/* Day headers */}
          <View style={{ flexDirection: "row" }}>
            {dayHeaders.map((dh) => (
              <View key={dh} style={{ flex: 1, alignItems: "center", paddingVertical: 6 }}>
                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: "700" }}>{dh}</Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          {busy ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : (
            <FlatList
              data={calendarDays}
              numColumns={7}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item: day }) => {
                if (day === null) {
                  return <View style={{ flex: 1, aspectRatio: 1 }} />;
                }
                const dateKey = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const rec = attendanceMap[dateKey];
                const hasIn = !!rec?.checkInTime;
                const hasOut = !!rec?.checkOutTime;
                const isToday = dateKey === new Date().toISOString().slice(0, 10);

                let dotColor = colors.border;
                if (hasIn && hasOut) dotColor = colors.success;
                else if (hasIn) dotColor = colors.primary;

                return (
                  <View
                    style={{
                      flex: 1,
                      aspectRatio: 1,
                      alignItems: "center",
                      justifyContent: "center",
                      margin: 2,
                      borderRadius: radius.sm,
                      backgroundColor: isToday ? colors.primaryLight : "transparent",
                      borderWidth: isToday ? 1 : 0,
                      borderColor: colors.primary + "40",
                    }}
                  >
                    <Text style={{ color: isToday ? colors.primary : colors.text, fontWeight: isToday ? "800" : "600", fontSize: 13 }}>
                      {day}
                    </Text>
                    {rec && (
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor, marginTop: 2 }} />
                    )}
                  </View>
                );
              }}
            />
          )}

          {/* Legend */}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, paddingVertical: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success }} />
              <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{tStr(language, "حاضر", "Present")}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
              <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{tStr(language, "دخول فقط", "Check-in only")}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
