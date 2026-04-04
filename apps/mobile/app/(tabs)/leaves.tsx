import { useState, useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/components/auth-provider";
import { useAppSettings } from "@/components/app-settings-provider";
import { humanizeApiError } from "@/lib/i18n";

type ReqStatus = "pending" | "approved" | "rejected" | "cancelled";
type ReqType = "leave" | "ticket" | "training";
type FilterType = "all" | ReqType;

type RequestItem = {
  id: string;
  type: ReqType;
  title: string;
  status: ReqStatus;
  createdAt: string;
};

const STATUS_STYLE: Record<ReqStatus, { bg: string; text: string; border: string }> = {
  pending:   { bg: "rgba(245,158,11,0.12)", text: "#f59e0b", border: "rgba(245,158,11,0.35)" },
  approved:  { bg: "rgba(34,197,94,0.12)",  text: "#22c55e", border: "rgba(34,197,94,0.35)" },
  rejected:  { bg: "rgba(239,68,68,0.12)",  text: "#f87171", border: "rgba(239,68,68,0.35)" },
  cancelled: { bg: "rgba(148,163,184,0.10)", text: "#94a3b8", border: "rgba(148,163,184,0.25)" },
};

const TYPE_ICON: Record<ReqType, string> = { leave: "🌴", ticket: "🎫", training: "📚" };

function fmtDate(iso: string, lang: "ar" | "en"): string {
  try {
    return new Date(iso).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function typeLabel(tp: ReqType, lang: "ar" | "en"): string {
  const m: Record<ReqType, { ar: string; en: string }> = {
    leave:    { ar: "إجازة",      en: "Leave" },
    ticket:   { ar: "تذكرة دعم", en: "Support ticket" },
    training: { ar: "تدريب",      en: "Training" },
  };
  return m[tp][lang];
}

function statusLabel(s: ReqStatus, lang: "ar" | "en"): string {
  const m: Record<ReqStatus, { ar: string; en: string }> = {
    pending:   { ar: "قيد المراجعة", en: "Pending" },
    approved:  { ar: "موافق عليه",   en: "Approved" },
    rejected:  { ar: "مرفوض",        en: "Rejected" },
    cancelled: { ar: "ملغي",          en: "Cancelled" },
  };
  return m[s][lang];
}

export default function RequestsScreen() {
  const { authFetch, accessToken } = useAuth();
  const { language } = useAppSettings();
  const isRtl = language === "ar";

  const [items, setItems]     = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [filter, setFilter]   = useState<FilterType>("all");

  // Modal state
  const [showModal, setShowModal]       = useState(false);
  const [newTitle, setNewTitle]         = useState("");
  const [newDesc, setNewDesc]           = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch<{ data: { items: RequestItem[] } }>("/api/mobile/my-requests");
      setItems(res?.data?.items ?? []);
    } catch (e: any) {
      setError(humanizeApiError(language, e?.message ?? ""));
    } finally {
      setLoading(false);
    }
  }, [accessToken, authFetch, language]);

  useEffect(() => { void load(); }, [load]);

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);

  const openModal = () => {
    setNewTitle(""); setNewDesc(""); setSubmitError(null); setSubmitSuccess(false);
    setShowModal(true);
  };

  const submitTicket = async () => {
    const trimTitle = newTitle.trim();
    const trimDesc  = newDesc.trim();
    if (!trimTitle || !trimDesc) {
      setSubmitError(isRtl ? "الرجاء ملء جميع الحقول" : "Please fill all fields");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await authFetch("/api/mobile/my-requests", {
        method: "POST",
        body: JSON.stringify({ type: "ticket", title: trimTitle, description: trimDesc }),
      });
      setSubmitSuccess(true);
      void load();
      setTimeout(() => setShowModal(false), 1400);
    } catch (e: any) {
      setSubmitError(humanizeApiError(language, e?.message ?? ""));
    } finally {
      setSubmitting(false);
    }
  };

  const FILTERS: { key: FilterType; ar: string; en: string }[] = [
    { key: "all",      ar: "الكل",   en: "All" },
    { key: "leave",    ar: "إجازات", en: "Leaves" },
    { key: "ticket",   ar: "تذاكر",  en: "Tickets" },
    { key: "training", ar: "تدريب",  en: "Training" },
  ];

  return (
    <View style={styles.root}>
      {/* Filter chips */}
      <View style={[styles.filtersRow, isRtl && { flexDirection: "row-reverse" }]}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[styles.chip, filter === f.key && styles.chipActive]}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
              {f[language]}
            </Text>
          </Pressable>
        ))}
      </View>

      {error ? (
        <Text style={[styles.errorText, isRtl && { textAlign: "right" }]}>{error}</Text>
      ) : null}

      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color="#3b82f6" size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={filtered.length === 0 ? styles.center : styles.listPad}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>
                {isRtl ? "لا توجد طلبات بعد" : "No requests yet"}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const sc = STATUS_STYLE[item.status] ?? STATUS_STYLE.pending;
            return (
              <View style={[styles.card, isRtl ? styles.cardBorderRtl : styles.cardBorderLtr, { borderLeftColor: sc.text, borderRightColor: sc.text }]}>
                <View style={[styles.cardTop, isRtl && { flexDirection: "row-reverse" }]}>
                  <View style={styles.typeTag}>
                    <Text style={styles.typeTagText}>{TYPE_ICON[item.type]} {typeLabel(item.type, language)}</Text>
                  </View>
                  <View style={[styles.statusTag, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                    <Text style={[styles.statusTagText, { color: sc.text }]}>{statusLabel(item.status, language)}</Text>
                  </View>
                </View>
                <Text style={[styles.cardTitle, { textAlign: isRtl ? "right" : "left" }]}>{item.title}</Text>
                <Text style={[styles.cardDate, { textAlign: isRtl ? "right" : "left" }]}>{fmtDate(item.createdAt, language)}</Text>
              </View>
            );
          }}
        />
      )}

      {/* Floating action button */}
      <Pressable
        onPress={openModal}
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] }]}
      >
        <Text style={styles.fabPlus}>+</Text>
      </Pressable>

      {/* New ticket bottom sheet modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            {/* Header */}
            <View style={[styles.sheetHeader, isRtl && { flexDirection: "row-reverse" }]}>
              <Text style={[styles.sheetTitle, { textAlign: isRtl ? "right" : "left" }]}>
                {isRtl ? "تذكرة دعم جديدة" : "New support ticket"}
              </Text>
              <Pressable onPress={() => setShowModal(false)} hitSlop={10}>
                <Text style={styles.closeBtn}>✕</Text>
              </Pressable>
            </View>

            {submitSuccess ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>
                  {isRtl ? "✓ تم إرسال طلبك بنجاح!" : "✓ Submitted successfully!"}
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.fieldLabel, { textAlign: isRtl ? "right" : "left" }]}>
                  {isRtl ? "الموضوع" : "Subject"}
                </Text>
                <TextInput
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder={isRtl ? "موضوع التذكرة..." : "Ticket subject..."}
                  placeholderTextColor="rgba(255,255,255,0.28)"
                  style={[styles.sheetInput, { textAlign: isRtl ? "right" : "left" }]}
                />

                <Text style={[styles.fieldLabel, { textAlign: isRtl ? "right" : "left" }]}>
                  {isRtl ? "التفاصيل" : "Details"}
                </Text>
                <TextInput
                  value={newDesc}
                  onChangeText={setNewDesc}
                  placeholder={isRtl ? "اشرح مشكلتك أو استفسارك..." : "Describe your issue..."}
                  placeholderTextColor="rgba(255,255,255,0.28)"
                  multiline
                  numberOfLines={5}
                  style={[styles.sheetInput, styles.sheetTextarea, { textAlign: isRtl ? "right" : "left" }]}
                />

                {submitError ? (
                  <Text style={[styles.errorText, { textAlign: isRtl ? "right" : "left" }]}>{submitError}</Text>
                ) : null}

                <View style={[styles.sheetActions, isRtl && { flexDirection: "row-reverse" }]}>
                  <Pressable
                    onPress={() => setShowModal(false)}
                    style={[styles.sheetBtn, styles.cancelBtn]}
                  >
                    <Text style={styles.cancelBtnText}>{isRtl ? "إلغاء" : "Cancel"}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => void submitTicket()}
                    disabled={submitting || !newTitle.trim() || !newDesc.trim()}
                    style={[
                      styles.sheetBtn,
                      styles.submitBtn,
                      (submitting || !newTitle.trim() || !newDesc.trim()) && styles.submitBtnDisabled,
                    ]}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.submitBtnText}>{isRtl ? "إرسال" : "Submit"}</Text>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0f1e" },
  filtersRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  chip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
  },
  chipActive: {
    borderColor: "rgba(59,130,246,0.50)",
    backgroundColor: "rgba(59,130,246,0.14)",
  },
  chipText: { color: "rgba(255,255,255,0.50)", fontWeight: "700", fontSize: 11 },
  chipTextActive: { color: "#3b82f6" },
  errorText: { color: "#f87171", paddingHorizontal: 16, marginVertical: 6, fontSize: 13 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  listPad: { padding: 16, paddingBottom: 100 },
  emptyState: { alignItems: "center", gap: 14 },
  emptyIcon: { fontSize: 52 },
  emptyText: { color: "rgba(255,255,255,0.40)", fontSize: 15 },
  card: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderLeftWidth: 3,
  },
  cardBorderLtr: { borderLeftWidth: 3 },
  cardBorderRtl: { borderLeftWidth: 1, borderRightWidth: 3 },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  typeTag: {
    backgroundColor: "rgba(99,102,241,0.14)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeTagText: { color: "#a5b4fc", fontSize: 12, fontWeight: "700" },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusTagText: { fontSize: 11, fontWeight: "800" },
  cardTitle: { color: "#f1f5f9", fontSize: 15, fontWeight: "700", marginBottom: 5 },
  cardDate: { color: "rgba(255,255,255,0.38)", fontSize: 12 },
  fab: {
    position: "absolute",
    bottom: 24,
    end: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 10,
  },
  fabPlus: { color: "#fff", fontSize: 30, lineHeight: 34, fontWeight: "300" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    gap: 14,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetTitle: { color: "#f1f5f9", fontSize: 18, fontWeight: "800" },
  closeBtn: { color: "rgba(255,255,255,0.45)", fontSize: 18, padding: 4 },
  fieldLabel: { color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: "600" },
  sheetInput: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#f1f5f9",
    fontSize: 14,
  },
  sheetTextarea: { height: 110, textAlignVertical: "top" },
  successBox: {
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.30)",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
  },
  successText: { color: "#22c55e", fontSize: 16, fontWeight: "700" },
  sheetActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  sheetBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  cancelBtnText: { color: "rgba(255,255,255,0.65)", fontWeight: "700" },
  submitBtn: {
    backgroundColor: "#3b82f6",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.40,
    shadowRadius: 8,
    elevation: 6,
  },
  submitBtnDisabled: { backgroundColor: "#1e293b", shadowOpacity: 0, elevation: 0 },
  submitBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
