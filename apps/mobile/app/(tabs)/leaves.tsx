import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import { useAuth } from "@/components/auth-provider";
import { useAppSettings } from "@/components/app-settings-provider";
import { t, humanizeApiError, tStr } from "@/lib/i18n";
import { SkeletonCard } from "@/components/ui";

const BRAND = "#3b82f6";

type FilterTab = "all" | "leave" | "ticket";

type LeaveType = {
  id: string;
  name: string;
  nameAr: string;
  color: string | null;
  balance: { entitled: number; used: number; pending: number; remaining: number } | null;
};

type LeaveRequest = {
  id: string;
  leaveTypeName: string;
  leaveTypeColor: string | null;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: string;
  createdAt: string;
};

type Ticket = {
  id: string;
  type: string;
  title: string;
  description: string | undefined;
  status: string;
  createdAt: string;
};

type RequestItem =
  | { kind: "leave"; data: LeaveRequest }
  | { kind: "ticket"; data: Ticket };

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING:   { bg: "#fef3c7", text: "#92400e" },
  APPROVED:  { bg: "#d1fae5", text: "#065f46" },
  REJECTED:  { bg: "#fee2e2", text: "#991b1b" },
  CANCELLED: { bg: "#e2e8f0", text: "#475569" },
  OPEN:      { bg: "#dbeafe", text: "#1e40af" },
  CLOSED:    { bg: "#e2e8f0", text: "#475569" },
};

function statusLabel(status: string, lang: "ar" | "en"): string {
  const map: Record<string, { ar: string; en: string }> = {
    PENDING:   { ar: "قيد المراجعة", en: "Pending" },
    APPROVED:  { ar: "موافق عليه", en: "Approved" },
    REJECTED:  { ar: "مرفوض", en: "Rejected" },
    CANCELLED: { ar: "ملغي", en: "Cancelled" },
    OPEN:      { ar: "مفتوحة", en: "Open" },
    CLOSED:    { ar: "مغلقة", en: "Closed" },
  };
  return map[status]?.[lang] ?? status;
}

