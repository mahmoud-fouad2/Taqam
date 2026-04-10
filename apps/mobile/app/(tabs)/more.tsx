import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useAuth } from "@/components/auth-provider";
import { useAppSettings } from "@/components/app-settings-provider";
import { useTheme } from "@/theme";

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
  const { colors, spacing, radius } = useTheme();
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
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
    >
      <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: 20, marginTop: 8, textAlign: isRtl ? "right" : "left" }}>
        {isRtl ? "المزيد" : "More"}
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {visible.map((item) => (
          <Pressable
            key={item.route}
            onPress={() => router.push(item.route as any)}
            style={({ pressed }) => ({
              width: "47%",
              backgroundColor: colors.surface,
              borderRadius: radius.xl,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              gap: 10,
              opacity: pressed ? 0.75 : 1,
              transform: pressed ? [{ scale: 0.97 }] : [],
            })}
          >
            <Text style={{ fontSize: 32 }}>{item.icon}</Text>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, textAlign: "center" }}>
              {isRtl ? item.labelAr : item.labelEn}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
