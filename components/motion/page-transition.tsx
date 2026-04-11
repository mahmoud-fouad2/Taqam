"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function PageTransition({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  const distance = reduceMotion ? 0 : 10;
  const duration = reduceMotion ? 0 : 0.18;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        className={cn("will-change-transform", className)}
        initial={{ opacity: 0, y: distance }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -distance }}
        transition={{
          duration,
          ease: [0.22, 1, 0.36, 1]
        }}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
