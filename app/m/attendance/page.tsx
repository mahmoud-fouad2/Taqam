"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Calendar,
  ChevronRight,
  Loader2,
  RefreshCw,
  WifiOff
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { loadMobileAuth, mobileAuthFetch } from "@/lib/mobile/web-client";
import { formatTimeHHMM, formatShortDate } from "@/components/mobile/mobile-utils";
import { AttendanceSkeleton } from "@/components/mobile/mobile-skeletons";
import { AnimatedPage, AnimatedItem } from "@/components/mobile/mobile-animations";

type AttendanceRow = {
  id: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
};

type ListResult = {
  data: {
    items: AttendanceRow[];
    page: number;
    limit: number;
    total: number;
  };
};

export default function MobileAttendancePage() {
  const router = useRouter();
  const [items, setItems] = useState<AttendanceRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const didFetch = useRef(false);
  const limit = 20;

  const fetch_ = useCallback(async (p: number) => {
    try {
      setLoading(true);
      setError(false);
      const res = await mobileAuthFetch<ListResult>(
        `/api/mobile/attendance?page=${p}&limit=${limit}`
      );
      setItems(res.data.items);
      setTotal(res.data.total);
      setPage(p);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!didFetch.current) {
      didFetch.current = true;
      const auth = loadMobileAuth();
      if (!auth) {
        router.replace("/m/login");
        return;
      }
      fetch_(1);
    }
  }, [router, fetch_]);

  const totalPages = Math.ceil(total / limit);

  /* Skeleton */
  if (loading && page === 1 && items.length === 0) return <AttendanceSkeleton />;

  /* Error state */
  if (error && items.length === 0) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4" dir="rtl">
        <WifiOff className="size-12 text-slate-200" />
        <p className="text-sm text-slate-400">تعذر تحميل سجل الحضور</p>
        <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => fetch_(1)}>
          <RefreshCw className="size-4" />
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <AnimatedPage className="space-y-4 pb-4" dir="rtl">
      {/* Page Header */}
      <AnimatedItem>
        <div className="flex items-center gap-3 pt-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex size-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100 transition-transform active:scale-90">
            <ChevronRight className="size-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">سجل الحضور</h1>
            <p className="text-[12px] text-slate-400">{total} سجل</p>
          </div>
        </div>
      </AnimatedItem>

      {items.length === 0 ? (
        <AnimatedItem>
          <div className="flex flex-col items-center py-20 text-center">
            <Calendar className="mb-3 size-12 text-slate-200" />
            <p className="text-sm text-slate-400">لا يوجد سجلات حضور</p>
          </div>
        </AnimatedItem>
      ) : (
        <>
          {items.map((row, i) => (
            <AnimatedItem key={row.id}>
              <AttendanceCard row={row} />
            </AnimatedItem>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <AnimatedItem>
              <div className="flex items-center justify-center gap-3 pt-3">
                <button
                  disabled={page <= 1 || loading}
                  onClick={() => fetch_(page - 1)}
                  className="rounded-xl bg-white px-4 py-2 text-[13px] font-semibold text-slate-600 shadow-sm ring-1 ring-slate-100 transition-transform active:scale-95 disabled:opacity-40">
                  السابق
                </button>
                <span className="text-[12px] text-slate-400 tabular-nums">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages || loading}
                  onClick={() => fetch_(page + 1)}
                  className="rounded-xl bg-white px-4 py-2 text-[13px] font-semibold text-slate-600 shadow-sm ring-1 ring-slate-100 transition-transform active:scale-95 disabled:opacity-40">
                  التالي
                </button>
              </div>
            </AnimatedItem>
          )}

          {loading && page > 1 && (
            <div className="flex justify-center py-4">
              <Loader2 className="size-5 animate-spin text-slate-300" />
            </div>
          )}
        </>
      )}
    </AnimatedPage>
  );
}

function AttendanceCard({ row }: { row: AttendanceRow }) {
  const date = new Date(row.date);
  const statusMap: Record<string, { label: string; cls: string }> = {
    PRESENT: { label: "حاضر", cls: "bg-emerald-50 text-emerald-600" },
    ABSENT: { label: "غائب", cls: "bg-red-50 text-red-600" },
    LATE: { label: "متأخر", cls: "bg-amber-50 text-amber-600" },
    EARLY_LEAVE: { label: "خروج مبكر", cls: "bg-orange-50 text-orange-600" },
    ON_LEAVE: { label: "إجازة", cls: "bg-blue-50 text-blue-600" }
  };
  const status = statusMap[row.status] || {
    label: row.status || "—",
    cls: "bg-slate-50 text-slate-500"
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition-transform active:scale-[0.99]">
      {/* Top row */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] font-bold text-slate-700">{formatShortDate(date)}</p>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${status.cls}`}>
          {status.label}
        </span>
      </div>

      {/* Times */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
          <ArrowDownToLine className="size-4 text-emerald-500" />
          <div>
            <p className="text-[10px] text-slate-400">حضور</p>
            <p className="text-[14px] font-bold text-slate-700 tabular-nums">
              {row.checkInTime ? formatTimeHHMM(new Date(row.checkInTime)) : "--:--"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
          <ArrowUpFromLine className="size-4 text-sky-500" />
          <div>
            <p className="text-[10px] text-slate-400">انصراف</p>
            <p className="text-[14px] font-bold text-slate-700 tabular-nums">
              {row.checkOutTime ? formatTimeHHMM(new Date(row.checkOutTime)) : "--:--"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
