"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarCheck,
  ClipboardList,
  Clock,
  FileText,
  Loader2,
  MapPin,
  Plane,
  RefreshCw,
  TicketCheck,
  WifiOff
} from "lucide-react";

import { Button } from "@/components/ui/button";
import MobileHeader from "@/components/mobile/mobile-header";
import { HomeSkeleton } from "@/components/mobile/mobile-skeletons";
import { AnimatedPage, AnimatedItem, AnimatedCard } from "@/components/mobile/mobile-animations";
import {
  formatTimeHHMM,
  formatArabicDate,
  formatDayName,
  greeting,
  getInitials,
  getCurrentPositionSafe
} from "@/components/mobile/mobile-utils";
import { loadMobileAuth, mobileAuthFetch, mobileChallenge } from "@/lib/mobile/web-client";

type TodayStatus = {
  status: "NONE" | "CHECKED_IN" | "CHECKED_OUT";
  canCheckIn: boolean;
  canCheckOut: boolean;
  record?: {
    checkInTime?: string | null;
    checkOutTime?: string | null;
  } | null;
};

type RecentRequest = {
  id: string;
  type: string;
  title: string;
  status: string;
  createdAt: string;
};

const quickActions = [
  {
    label: "تصحيح حضور",
    href: "/m/attendance",
    icon: CalendarCheck,
    color: "from-blue-500 to-blue-600"
  },
  {
    label: "طلب إجازة",
    href: "/m/requests",
    icon: Plane,
    color: "from-emerald-500 to-emerald-600"
  },
  { label: "الطلبات", href: "/m/requests", icon: FileText, color: "from-amber-500 to-amber-600" },
  {
    label: "السجل",
    href: "/m/attendance",
    icon: ClipboardList,
    color: "from-violet-500 to-violet-600"
  }
];

const typeIcons: Record<string, typeof FileText> = {
  leave: Plane,
  attendance: CalendarCheck,
  ticket: TicketCheck,
  training: FileText
};
const statusBadge: Record<string, { label: string; cls: string }> = {
  pending: { label: "قيد المراجعة", cls: "bg-amber-50 text-amber-600" },
  approved: { label: "مقبول", cls: "bg-emerald-50 text-emerald-600" },
  rejected: { label: "مرفوض", cls: "bg-red-50 text-red-600" },
  cancelled: { label: "ملغي", cls: "bg-slate-100 text-slate-500" }
};

