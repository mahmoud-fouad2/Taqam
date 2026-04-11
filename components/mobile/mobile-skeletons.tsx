"use client";

/* ── Skeleton primitives for mobile loading states ── */

export function SkeletonPulse({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />;
}

export function SkeletonCircle({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-slate-100 ${className}`} />;
}

/* ── Home page skeleton ── */
export function HomeSkeleton() {
  return (
    <div className="space-y-5 pb-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between py-2">
        <SkeletonPulse className="h-4 w-28" />
        <div className="flex items-center gap-2.5">
          <SkeletonPulse className="size-10 !rounded-2xl" />
          <SkeletonCircle className="size-10" />
        </div>
      </div>

      {/* Greeting */}
      <div className="space-y-2 pt-1">
        <SkeletonPulse className="h-6 w-48" />
        <SkeletonPulse className="h-4 w-20" />
      </div>

      {/* Attendance Card */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-5">
        <SkeletonPulse className="mb-4 h-6 w-24 !bg-white/10" />
        <SkeletonPulse className="mb-5 h-12 w-32 !bg-white/10" />
        <div className="mb-5 grid grid-cols-2 gap-3">
          <SkeletonPulse className="h-16 !bg-white/5" />
          <SkeletonPulse className="h-16 !bg-white/5" />
        </div>
        <SkeletonPulse className="h-12 !bg-white/10" />
      </div>

      {/* Quick Actions */}
      <div>
        <SkeletonPulse className="mb-3 h-5 w-24" />
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 ring-1 ring-slate-100">
              <SkeletonPulse className="size-10 !rounded-xl" />
              <SkeletonPulse className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Attendance page skeleton ── */
export function AttendanceSkeleton() {
  return (
    <div className="space-y-4 pb-4" dir="rtl">
      <div className="flex items-center gap-3 pt-3">
        <SkeletonPulse className="size-9 !rounded-xl" />
        <div className="space-y-1.5">
          <SkeletonPulse className="h-5 w-24" />
          <SkeletonPulse className="h-3 w-14" />
        </div>
      </div>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
          <div className="mb-3 flex items-center justify-between">
            <SkeletonPulse className="h-4 w-28" />
            <SkeletonPulse className="h-5 w-14 !rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SkeletonPulse className="h-12" />
            <SkeletonPulse className="h-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Requests page skeleton ── */
export function RequestsSkeleton() {
  return (
    <div className="space-y-4 pb-4" dir="rtl">
      <div className="flex items-center justify-between pt-3">
        <div className="flex items-center gap-3">
          <SkeletonPulse className="size-9 !rounded-xl" />
          <div className="space-y-1.5">
            <SkeletonPulse className="h-5 w-20" />
            <SkeletonPulse className="h-3 w-12" />
          </div>
        </div>
        <SkeletonPulse className="h-9 w-24 !rounded-xl" />
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
          <div className="flex items-start gap-3">
            <SkeletonPulse className="size-10 shrink-0 !rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <SkeletonPulse className="h-4 w-3/4" />
              <SkeletonPulse className="h-3 w-16" />
            </div>
            <SkeletonPulse className="h-5 w-16 !rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Profile page skeleton ── */
export function ProfileSkeleton() {
  return (
    <div className="space-y-5 pb-4" dir="rtl">
      <div className="flex items-center gap-3 pt-3">
        <SkeletonPulse className="size-9 !rounded-xl" />
        <SkeletonPulse className="h-5 w-28" />
      </div>
      <div className="flex flex-col items-center rounded-3xl bg-white p-6 ring-1 ring-slate-100">
        <SkeletonCircle className="size-24" />
        <SkeletonPulse className="mt-4 h-5 w-32" />
        <SkeletonPulse className="mt-2 h-4 w-40" />
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-100">
          <SkeletonCircle className="size-[18px]" />
          <div className="flex-1 space-y-1.5">
            <SkeletonPulse className="h-3 w-14" />
            <SkeletonPulse className="h-4 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}
