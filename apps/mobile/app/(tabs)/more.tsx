import { Pressable, ScrollView, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

import { useAuth } from "@/components/auth-provider";
import { useAppSettings } from "@/components/app-settings-provider";
import { useTheme } from "@/theme";

type MenuItem = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
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
    { icon: "wallet-outline", labelAr: "كشوف الرواتب", labelEn: "Payslips", route: "/(tabs)/payslips" },
    { icon: "checkmark-circle-outline", labelAr: "الموافقات", labelEn: "Approvals", route: "/(tabs)/approvals", roles: ["TENANT_ADMIN", "HR_MANAGER", "MANAGER"] },
    { icon: "notifications-outline", labelAr: "الإشعارات", labelEn: "Notifications", route: "/(tabs)/notifications" },
    { icon: "person-circle-outline", labelAr: "الملف الشخصي", labelEn: "Profile", route: "/(tabs)/profile" },
    { icon: "settings-outline", labelAr: "الإعدادات", labelEn: "Settings", route: "/(tabs)/settings" },
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
      <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 16, textAlign: isRtl ? "right" : "left" }}>
        {isRtl ? "وصول أسرع للمهام والحساب والإعدادات" : "Quick access to work tools, profile, and settings"}
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
              alignItems: isRtl ? "flex-end" : "flex-start",
              gap: 10,
              opacity: pressed ? 0.75 : 1,
              transform: pressed ? [{ scale: 0.97 }] : [],
            })}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: colors.primaryLight,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name={item.icon} size={24} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, textAlign: isRtl ? "right" : "left", alignSelf: "stretch" }}>
              {isRtl ? item.labelAr : item.labelEn}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
