import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import * as Network from "expo-network";

import { useLocale } from "@/components/locale-provider";

export function OfflineBanner() {
  const { lang } = useLocale();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check initial state
    Network.getNetworkStateAsync().then((state) => {
      setIsOffline(state.isInternetReachable === false);
    });

    // Listen for changes
    const sub = Network.addNetworkStateListener((state) => {
      setIsOffline(state.isInternetReachable === false);
    });

    return () => sub.remove();
  }, []);

  if (!isOffline) return null;

  const message =
    lang === "ar" ? "لا يوجد اتصال بالإنترنت" : "No internet connection";

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: "#ef4444",
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  text: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
