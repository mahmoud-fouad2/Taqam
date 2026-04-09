"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const EVENT_NAME = "taqam:locale-transition";

export function startLocaleTransition(onCovered?: () => void) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<{ onCovered?: () => void }>(EVENT_NAME, {
      detail: { onCovered },
    })
  );
}

type Phase = "idle" | "in" | "out";

export function LocaleTransitionOverlay() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const prevPath = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const cb = (e as CustomEvent<{ onCovered?: () => void }>).detail?.onCovered;
      clearTimer();
      setPhase("in");
      // After the slide-in animation completes, trigger navigation
      if (cb) {
        timerRef.current = setTimeout(cb, 280);
      }
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      clearTimer();
    };
  }, []);

  // When pathname changes while panel is covering → slide out
  useEffect(() => {
    if (phase !== "in") {
      prevPath.current = pathname;
      return;
    }
    if (pathname !== prevPath.current) {
      prevPath.current = pathname;
      clearTimer();
      timerRef.current = setTimeout(() => {
        setPhase("out");
        timerRef.current = setTimeout(() => setPhase("idle"), 300);
      }, 0);
    }
  }, [pathname, phase]);

  return (
    <div
      aria-hidden="true"
      style={{ willChange: "transform" }}
      className={[
        "pointer-events-none fixed inset-0 z-[9999]",
        "bg-primary",
        "transition-transform duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
        phase === "idle"
          ? "translate-x-full"
          : phase === "in"
            ? "translate-x-0"
            : "-translate-x-full",
      ].join(" ")}
    >
      {/* Logo centered on the curtain — fades in once fully covering */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          "transition-all duration-200 ease-out",
          phase === "in" ? "opacity-100 scale-100" : "opacity-0 scale-90",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-dark.png"
          alt="Taqam"
          style={{ height: 72, width: "auto", filter: "brightness(0) invert(1)" }}
        />
      </div>
    </div>
  );
}