export default function MobileHomePage() {
  const router = useRouter();

  /* ───── Auth ───── */
  const auth = useMemo(() => {
    if (typeof window === "undefined") return null;
    return loadMobileAuth();
  }, []);

  useEffect(() => {
    if (!auth) router.replace("/m/login");
  }, [auth, router]);

  /* ───── Clock ───── */
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  /* ───── Attendance Status ───── */
  const [today, setToday] = useState<TodayStatus | null>(null);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "locating" | "ok" | "fail">("idle");
  const didFetch = useRef(false);

  const fetchAll = useCallback(async () => {
    setError(false);
    setLoading(true);
    try {
      const [todayRes, reqRes] = await Promise.allSettled([
        mobileAuthFetch<{ data: TodayStatus }>("/api/mobile/attendance/today"),
        mobileAuthFetch<{ data: { items: RecentRequest[] } }>("/api/mobile/my-requests")
      ]);
      if (todayRes.status === "fulfilled") setToday(todayRes.value.data);
      if (reqRes.status === "fulfilled") setRecentRequests(reqRes.value.data.items.slice(0, 3));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!didFetch.current && auth) {
      didFetch.current = true;
      fetchAll();
    }
  }, [auth, fetchAll]);

  /* ───── Check-in / Check-out ───── */
  async function handleAttendance(type: "check-in" | "check-out") {
    setActionBusy(true);
    setGpsStatus("locating");
    try {
      const pos = await getCurrentPositionSafe({ timeoutMs: 8000 });
      setGpsStatus(pos ? "ok" : "fail");

      const nonce = await mobileChallenge();

      await mobileAuthFetch("/api/mobile/attendance", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-mobile-challenge": nonce
        },
        body: JSON.stringify({
          type,
          latitude: pos?.latitude,
          longitude: pos?.longitude,
          accuracy: pos?.accuracy
        })
      });

      await fetchAll();
    } catch (err: any) {
      alert(err?.message || "فشلت العملية");
    } finally {
      setActionBusy(false);
      setTimeout(() => setGpsStatus("idle"), 3000);
    }
  }

  /* ───── Derived ───── */
  const user = auth?.user;
  const displayName = user?.firstName || "مستخدم";
  const dateText = formatArabicDate(now);
  const dayName = formatDayName(now);

  if (!auth) return null;

  /* ── Skeleton while first load ── */
  if (loading) return <HomeSkeleton />;

  /* ── Error state with retry ── */
  if (error && !today) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4" dir="rtl">
        <WifiOff className="size-12 text-slate-200" />
        <p className="text-sm text-slate-400">تعذر تحميل البيانات</p>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl"
          onClick={() => {
            didFetch.current = false;
            fetchAll();
          }}>
          <RefreshCw className="size-4" />
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <AnimatedPage className="space-y-5 pb-4" dir="rtl">
      <AnimatedItem>
        <MobileHeader
          dateText={dateText}
          avatarUrl={user?.avatar}
          initials={getInitials(user?.firstName, user?.lastName)}
        />
      </AnimatedItem>

      {/* ── Greeting ── */}
      <AnimatedItem>
        <div className="space-y-0.5 pt-1">
          <h1 className="text-[22px] font-bold text-slate-800">
            {greeting("ar", now)}، {displayName} 👋
          </h1>
          <p className="text-[13px] text-slate-400">{dayName}</p>
        </div>
      </AnimatedItem>

      {/* ── Attendance Card ── */}
      <AnimatedCard>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-5 text-white shadow-xl shadow-slate-900/20">
          {/* Decorative orbs */}
          <div className="bg-primary/15 pointer-events-none absolute -top-10 -left-10 size-40 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -right-6 -bottom-6 size-32 rounded-full bg-cyan-400/10 blur-3xl" />

          {/* Status Chip */}
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold backdrop-blur">
            <span
              className={
                "inline-block size-1.5 rounded-full " +
                (today?.status === "CHECKED_IN"
                  ? "animate-pulse bg-emerald-400"
                  : today?.status === "CHECKED_OUT"
                    ? "bg-sky-400"
                    : "bg-slate-400")
              }
            />
            {today?.status === "CHECKED_IN"
              ? "في العمل"
              : today?.status === "CHECKED_OUT"
                ? "انتهى الدوام"
                : "لم يبدأ بعد"}
          </div>

          {/* Clock */}
          <div className="mb-5 flex items-end gap-2">
            <span className="text-[42px] leading-none font-extrabold tracking-tight tabular-nums">
              {formatTimeHHMM(now)}
            </span>
            <Clock className="mb-1 size-5 text-white/40" />
          </div>

          {/* Times */}
          <div className="mb-5 grid grid-cols-2 gap-3">
            <TimeChip
              label="تسجيل الحضور"
              time={today?.record?.checkInTime}
              icon={<ArrowDownToLine className="size-3.5 text-emerald-400" />}
            />
            <TimeChip
              label="تسجيل الانصراف"
              time={today?.record?.checkOutTime}
              icon={<ArrowUpFromLine className="size-3.5 text-sky-400" />}
            />
          </div>

          {/* GPS */}
          {gpsStatus !== "idle" && (
            <div className="mb-3 flex items-center gap-1.5 text-[11px] text-white/50">
              <MapPin className="size-3" />
              {gpsStatus === "locating" && "جاري تحديد الموقع…"}
              {gpsStatus === "ok" && "تم تحديد الموقع ✓"}
              {gpsStatus === "fail" && "تعذر تحديد الموقع"}
            </div>
          )}

          {/* CTA */}
          {today?.canCheckIn ? (
            <Button
              onClick={() => handleAttendance("check-in")}
              disabled={actionBusy}
              className="h-12 w-full rounded-2xl bg-emerald-500 text-[15px] font-bold shadow-lg shadow-emerald-500/30 transition-transform hover:bg-emerald-600 active:scale-[0.97]">
              {actionBusy ? <Loader2 className="size-5 animate-spin" /> : "تسجيل الحضور"}
            </Button>
          ) : today?.canCheckOut ? (
            <Button
              onClick={() => handleAttendance("check-out")}
              disabled={actionBusy}
              className="h-12 w-full rounded-2xl bg-sky-500 text-[15px] font-bold shadow-lg shadow-sky-500/30 transition-transform hover:bg-sky-600 active:scale-[0.97]">
              {actionBusy ? <Loader2 className="size-5 animate-spin" /> : "تسجيل الانصراف"}
            </Button>
          ) : (
            <div className="rounded-2xl bg-white/5 py-3 text-center text-sm text-white/40">
              لا يوجد إجراء متاح حالياً
            </div>
          )}
        </div>
      </AnimatedCard>

      {/* ── Quick Actions ── */}
      <AnimatedItem>
        <h2 className="mb-3 text-[15px] font-bold text-slate-700">خدمات سريعة</h2>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100 transition-transform active:scale-95">
              <div
                className={`flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ${action.color} shadow-sm`}>
                <action.icon className="size-5 text-white" strokeWidth={2} />
              </div>
              <span className="text-center text-[11px] leading-tight font-semibold text-slate-600">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </AnimatedItem>

      {/* ── Today Summary ── */}
      {today?.record && (
        <AnimatedItem>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <h3 className="mb-2 text-[13px] font-bold text-slate-600">ملخص اليوم</h3>
            <div className="space-y-2 text-[13px] text-slate-500">
              {today.record.checkInTime && (
                <div className="flex justify-between">
                  <span>وقت الحضور</span>
                  <span className="font-medium text-slate-700 tabular-nums">
                    {formatTimeHHMM(new Date(today.record.checkInTime))}
                  </span>
                </div>
              )}
              {today.record.checkOutTime && (
                <div className="flex justify-between">
                  <span>وقت الانصراف</span>
                  <span className="font-medium text-slate-700 tabular-nums">
                    {formatTimeHHMM(new Date(today.record.checkOutTime))}
                  </span>
                </div>
              )}
            </div>
          </div>
        </AnimatedItem>
      )}

      {/* ── Recent Requests ── */}
      {recentRequests.length > 0 && (
        <AnimatedItem>
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-slate-700">آخر الطلبات</h2>
            <Link href="/m/requests" className="text-primary text-[12px] font-semibold">
              عرض الكل
            </Link>
          </div>
          <div className="mt-2.5 space-y-2">
            {recentRequests.map((r) => {
              const st = statusBadge[r.status] || statusBadge.pending;
              const Icon = typeIcons[r.type] || FileText;
              const date = new Date(r.createdAt);
              const dateStr = date.toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-slate-100">
                  <div className="bg-primary/5 flex size-9 shrink-0 items-center justify-center rounded-xl">
                    <Icon className="text-primary/70 size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-slate-700">{r.title}</p>
                    <p className="text-[11px] text-slate-400">{dateStr}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${st!.cls}`}>
                    {st!.label}
                  </span>
                </div>
              );
            })}
          </div>
        </AnimatedItem>
      )}
    </AnimatedPage>
  );
}

/* ─── Sub-components ─── */

function TimeChip({
  label,
  time,
  icon
}: {
  label: string;
  time?: string | null;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/5 px-3 py-2.5 backdrop-blur">
      <div className="flex items-center gap-1.5 text-[11px] text-white/50">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-[16px] font-bold tabular-nums">
        {time ? formatTimeHHMM(new Date(time)) : "--:--"}
      </p>
    </div>
  );
}
