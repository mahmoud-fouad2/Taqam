import type { LeaveCategory } from "@/lib/types/leave";
import { leaveTypeColors } from "@/lib/types/leave";

export type LeaveColorTheme = {
  border: string;
  dot: string;
  bg: string;
  text: string;
  progress: string;
};

const themesByCategory: Record<LeaveCategory, LeaveColorTheme> = {
  annual: {
    border: "border-blue-500",
    dot: "bg-blue-500",
    bg: "bg-blue-500",
    text: "text-blue-600",
    progress: "bg-blue-500/20 [&_[data-slot=progress-indicator]]:bg-blue-500"
  },
  sick: {
    border: "border-red-500",
    dot: "bg-red-500",
    bg: "bg-red-500",
    text: "text-red-600",
    progress: "bg-red-500/20 [&_[data-slot=progress-indicator]]:bg-red-500"
  },
  unpaid: {
    border: "border-gray-500",
    dot: "bg-gray-500",
    bg: "bg-gray-500",
    text: "text-gray-700",
    progress: "bg-gray-500/20 [&_[data-slot=progress-indicator]]:bg-gray-500"
  },
  maternity: {
    border: "border-pink-500",
    dot: "bg-pink-500",
    bg: "bg-pink-500",
    text: "text-pink-600",
    progress: "bg-pink-500/20 [&_[data-slot=progress-indicator]]:bg-pink-500"
  },
  paternity: {
    border: "border-violet-500",
    dot: "bg-violet-500",
    bg: "bg-violet-500",
    text: "text-violet-600",
    progress: "bg-violet-500/20 [&_[data-slot=progress-indicator]]:bg-violet-500"
  },
  marriage: {
    border: "border-amber-500",
    dot: "bg-amber-500",
    bg: "bg-amber-500",
    text: "text-amber-600",
    progress: "bg-amber-500/20 [&_[data-slot=progress-indicator]]:bg-amber-500"
  },
  bereavement: {
    border: "border-gray-800",
    dot: "bg-gray-800",
    bg: "bg-gray-800",
    text: "text-gray-800",
    progress: "bg-gray-800/20 [&_[data-slot=progress-indicator]]:bg-gray-800"
  },
  hajj: {
    border: "border-emerald-500",
    dot: "bg-emerald-500",
    bg: "bg-emerald-500",
    text: "text-emerald-600",
    progress: "bg-emerald-500/20 [&_[data-slot=progress-indicator]]:bg-emerald-500"
  },
  study: {
    border: "border-cyan-500",
    dot: "bg-cyan-500",
    bg: "bg-cyan-500",
    text: "text-cyan-600",
    progress: "bg-cyan-500/20 [&_[data-slot=progress-indicator]]:bg-cyan-500"
  },
  emergency: {
    border: "border-orange-500",
    dot: "bg-orange-500",
    bg: "bg-orange-500",
    text: "text-orange-600",
    progress: "bg-orange-500/20 [&_[data-slot=progress-indicator]]:bg-orange-500"
  },
  compensatory: {
    border: "border-lime-500",
    dot: "bg-lime-500",
    bg: "bg-lime-500",
    text: "text-lime-600",
    progress: "bg-lime-500/20 [&_[data-slot=progress-indicator]]:bg-lime-500"
  },
  other: {
    border: "border-indigo-500",
    dot: "bg-indigo-500",
    bg: "bg-indigo-500",
    text: "text-indigo-600",
    progress: "bg-indigo-500/20 [&_[data-slot=progress-indicator]]:bg-indigo-500"
  }
};

function toCategoryFromHex(color?: string | null): LeaveCategory {
  const normalized = (color || "").toLowerCase();
  const entry = (Object.entries(leaveTypeColors) as Array<[LeaveCategory, string]>).find(
    ([, hex]) => hex.toLowerCase() === normalized
  );
  return (entry?.[0] ?? "annual") as LeaveCategory;
}

/**
 * Maps a hex color (from API/UI) to a Tailwind class theme using the known leave palette.
 * Falls back to `annual` when unknown.
 */
export function getLeaveTheme(color?: string | null): LeaveColorTheme {
  return themesByCategory[toCategoryFromHex(color)];
}
