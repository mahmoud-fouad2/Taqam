"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  ChevronRight,
  FileText,
  Loader2,
  Plane,
  Plus,
  RefreshCw,
  Send,
  TicketCheck,
  WifiOff,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { loadMobileAuth, mobileAuthFetch } from "@/lib/mobile/web-client";
import { RequestsSkeleton } from "@/components/mobile/mobile-skeletons";
import { AnimatedPage, AnimatedItem } from "@/components/mobile/mobile-animations";

type Req = {
  id: string;
  type: string;
  title: string;
  status: string;
  createdAt: string;
};

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: "قيد المراجعة", cls: "bg-amber-50 text-amber-600" },
  approved: { label: "مقبول", cls: "bg-emerald-50 text-emerald-600" },
  rejected: { label: "مرفوض", cls: "bg-red-50 text-red-600" },
  cancelled: { label: "ملغي", cls: "bg-slate-100 text-slate-500" }
};

const typeIcons: Record<string, typeof FileText> = {
  leave: Plane,
  attendance: CalendarCheck,
  ticket: TicketCheck,
  training: FileText
};

export default function MobileRequestsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const didFetch = useRef(false);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await mobileAuthFetch<{ data: { items: Req[] } }>("/api/mobile/my-requests");
      setItems(res.data.items);
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
      fetchList();
    }
  }, [router, fetchList]);

  /* Skeleton */
  if (loading && items.length === 0) return <RequestsSkeleton />;

  /* Error */
  if (error && items.length === 0) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4" dir="rtl">
        <WifiOff className="size-12 text-slate-200" />
        <p className="text-sm text-slate-400">تعذر تحميل الطلبات</p>
        <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={fetchList}>
          <RefreshCw className="size-4" />
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <AnimatedPage className="space-y-4 pb-4" dir="rtl">
      {/* Header */}
      <AnimatedItem>
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex size-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100 transition-transform active:scale-90">
              <ChevronRight className="size-5 text-slate-400" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-800">الطلبات</h1>
              <p className="text-[12px] text-slate-400">{items.length} طلب</p>
            </div>
          </div>
          <Button
            size="sm"
            className="shadow-primary/20 h-9 gap-1.5 rounded-xl text-[13px] font-semibold shadow-sm transition-transform active:scale-95"
            onClick={() => setShowForm(true)}>
            <Plus className="size-4" />
            طلب جديد
          </Button>
        </div>
      </AnimatedItem>

      {/* Create Form */}
      {showForm && (
        <AnimatedItem>
          <CreateTicketForm
            onClose={() => setShowForm(false)}
            onCreated={() => {
              setShowForm(false);
              fetchList();
            }}
          />
        </AnimatedItem>
      )}

      {/* List */}
      {items.length === 0 ? (
        <AnimatedItem>
          <div className="flex flex-col items-center py-20 text-center">
            <FileText className="mb-3 size-12 text-slate-200" />
            <p className="text-sm text-slate-400">لا يوجد طلبات</p>
          </div>
        </AnimatedItem>
      ) : (
        items.map((r) => (
          <AnimatedItem key={r.id}>
            <RequestCard item={r} />
          </AnimatedItem>
        ))
      )}
    </AnimatedPage>
  );
}

/* ─── Request card ─── */

function RequestCard({ item }: { item: Req }) {
  const st = statusMap[item.status] || statusMap.pending;
  const Icon = typeIcons[item.type] || FileText;
  const date = new Date(item.createdAt);
  const dateStr = date.toLocaleDateString("ar-EG", { day: "numeric", month: "short" });

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition-transform active:scale-[0.99]">
      <div className="flex items-start gap-3">
        <div className="bg-primary/5 flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Icon className="text-primary/70 size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-slate-700">{item.title}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">{dateStr}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${st!.cls}`}>
          {st!.label}
        </span>
      </div>
    </div>
  );
}

/* ─── Create Ticket Form ─── */

function CreateTicketForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3 || description.trim().length < 3) return;
    setBusy(true);
    setError(null);
    try {
      await mobileAuthFetch("/api/mobile/my-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "ticket",
          title: title.trim(),
          description: description.trim(),
          priority
        })
      });
      onCreated();
    } catch (err: any) {
      setError(err?.message || "فشل إنشاء الطلب");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-slate-700">تذكرة دعم جديدة</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-300 transition-colors hover:text-slate-500">
          <X className="size-5" />
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-[12px] font-medium text-slate-500">العنوان</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان الطلب"
            disabled={busy}
            className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-medium text-slate-500">التفاصيل</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف مفصل..."
            rows={4}
            disabled={busy}
            className="rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-medium text-slate-500">الأولوية</label>
          <div className="grid grid-cols-3 gap-2">
            {(["low", "medium", "high"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={
                  "rounded-xl py-2 text-[12px] font-semibold transition-all active:scale-95 " +
                  (priority === p
                    ? "bg-primary shadow-primary/20 text-white shadow-sm"
                    : "bg-slate-50 text-slate-500 ring-1 ring-slate-100")
                }>
                {p === "low" ? "منخفضة" : p === "medium" ? "متوسطة" : "عالية"}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">{error}</div>
        )}

        <Button
          type="submit"
          disabled={busy || title.trim().length < 3 || description.trim().length < 3}
          className="shadow-primary/20 h-11 w-full gap-2 rounded-xl text-[14px] font-semibold shadow-sm transition-transform active:scale-[0.98]">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          إرسال
        </Button>
      </form>
    </div>
  );
}
