export function formatTimeHHMM(date: Date, locale: "ar" | "en" = "ar") {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(date);
  } catch {
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  }
}

export function formatShortDate(date: Date, locale: "ar" | "en" = "ar") {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  } catch {
    return date.toISOString().split("T")[0];
  }
}

export function formatArabicDate(date: Date, locale: "ar" | "en" = "ar") {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  } catch {
    return date.toISOString().split("T")[0];
  }
}

export function formatDayName(date: Date, locale: "ar" | "en" = "ar") {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", { weekday: "long" }).format(
      date
    );
  } catch {
    return "";
  }
}

export function greeting(locale: "ar" | "en", now = new Date()) {
  const h = now.getHours();
  if (locale === "en") {
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }
  if (h < 12) return "صباح الخير";
  return "مساء الخير";
}

export function getInitials(first?: string | null, last?: string | null) {
  const f = (first || "").trim().charAt(0);
  const l = (last || "").trim().charAt(0);
  return (f + l).toUpperCase() || "U";
}

export async function getCurrentPositionSafe(opts?: {
  timeoutMs?: number;
  highAccuracy?: boolean;
}) {
  const timeoutMs = opts?.timeoutMs ?? 8000;
  const enableHighAccuracy = opts?.highAccuracy ?? true;

  if (typeof navigator === "undefined" || !("geolocation" in navigator)) return null;

  return await new Promise<{ latitude: number; longitude: number; accuracy?: number } | null>(
    (resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          }),
        () => resolve(null),
        { enableHighAccuracy, timeout: timeoutMs }
      );
    }
  );
}
