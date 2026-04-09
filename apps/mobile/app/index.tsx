import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";

import { useAuth } from "@/components/auth-provider";
import { BrandLogo } from "@/components/brand-logo";
import { getOnboardingDone } from "@/lib/settings-storage";
import { useTheme } from "@/theme";

export default function Index() {
  const { loading, accessToken } = useAuth();
  const { colors } = useTheme();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    getOnboardingDone().then((done) => {
      setOnboardingDone(done);
      setOnboardingChecked(true);
    });
  }, []);

  if (loading || !onboardingChecked) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <BrandLogo style={{ marginBottom: 24 }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!onboardingDone) {
    return <Redirect href="/onboarding" />;
  }

  if (accessToken) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
