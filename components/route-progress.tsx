"use client";

import * as React from "react";
import { useReducedMotion } from "framer-motion";
import { usePathname, useSearchParams } from "next/navigation";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();

  const [active, setActive] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const barRef = React.useRef<HTMLDivElement | null>(null);

  const lastKeyRef = React.useRef<string>("");
  const startTimerRef = React.useRef<number | null>(null);
  const incTimerRef = React.useRef<number | null>(null);

  const key = React.useMemo(() => {
    const q = searchParams?.toString();
    return `${pathname}${q ? `?${q}` : ""}`;
  }, [pathname, searchParams]);

  React.useEffect(() => {
    if (!barRef.current) return;
    barRef.current.style.width = `${progress}%`;
  }, [progress]);

  React.useEffect(() => {
    if (!key) return;

    if (reduceMotion) {
      setActive(false);
      setProgress(0);
      lastKeyRef.current = key;
      return;
    }

    if (startTimerRef.current) window.clearTimeout(startTimerRef.current);
    startTimerRef.current = null;
    if (incTimerRef.current) window.clearInterval(incTimerRef.current);
    incTimerRef.current = null;

    // If the URL changes, ensure we finish any in-flight progress quickly.
    if (lastKeyRef.current && lastKeyRef.current !== key) {
      setProgress(100);
      setTimeout(() => {
        setActive(false);
        setProgress(0);
      }, 180);
    }

    lastKeyRef.current = key;

    // Start a short, subtle progress bar after a tiny delay to avoid flashes on instant transitions.
    const startTimer = window.setTimeout(() => {
      setActive(true);
      setProgress(12);

      incTimerRef.current = window.setInterval(() => {
        setProgress((p) => {
          // Ease to ~90% until navigation settles.
          const next = p + (100 - p) * 0.08;
          return clamp(next, 12, 90);
        });
      }, 120);
    }, 120);

    startTimerRef.current = startTimer;

    return () => {
      if (startTimerRef.current) window.clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
      if (incTimerRef.current) window.clearInterval(incTimerRef.current);
      incTimerRef.current = null;
    };
  }, [key, reduceMotion]);

  // Rendered always; hidden when inactive.
  return (
    <div
      aria-hidden
      className={
        "pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden transition-opacity duration-200 motion-reduce:transition-none " +
        (active ? "opacity-100" : "opacity-0")
      }>
      <div
        className="from-primary h-full bg-gradient-to-r via-blue-500 to-purple-500 transition-[width] duration-200 ease-out motion-reduce:transition-none"
        ref={barRef}
      />
    </div>
  );
}
