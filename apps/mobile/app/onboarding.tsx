import { useCallback, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useAppSettings } from "@/components/app-settings-provider";
import { useTheme } from "@/theme";
import { setOnboardingDone } from "@/lib/settings-storage";

const { width: SCREEN_W } = Dimensions.get("window");

type Slide = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  accent: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  chipAr: string;
  chipEn: string;
};

const slides: Slide[] = [
  {
    icon: "finger-print-outline",
    accent: "#dbeafe",
    titleAr: "حضور ذكي",
    titleEn: "Smart Attendance",
    descAr: "سجّل حضورك وانصرافك بنقرة واحدة مع تحقق الموقع والبصمة",
    descEn: "Clock in & out with one tap using location and biometric verification",
    chipAr: "بصمة + موقع",
    chipEn: "Biometric + location",
  },
  {
    icon: "calendar-clear-outline",
    accent: "#dcfce7",
    titleAr: "إجازاتك بين يديك",
    titleEn: "Leave Management",
    descAr: "تقدّم بطلبات الإجازة وتابع أرصدتك واعتمادات مديرك فوراً",
    descEn: "Request leaves, track balances, and get instant manager approvals",
    chipAr: "طلبات وموافقات",
    chipEn: "Requests & approvals",
  },
  {
    icon: "wallet-outline",
    accent: "#fef3c7",
    titleAr: "رواتبك واضحة",
    titleEn: "Payslip Details",
    descAr: "اطلع على تفاصيل راتبك الشهري والمستقطعات وصافي الراتب",
    descEn: "View monthly salary breakdown, deductions, and net pay",
    chipAr: "مسيرات ورواتب",
    chipEn: "Payroll & payslips",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { language } = useAppSettings();
  const { colors, spacing, radius } = useTheme();
  const isRtl = language === "ar";

  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useMemo(() => ({ viewAreaCoveragePercentThreshold: 50 }), []);

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      void setOnboardingDone();
      router.replace("/(auth)");
    }
  };

  const skip = () => {
    void setOnboardingDone();
    router.replace("/(auth)");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.md, paddingTop: 50, paddingBottom: 8 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>
          {isRtl ? "طاقم موبايل" : "Taqam Mobile"}
        </Text>
        <Pressable onPress={skip}>
          <Text style={{ color: colors.textSecondary, fontWeight: "700", fontSize: 14 }}>
            {isRtl ? "تخطي" : "Skip"}
          </Text>
        </Pressable>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_W, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
            <View
              style={{
                width: "100%",
                maxWidth: 360,
                borderRadius: 32,
                backgroundColor: colors.surface,
                padding: 24,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: "#000",
                shadowOpacity: 0.06,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 8 },
                elevation: 4,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: isRtl ? "flex-end" : "flex-start", marginBottom: 18 }}>
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: item.accent,
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 12, fontWeight: "800" }}>
                    {isRtl ? item.chipAr : item.chipEn}
                  </Text>
                </View>
              </View>
              <View
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 28,
                  backgroundColor: colors.primaryLight,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                  alignSelf: isRtl ? "flex-end" : "flex-start",
                }}
              >
                <Ionicons name={item.icon} size={34} color={colors.primary} />
              </View>
              <Text style={{ color: colors.text, fontSize: 28, fontWeight: "900", textAlign: isRtl ? "right" : "left", marginBottom: 12 }}>
                {isRtl ? item.titleAr : item.titleEn}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 16, lineHeight: 26, textAlign: isRtl ? "right" : "left" }}>
                {isRtl ? item.descAr : item.descEn}
              </Text>
            </View>
          </View>
        )}
      />

      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: 50 }}>
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 24 }}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={{
                width: currentIndex === i ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: currentIndex === i ? colors.primary : colors.border,
              }}
            />
          ))}
        </View>

        <Pressable
          onPress={goNext}
          style={{
            backgroundColor: colors.primary,
            borderRadius: radius.lg,
            paddingVertical: 16,
            alignItems: "center",
            flexDirection: isRtl ? "row-reverse" : "row",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>
            {currentIndex === slides.length - 1
              ? isRtl
                ? "ابدأ الآن"
                : "Get Started"
              : isRtl
                ? "التالي"
                : "Next"}
          </Text>
          <Ionicons
            name={currentIndex === slides.length - 1 ? (isRtl ? "rocket-outline" : "rocket-outline") : isRtl ? "arrow-back-outline" : "arrow-forward-outline"}
            size={18}
            color="#fff"
          />
        </Pressable>
      </View>
    </View>
  );
}
