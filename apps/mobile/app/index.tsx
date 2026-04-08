import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";

import { useAuth } from "@/components/auth-provider";
import { BrandLogo } from "@/components/brand-logo";

export default function Index() {
  const { loading, accessToken } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" }}>
        <BrandLogo style={{ marginBottom: 24 }} />
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (accessToken) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
