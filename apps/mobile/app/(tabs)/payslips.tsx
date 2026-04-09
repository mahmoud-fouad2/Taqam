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
import { useRouter } from "expo-router";

import { useAuth } from "@/components/auth-provider";
import { useAppSettings } from "@/components/app-settings-provider";

const BRAND = "#3b82f6";

type PayslipSummary = {
  id: string;
  periodName: string;
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
  basicSalary: number;
  totalEarnings: number;
  totalDeductions: number;
  netSalary: number;
  currency: string;
  status: string;
};

function fmt(n: number, currency: string): string {
  return `${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export default function PayslipsScreen() {
  const { authFetch } = useAuth();
  const { language } = useAppSettings();
  const isRtl = language === "ar";

  const [payslips, setPayslips] = useState<PayslipSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchData = useCallback(async () => {
    try {
      const res = await authFetch<{ data: PayslipSummary[] }>(`/api/mobile/payslips?year=${year}`);
      setPayslips(res.data ?? []);
    } catch (e: any) {
      console.warn("Payslips fetch:", e?.message);
    }
  }, [authFetch, year]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

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
      contentContainerStyle={payslips.length === 0 ? styles.emptyContainer : styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND]} />}
    >
      {/* Year selector */}
      <View style={styles.yearRow}>
        <Pressable onPress={() => setYear(year - 1)} style={styles.yearBtn}>
          <Text style={styles.yearBtnText}>◀</Text>
        </Pressable>
        <Text style={styles.yearLabel}>{year}</Text>
        <Pressable
          onPress={() => year < new Date().getFullYear() ? setYear(year + 1) : null}
          style={[styles.yearBtn, year >= new Date().getFullYear() && { opacity: 0.3 }]}
        >
          <Text style={styles.yearBtnText}>▶</Text>
        </Pressable>
      </View>

      {payslips.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>💰</Text>
          <Text style={[styles.emptyText, isRtl && styles.rtl]}>
            {isRtl ? "لا توجد كشوف رواتب" : "No payslips found"}
          </Text>
        </View>
      ) : (
        payslips.map((p) => (
          <View key={p.id} style={styles.card}>
            <Text style={[styles.periodName, isRtl && styles.rtl]}>{p.periodName}</Text>
            <Text style={[styles.periodDates, isRtl && styles.rtl]}>
              {p.periodStart} → {p.periodEnd}
            </Text>

            <View style={styles.salaryGrid}>
              <View style={styles.salaryItem}>
                <Text style={styles.salaryLabel}>{isRtl ? "الأساسي" : "Basic"}</Text>
                <Text style={styles.salaryValue}>{fmt(p.basicSalary, p.currency)}</Text>
              </View>
              <View style={styles.salaryItem}>
                <Text style={styles.salaryLabel}>{isRtl ? "الاستحقاقات" : "Earnings"}</Text>
                <Text style={[styles.salaryValue, { color: "#16a34a" }]}>{fmt(p.totalEarnings, p.currency)}</Text>
              </View>
              <View style={styles.salaryItem}>
                <Text style={styles.salaryLabel}>{isRtl ? "الخصومات" : "Deductions"}</Text>
                <Text style={[styles.salaryValue, { color: "#dc2626" }]}>-{fmt(p.totalDeductions, p.currency)}</Text>
              </View>
            </View>

            <View style={styles.netRow}>
              <Text style={[styles.netLabel, isRtl && styles.rtl]}>
                {isRtl ? "الصافي" : "Net Salary"}
              </Text>
              <Text style={styles.netValue}>{fmt(p.netSalary, p.currency)}</Text>
            </View>

            {p.paymentDate && (
              <Text style={[styles.payDate, isRtl && styles.rtl]}>
                {isRtl ? `تاريخ الدفع: ${p.paymentDate}` : `Payment: ${p.paymentDate}`}
              </Text>
            )}
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
  emptyContainer: { flex: 1 },
  emptyBox: { alignItems: "center", gap: 12, marginTop: 80 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, color: "#94a3b8", fontWeight: "600" },
  rtl: { textAlign: "right", writingDirection: "rtl" },

  yearRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 12, marginTop: 8 },
  yearBtn: { padding: 8, borderRadius: 8, backgroundColor: "#e2e8f0" },
  yearBtnText: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  yearLabel: { fontSize: 20, fontWeight: "900", color: "#0f172a" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 10,
  },
  periodName: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  periodDates: { fontSize: 12, color: "#64748b" },

  salaryGrid: { flexDirection: "row", gap: 8, marginTop: 4 },
  salaryItem: { flex: 1, gap: 2 },
  salaryLabel: { fontSize: 11, color: "#94a3b8", fontWeight: "600" },
  salaryValue: { fontSize: 13, fontWeight: "700", color: "#0f172a" },

  netRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(59,130,246,0.06)",
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  netLabel: { fontSize: 14, fontWeight: "700", color: "#334155" },
  netValue: { fontSize: 18, fontWeight: "900", color: BRAND },

  payDate: { fontSize: 11, color: "#94a3b8", fontWeight: "600" },
});
