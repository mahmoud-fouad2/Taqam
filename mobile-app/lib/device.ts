import * as Device from "expo-device";
import { Platform } from "react-native";

import { getAppVersion } from "./config";
import { getSecureItem, setSecureItem } from "./storage";

const DEVICE_ID_KEY = "taqam_device_id";

function createPseudoUuid(): string {
  // Good enough for deviceId uniqueness; server only checks length.
  const rand = () => Math.random().toString(16).slice(2);
  return `${rand()}${rand()}${Date.now().toString(16)}`;
}

export async function getDeviceId(): Promise<string> {
  const existing = await getSecureItem(DEVICE_ID_KEY);
  if (existing && existing.length >= 8) return existing;

  const next = createPseudoUuid();
  await setSecureItem(DEVICE_ID_KEY, next);
  return next;
}

export async function getMobileDeviceHeaders(): Promise<Record<string, string>> {
  const deviceId = await getDeviceId();

  return {
    "x-device-id": deviceId,
    "x-device-platform": Platform.OS,
    "x-device-name": Device.modelName || Device.deviceName || "unknown",
    "x-app-version": getAppVersion(),
  };
}
