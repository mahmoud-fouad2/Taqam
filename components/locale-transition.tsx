"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/logo-mark";

const EVENT_NAME = "taqam:locale-transition";

export function startLocaleTransition(onCovered?: () => void) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<{ onCovered?: () => void }>(EVENT_NAME, {
      detail: { onCovered }
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
      className={[
        "pointer-events-none fixed inset-0 z-[9999]",
        "bg-primary",
        "will-change-transform",
        "transition-transform duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
        phase === "idle"
          ? "translate-x-full"
          : phase === "in"
            ? "translate-x-0"
            : "-translate-x-full"
      ].join(" ")}>
      {/* Logo centered on the curtain — fades in once fully covering */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          "transition-all duration-200 ease-out",
          phase === "in" ? "scale-100 opacity-100" : "scale-90 opacity-0"
        )}>
        <div className="flex flex-col items-center gap-4 text-white">
          <LogoMark
            frameClassName="size-24 rounded-[28px] border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-sm"
            imageClassName="h-11 w-auto max-w-none"
          />
          <div className="text-center">
            <div className="text-lg font-semibold tracking-tight">Taqam</div>
            <div className="text-white/70 text-sm">طاقم</div>
          </div>
        </div>
      </div>
    </div>
  );
}
