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
      // Give the overlay enough time to cover before navigation starts.
      if (cb) {
        timerRef.current = setTimeout(cb, 180);
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
      className={cn(
        "pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-200 ease-out",
        phase === "idle" ? "opacity-0" : "opacity-100"
      )}>
      <div className="absolute inset-0 bg-slate-950/12 backdrop-blur-[2px] dark:bg-slate-950/35" />

      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div
          className={cn(
            "border-border/60 bg-background/95 w-full max-w-xs rounded-[2rem] border px-6 py-5 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl",
            "transition-all duration-200 ease-out",
            phase === "in" && "translate-y-0 scale-100 opacity-100",
            phase === "out" && "-translate-y-1 scale-[1.02] opacity-0",
            phase === "idle" && "translate-y-2 scale-95 opacity-0"
          )}>
          <div className="flex items-center gap-4">
            <LogoMark
              frameClassName="size-14 rounded-[1.25rem] border border-border/70 bg-background p-2 shadow-sm"
              imageClassName="h-7 w-auto max-w-none"
            />
            <div className="min-w-0">
              <div className="text-foreground text-sm font-semibold tracking-tight">
                Switching language
              </div>
              <div className="text-muted-foreground text-sm">جاري تبديل اللغة</div>
            </div>
          </div>

          <div className="mt-4 flex gap-1.5">
            <span className="bg-primary/65 h-1.5 w-6 animate-pulse rounded-full [animation-delay:0ms]" />
            <span className="bg-primary/45 h-1.5 w-6 animate-pulse rounded-full [animation-delay:120ms]" />
            <span className="bg-primary/25 h-1.5 w-6 animate-pulse rounded-full [animation-delay:240ms]" />
          </div>
        </div>
      </div>
    </div>
  );
}
