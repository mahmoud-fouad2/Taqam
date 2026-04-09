import { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from "react-native";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { useAppSettings } from "@/components/app-settings-provider";
import { useTheme } from "@/theme";
import { setOnboardingDone } from "@/lib/settings-storage";

const { width: SCREEN_W } = Dimensions.get("window");

type Slide = {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
};

const slides: Slide[] = [
  {
    icon: "clock-o",
    titleAr: "حضور ذكي",
    titleEn: "Smart Attendance",
    descAr: "سجّل حضورك وانصرافك بنقرة واحدة مع تحقق الموقع والبصمة",
    descEn: "Clock in & out with one tap using location and biometric verification",
  },
  {
    icon: "calendar-check-o",
    titleAr: "إجازاتك بين يديك",
    titleEn: "Leave Management",
    descAr: "تقدّم بطلبات الإجازة وتابع أرصدتك واعتمادات مديرك فوراً",
    descEn: "Request leaves, track balances, and get instant manager approvals",
  },
  {
    icon: "money",
    titleAr: "رواتبك واضحة",
    titleEn: "Payslip Details",
    descAr: "اطلع على تفاصيل راتبك الشهري والمستقطعات وصافي الراتب",
    descEn: "View monthly salary breakdown, deductions, and net pay",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { language } = useAppSettings();
  const { colors, spacing, radius } = useTheme();
  const isRtl = language === "ar";

  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

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
      {/* Skip */}
      <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: spacing.md, paddingTop: 50 }}>
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
          <View style={{ width: SCREEN_W, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}>
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: colors.primaryLight,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 32,
              }}
            >
              <FontAwesome name={item.icon} size={48} color={colors.primary} />
            </View>
            <Text style={{ color: colors.text, fontSize: 26, fontWeight: "900", textAlign: "center", marginBottom: 16 }}>
              {isRtl ? item.titleAr : item.titleEn}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 16, lineHeight: 26, textAlign: "center" }}>
              {isRtl ? item.descAr : item.descEn}
            </Text>
          </View>
        )}
      />

      {/* Dots + button */}
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: 50 }}>
        {/* Dots */}
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

        {/* Next / Get Started button */}
        <Pressable
          onPress={goNext}
          style={{
            backgroundColor: colors.primary,
            borderRadius: radius.lg,
            paddingVertical: 16,
            alignItems: "center",
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
        </Pressable>
      </View>
    </View>
  );
}
