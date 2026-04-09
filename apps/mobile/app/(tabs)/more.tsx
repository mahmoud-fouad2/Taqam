import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useAuth } from "@/components/auth-provider";
import { useAppSettings } from "@/components/app-settings-provider";

const BRAND = "#3b82f6";

type MenuItem = {
  icon: string;
  labelAr: string;
  labelEn: string;
  route: string;
  roles?: string[];
  badge?: number;
};

export default function MoreScreen() {
  const { user } = useAuth();
  const { language } = useAppSettings();
  const router = useRouter();
  const isRtl = language === "ar";
  const role = user?.role ?? "EMPLOYEE";

  const items: MenuItem[] = [
    { icon: "💰", labelAr: "كشوف الرواتب", labelEn: "Payslips", route: "/(tabs)/payslips" },
    { icon: "✅", labelAr: "الموافقات", labelEn: "Approvals", route: "/(tabs)/approvals", roles: ["TENANT_ADMIN", "HR_MANAGER", "MANAGER"] },
    { icon: "🔔", labelAr: "الإشعارات", labelEn: "Notifications", route: "/(tabs)/notifications" },
    { icon: "👤", labelAr: "الملف الشخصي", labelEn: "Profile", route: "/(tabs)/profile" },
    { icon: "⚙️", labelAr: "الإعدادات", labelEn: "Settings", route: "/(tabs)/settings" },
  ];

  const visible = items.filter((it) => !it.roles || it.roles.includes(role));

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={[styles.title, isRtl && styles.rtl]}>
        {isRtl ? "المزيد" : "More"}
      </Text>

      <View style={styles.grid}>
        {visible.map((item) => (
          <Pressable
            key={item.route}
            onPress={() => router.push(item.route as any)}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] }]}
          >
            <Text style={styles.cardIcon}>{item.icon}</Text>
            <Text style={[styles.cardLabel, isRtl && styles.rtl]}>
              {isRtl ? item.labelAr : item.labelEn}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 40 },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  title: { fontSize: 24, fontWeight: "800", color: "#0f172a", marginBottom: 20, marginTop: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    gap: 10,
  },
  cardIcon: { fontSize: 32 },
  cardLabel: { fontSize: 14, fontWeight: "700", color: "#0f172a", textAlign: "center" },
});
