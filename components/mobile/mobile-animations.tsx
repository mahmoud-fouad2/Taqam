"use client";

import { motion } from "framer-motion";

/* ── Stagger container ── */
export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 }
  }
};

/* ── Fade-up item ── */
export const fadeUpItem = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const }
  }
};

/* ── Scale-in (for cards) ── */
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }
  }
};

type WrapperProps = {
  children: React.ReactNode;
  className?: string;
  dir?: "rtl" | "ltr";
};

/* ── Animated page wrapper ── */
export function AnimatedPage({ children, className, dir }: WrapperProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className={className}
      dir={dir}>
      {children}
    </motion.div>
  );
}

/* ── Animated item ── */
export function AnimatedItem({ children, className }: WrapperProps) {
  return (
    <motion.div variants={fadeUpItem} className={className}>
      {children}
    </motion.div>
  );
}

/* ── Animated card ── */
export function AnimatedCard({ children, className }: WrapperProps) {
  return (
    <motion.div variants={scaleIn} className={className}>
      {children}
    </motion.div>
  );
}