export default function LeavesScreen() {
  const { authFetch } = useAuth();
  const { language } = useAppSettings();
  const isRtl = language === "ar";

  // Data
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [filter, setFilter] = useState<FilterTab>("all");

  // New leave modal
  const [showNewLeave, setShowNewLeave] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // ─────────────────── Data fetching ───────────────────
  const fetchData = useCallback(async () => {
    try {
      const [leavesRes, requestsRes, typesRes] = await Promise.all([
        authFetch<{ data: LeaveRequest[]; total: number }>("/api/mobile/leaves?limit=50"),
        authFetch<{ data: { items: Ticket[] } }>("/api/mobile/my-requests").catch(() => ({ data: { items: [] } })),
        authFetch<{ data: LeaveType[] }>("/api/mobile/leaves/types"),
      ]);
      setLeaves(leavesRes.data ?? []);
      setTickets((requestsRes.data?.items ?? []).filter((it: any) => it.type === "ticket"));
      setLeaveTypes(typesRes.data ?? []);
    } catch (e: any) {
      console.warn("Leaves fetchData error:", e?.message);
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

  // ─────────────────── Merged list ───────────────────
  const items: RequestItem[] = (() => {
    const all: RequestItem[] = [];
    if (filter === "all" || filter === "leave") {
      for (const l of leaves) all.push({ kind: "leave", data: l });
    }
    if (filter === "all" || filter === "ticket") {
      for (const tk of tickets) all.push({ kind: "ticket", data: tk });
    }
    // Sort desc by createdAt
    all.sort((a, b) => {
      const da = new Date(a.kind === "leave" ? a.data.createdAt : a.data.createdAt);
      const db = new Date(b.kind === "leave" ? b.data.createdAt : b.data.createdAt);
      return db.getTime() - da.getTime();
    });
    return all;
  })();

  // ─────────────────── Submit new leave ───────────────────
  const submitLeave = async () => {
    if (!selectedType) {
      Alert.alert("", t(language, "select_leave_type"));
      return;
    }
    if (endDate < startDate) {
      Alert.alert("", t(language, "end_after_start"));
      return;
    }

    setSubmitting(true);
    try {
      await authFetch("/api/mobile/leaves", {
        method: "POST",
        body: JSON.stringify({
          leaveTypeId: selectedType,
          startDate: fmtDate(startDate),
          endDate: fmtDate(endDate),
          reason: reason.trim() || undefined,
        }),
      });
      setShowNewLeave(false);
      resetForm();
      Alert.alert("", t(language, "submit_success"));
      void fetchData();
    } catch (e: any) {
      Alert.alert("", humanizeApiError(language, e?.message ?? ""));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedType(null);
    setStartDate(new Date());
    setEndDate(new Date());
    setReason("");
  };

  // ─────────────────── Render ───────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f8fafc", padding: 16, gap: 12, paddingTop: 40 }}>
        <SkeletonCard style={{ height: 80 }} />
        <SkeletonCard style={{ height: 80 }} />
        <SkeletonCard style={{ height: 120 }} />
        <SkeletonCard style={{ height: 120 }} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, isRtl && styles.rtl]}>
          {t(language, "my_requests_title")}
        </Text>
        <Pressable
          onPress={() => setShowNewLeave(true)}
          style={({ pressed }) => [styles.newBtn, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.newBtnText}>+ {t(language, "new_request")}</Text>
        </Pressable>
      </View>

      {/* Balance cards */}
      {leaveTypes.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.balanceRow}
        >
          {leaveTypes.map((lt) => (
            <View key={lt.id} style={[styles.balanceCard, lt.color ? { borderLeftColor: lt.color, borderLeftWidth: 4 } : undefined]}>
              <Text style={styles.balanceName} numberOfLines={1}>
                {isRtl ? lt.nameAr || lt.name : lt.name}
              </Text>
              {lt.balance ? (
                <View style={styles.balanceNumbers}>
                  <Text style={styles.balanceRemaining}>{lt.balance.remaining}</Text>
                  <Text style={styles.balanceTotal}>/ {lt.balance.entitled}</Text>
                </View>
              ) : (
                <Text style={styles.balanceTotal}>—</Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(["all", "leave", "ticket"] as FilterTab[]).map((tab) => {
          const active = filter === tab;
          const label = tab === "all"
            ? t(language, "filter_all")
            : tab === "leave"
              ? t(language, "filter_leave")
              : t(language, "filter_ticket");
          return (
            <Pressable
              key={tab}
              onPress={() => setFilter(tab)}
              style={[styles.filterTab, active && styles.filterTabActive]}
            >
              <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND]} />
        }
      >
        {items.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={[styles.emptyText, isRtl && styles.rtl]}>
              {t(language, "no_requests")}
            </Text>
          </View>
        ) : (
          items.map((item) =>
            item.kind === "leave" ? (
              <LeaveCard key={`l-${item.data.id}`} item={item.data} lang={language} isRtl={isRtl} />
            ) : (
              <TicketCard key={`t-${item.data.id}`} item={item.data} lang={language} isRtl={isRtl} />
            ),
          )
        )}
      </ScrollView>

      {/* New Leave Modal */}
      <Modal visible={showNewLeave} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modalRoot} contentContainerStyle={styles.modalContent}>
          <Text style={[styles.modalTitle, isRtl && styles.rtl]}>
            {t(language, "leave_request")}
          </Text>

          {/* Leave type picker */}
          <Text style={[styles.fieldLabel, isRtl && styles.rtl]}>{t(language, "leave_type_label")}</Text>
          <View style={styles.typeGrid}>
            {leaveTypes.map((lt) => {
              const active = selectedType === lt.id;
              return (
                <Pressable
                  key={lt.id}
                  onPress={() => setSelectedType(lt.id)}
                  style={[
                    styles.typeChip,
                    active && { backgroundColor: lt.color || BRAND, borderColor: lt.color || BRAND },
                  ]}
                >
                  <Text style={[styles.typeChipText, active && { color: "#fff" }]} numberOfLines={1}>
                    {isRtl ? lt.nameAr || lt.name : lt.name}
                  </Text>
                  {lt.balance ? (
                    <Text style={[styles.typeChipBal, active && { color: "rgba(255,255,255,0.85)" }]}>
                      {lt.balance.remaining} {isRtl ? "متبقي" : "left"}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {/* Dates */}
          <Text style={[styles.fieldLabel, isRtl && styles.rtl]}>{t(language, "start_date_label")}</Text>
          <Pressable onPress={() => setShowStartPicker(true)} style={styles.dateBtn}>
            <Text style={styles.dateBtnText}>{fmtDate(startDate)}</Text>
          </Pressable>
          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              minimumDate={new Date()}
              onChange={(e: DateTimePickerEvent, d?: Date) => {
                setShowStartPicker(Platform.OS === "ios");
                if (d) { setStartDate(d); if (d > endDate) setEndDate(d); }
              }}
            />
          )}

          <Text style={[styles.fieldLabel, isRtl && styles.rtl]}>{t(language, "end_date_label")}</Text>
          <Pressable onPress={() => setShowEndPicker(true)} style={styles.dateBtn}>
            <Text style={styles.dateBtnText}>{fmtDate(endDate)}</Text>
          </Pressable>
          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              minimumDate={startDate}
              onChange={(e: DateTimePickerEvent, d?: Date) => {
                setShowEndPicker(Platform.OS === "ios");
                if (d) setEndDate(d);
              }}
            />
          )}

          {/* Reason */}
          <Text style={[styles.fieldLabel, isRtl && styles.rtl]}>{t(language, "reason_label")}</Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder={t(language, "reason_placeholder")}
            placeholderTextColor="#94a3b8"
            multiline
            style={[styles.textArea, isRtl && styles.rtl]}
          />

          {/* Actions */}
          <View style={styles.modalActions}>
            <Pressable
              onPress={submitLeave}
              disabled={submitting}
              style={({ pressed }) => [styles.submitBtn, (submitting || pressed) && { opacity: 0.7 }]}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>{t(language, "submit")}</Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => { setShowNewLeave(false); resetForm(); }}
              style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.cancelBtnText}>{t(language, "cancel")}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

// ─────────────────── Sub-components ───────────────────

function LeaveCard({ item, lang, isRtl }: { item: LeaveRequest; lang: "ar" | "en"; isRtl: boolean }) {
  const statusKey = item.status.toUpperCase();
  const sc = STATUS_COLORS[statusKey] ?? STATUS_COLORS.PENDING;
  return (
    <View style={styles.card}>
      <View style={[styles.cardRow, isRtl && { flexDirection: "row-reverse" }]}>
        <View style={[styles.colorDot, item.leaveTypeColor ? { backgroundColor: item.leaveTypeColor } : undefined]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, isRtl && styles.rtl]} numberOfLines={1}>
            {item.leaveTypeName}
          </Text>
          <Text style={[styles.cardDates, isRtl && styles.rtl]}>
            {item.startDate} → {item.endDate}  ({item.totalDays} {isRtl ? "يوم" : "days"})
          </Text>
          {item.reason ? (
            <Text style={[styles.cardReason, isRtl && styles.rtl]} numberOfLines={2}>
              {item.reason}
            </Text>
          ) : null}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusText, { color: sc.text }]}>
            {statusLabel(statusKey, lang)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function TicketCard({ item, lang, isRtl }: { item: Ticket; lang: "ar" | "en"; isRtl: boolean }) {
  const statusKey = item.status.toUpperCase();
  const sc = STATUS_COLORS[statusKey] ?? STATUS_COLORS.OPEN;
  return (
    <View style={styles.card}>
      <View style={[styles.cardRow, isRtl && { flexDirection: "row-reverse" }]}>
        <Text style={styles.ticketIcon}>🎫</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, isRtl && styles.rtl]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.cardDates, isRtl && styles.rtl]} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusText, { color: sc.text }]}>
            {statusLabel(statusKey, lang)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────── Helpers ───────────────────

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ─────────────────── Styles ───────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#64748b", marginTop: 12, fontSize: 14 },
  rtl: { textAlign: "right", writingDirection: "rtl" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  newBtn: {
    backgroundColor: BRAND,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  newBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  // Balance cards (horizontal scroll)
  balanceRow: { paddingHorizontal: 16, gap: 10, paddingVertical: 8 },
  balanceCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    minWidth: 120,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  balanceName: { fontSize: 12, fontWeight: "700", color: "#64748b", marginBottom: 6 },
  balanceNumbers: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  balanceRemaining: { fontSize: 22, fontWeight: "900", color: "#0f172a" },
  balanceTotal: { fontSize: 13, color: "#94a3b8", fontWeight: "600" },

  // Filter Tabs
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 4,
    marginTop: 4,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterTabActive: {
    backgroundColor: BRAND,
    borderColor: BRAND,
  },
  filterTabText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  filterTabTextActive: { color: "#fff" },

  // List
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 30, gap: 10 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyBox: { alignItems: "center", gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, color: "#94a3b8", fontWeight: "600" },

  // Cards
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BRAND,
    marginTop: 5,
  },
  ticketIcon: { fontSize: 18, marginTop: 1 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a", marginBottom: 2 },
  cardDates: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  cardReason: { fontSize: 12, color: "#94a3b8", marginTop: 4 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: "700" },

  // Modal
  modalRoot: { flex: 1, backgroundColor: "#f8fafc" },
  modalContent: { padding: 20, paddingTop: 30, paddingBottom: 50 },
  modalTitle: { fontSize: 24, fontWeight: "800", color: "#0f172a", marginBottom: 24 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    marginTop: 16,
    marginBottom: 8,
  },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    minWidth: 100,
    gap: 2,
  },
  typeChipText: { fontSize: 13, fontWeight: "700", color: "#334155" },
  typeChipBal: { fontSize: 11, color: "#94a3b8", fontWeight: "600" },
  dateBtn: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateBtnText: { fontSize: 15, fontWeight: "600", color: "#0f172a" },
  textArea: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#0f172a",
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalActions: { marginTop: 28, gap: 12 },
  submitBtn: {
    backgroundColor: BRAND,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  cancelBtn: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cancelBtnText: { color: "#64748b", fontSize: 15, fontWeight: "700" },
});
