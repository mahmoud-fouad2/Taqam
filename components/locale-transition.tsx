"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const EVENT_NAME = "taqam:locale-transition";

export function startLocaleTransition() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function LocaleTransitionOverlay() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => {
    const onStart = () => setActive(true);
    window.addEventListener(EVENT_NAME, onStart);
    return () => window.removeEventListener(EVENT_NAME, onStart);
  }, []);

  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => setActive(false), 260);
    return () => window.clearTimeout(t);
  }, [pathname, active]);

  return (
    <div
      aria-hidden="true"
      className={
        "pointer-events-none fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm " +
        "transition-opacity duration-200 " +
        (active ? "opacity-100" : "opacity-0")
      }
    />
  );
}
