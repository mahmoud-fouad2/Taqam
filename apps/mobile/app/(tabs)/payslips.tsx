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
  const { colors, radius, spacing } = useTheme();
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

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.md, gap: 12, paddingTop: 40 }}>
        <SkeletonCard style={{ height: 100 }} />
        <SkeletonCard style={{ height: 100 }} />
        <SkeletonCard style={{ height: 100 }} />
      </View>
    );
  }

  const rtl = isRtl ? { textAlign: "right" as const, writingDirection: "rtl" as const } : {};

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={payslips.length === 0
        ? { flex: 1 }
        : { padding: spacing.md, paddingBottom: 40, gap: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
    >
      {/* Year selector */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 12, marginTop: 8 }}>
        <Pressable onPress={() => setYear(year - 1)} style={{ padding: 8, borderRadius: 8, backgroundColor: colors.border }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>◀</Text>
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "900", color: colors.text }}>{year}</Text>
        <Pressable
          onPress={() => year < new Date().getFullYear() ? setYear(year + 1) : null}
          style={{ padding: 8, borderRadius: 8, backgroundColor: colors.border, opacity: year >= new Date().getFullYear() ? 0.3 : 1 }}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>▶</Text>
        </Pressable>
      </View>

      {payslips.length === 0 ? (
        <View style={{ alignItems: "center", gap: 12, marginTop: 80 }}>
          <Text style={{ fontSize: 48 }}>💰</Text>
          <Text style={{ fontSize: 16, color: colors.textMuted, fontWeight: "600" }}>
            {isRtl ? "لا توجد كشوف رواتب" : "No payslips found"}
          </Text>
        </View>
      ) : (
        payslips.map((p) => (
          <View
            key={p.id}
            style={{ backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 8 }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, ...rtl }}>{p.periodName}</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, ...rtl }}>
              {p.periodStart} → {p.periodEnd}
            </Text>

            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
              <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: radius.md, padding: 8, alignItems: "center" }}>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>{isRtl ? "الأساسي" : "Basic"}</Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>{fmt(p.basicSalary, p.currency)}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: radius.md, padding: 8, alignItems: "center" }}>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>{isRtl ? "الاستحقاقات" : "Earnings"}</Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#16a34a" }}>{fmt(p.totalEarnings, p.currency)}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: radius.md, padding: 8, alignItems: "center" }}>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>{isRtl ? "الخصومات" : "Deductions"}</Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#dc2626" }}>-{fmt(p.totalDeductions, p.currency)}</Text>
              </View>
            </View>

            <View style={{ flexDirection: isRtl ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4 }}>
              <Text style={{ fontSize: 13, color: colors.textSecondary, ...rtl }}>{isRtl ? "الصافي" : "Net Salary"}</Text>
              <Text style={{ fontSize: 18, fontWeight: "900", color: colors.primary }}>{fmt(p.netSalary, p.currency)}</Text>
            </View>

            {p.paymentDate && (
              <Text style={{ fontSize: 11, color: colors.textMuted, ...rtl }}>
                {isRtl ? `تاريخ الدفع: ${p.paymentDate}` : `Payment: ${p.paymentDate}`}
              </Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}
