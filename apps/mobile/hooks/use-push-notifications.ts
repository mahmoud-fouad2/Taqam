import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

import { useAuth } from "@/components/auth-provider";
import { apiFetch } from "@/lib/api";

// Show notifications as banner + badge when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  // Expo Go uses a project ID; standalone builds use the native token directly
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as any).manifest2?.extra?.expoClient?.extra?.eas?.projectId ??
    undefined;

  try {
    const tokenData = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch {
    return null;
  }
}

export function usePushNotifications() {
  const { accessToken } = useAuth();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!accessToken || registeredRef.current) return;

    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (!token) return;

      registeredRef.current = true;

      try {
        await apiFetch("/api/mobile/push-token", {
          token: accessToken,
          init: {
            method: "POST",
            body: JSON.stringify({ token }),
          },
        });
      } catch {
        // non-fatal — push will be retried next session
        registeredRef.current = false;
      }
    })();
  }, [accessToken]);
}
