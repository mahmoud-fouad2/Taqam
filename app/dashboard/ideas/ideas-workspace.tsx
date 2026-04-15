"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Bug, Lightbulb, Megaphone, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

type Ticket = {
  id: string;
  subject: string;
  category: string | null;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "RESOLVED" | "CLOSED";
  lastMessageAt: string;
  createdAt: string;
  tenant?: { id: string; slug: string; name: string; nameAr: string | null };
  _count?: { messages: number };
};

type CategoryKey = "FEATURE_REQUEST" | "BUG_REPORT" | "PRODUCT_FEEDBACK";

const CATEGORY_ORDER: CategoryKey[] = ["FEATURE_REQUEST", "BUG_REPORT", "PRODUCT_FEEDBACK"];

const categoryMeta: Record<
  CategoryKey,
  { icon: typeof Lightbulb; ar: string; en: string; arDesc: string; enDesc: string }
> = {
  FEATURE_REQUEST: {
    icon: Lightbulb,
    ar: "ميزة جديدة",
    en: "Feature request",
    arDesc: "طلب ميزة جديدة أو تحسين واضح في سير العمل.",
    enDesc: "Request a new capability or a clearer workflow improvement."
  },
  BUG_REPORT: {
    icon: Bug,
    ar: "بلاغ مشكلة",
    en: "Bug report",
    arDesc: "مشكلة فعلية مع خطوات إعادة الإنتاج والأثر المتوقع.",
    enDesc: "A real defect with reproduction steps and expected behavior."
  },
  PRODUCT_FEEDBACK: {
    icon: Megaphone,
    ar: "ملاحظة على المنتج",
    en: "Product feedback",
    arDesc: "ملاحظات على التجربة أو نقاط احتكاك في الاستخدام اليومي.",
    enDesc: "Feedback on UX quality or friction in daily usage."
  }
};

function statusLabel(locale: "ar" | "en", status: Ticket["status"]) {
  const mapAr: Record<Ticket["status"], string> = {
    OPEN: t.common.open,
    IN_PROGRESS: t.ideas.inProgress,
    WAITING_CUSTOMER: t.ideas.waitingCustomer,
    RESOLVED: t.common.resolved,
    CLOSED: t.common.closed
  };

  const mapEn: Record<Ticket["status"], string> = {
    OPEN: "Open",
    IN_PROGRESS: "In progress",
    WAITING_CUSTOMER: "Waiting customer",
    RESOLVED: "Resolved",
    CLOSED: "Closed"
  };

  return locale === "ar" ? mapAr[status] : mapEn[status];
}

function priorityLabel(locale: "ar" | "en", priority: Ticket["priority"]) {
  const mapAr: Record<Ticket["priority"], string> = {
    LOW: t.common.low,
    NORMAL: t.common.normal,
    HIGH: t.common.high,
    URGENT: t.common.urgent
  };

  const mapEn: Record<Ticket["priority"], string> = {
    LOW: "Low",
    NORMAL: "Normal",
    HIGH: "High",
    URGENT: "Urgent"
  };

  return locale === "ar" ? mapAr[priority] : mapEn[priority];
}

function badgeVariantForStatus(
  status: Ticket["status"]
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "OPEN") return "secondary";
  if (status === "IN_PROGRESS") return "default";
  if (status === "WAITING_CUSTOMER") return "outline";
  if (status === "RESOLVED") return "secondary";
  return "outline";
}

export function IdeasWorkspace({
  locale: _locale,
  isSuperAdmin
}: {
  locale: "ar" | "en";
  isSuperAdmin: boolean;
}) {
  const locale = useClientLocale();
  const t = getText(locale);
  const prefix = locale === "en" ? "/en" : "";
  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [category, setCategory] = useState<CategoryKey>("FEATURE_REQUEST");
  const [priority, setPriority] = useState<Ticket["priority"]>("NORMAL");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const res = await fetch("/api/tickets?limit=100", { cache: "no-store" });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          json?.error || (locale === "ar" ? t.ideas.loadFailed : "Failed to load ideas")
        );
      }

      setItems(Array.isArray(json?.data?.items) ? json.data.items : []);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : locale === "ar"
            ? t.ideas.loadFailed
            : "Failed to load ideas"
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [locale, t.ideas.loadFailed]);

  useEffect(() => {
    void load();
  }, [load]);

  const relevantItems = useMemo(() => {
    return items.filter((item) => item.category && item.category in categoryMeta);
  }, [items]);

  const stats = useMemo(() => {
    return {
      total: relevantItems.length,
      open: relevantItems.filter((item) => item.status === "OPEN").length,
      inProgress: relevantItems.filter((item) => item.status === "IN_PROGRESS").length,
      resolved: relevantItems.filter(
        (item) => item.status === "RESOLVED" || item.status === "CLOSED"
      ).length
    };
  }, [relevantItems]);

  const canSubmit = !isSuperAdmin;

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error(locale === "ar" ? t.ideas.requiredFields : "Subject and message are required");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          category,
          priority,
          message: message.trim()
        })
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          json?.error || (locale === "ar" ? t.ideas.submitFailed : "Failed to submit idea")
        );
      }

      toast.success(locale === "ar" ? t.ideas.submitSuccess : "Idea submitted successfully");
      setCategory("FEATURE_REQUEST");
      setPriority("NORMAL");
      setSubject("");
      setMessage("");
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : locale === "ar"
            ? t.ideas.submitFailed
            : "Failed to submit idea"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{locale === "ar" ? "إجمالي السجلات" : "Total items"}</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{locale === "ar" ? t.common.open : "Open"}</CardDescription>
            <CardTitle className="text-3xl">{stats.open}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {locale === "ar" ? t.ideas.inProgress : "In progress"}
            </CardDescription>
            <CardTitle className="text-3xl">{stats.inProgress}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {locale === "ar" ? "مغلقة أو محلولة" : "Resolved or closed"}
            </CardDescription>
            <CardTitle className="text-3xl">{stats.resolved}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{locale === "ar" ? "إرسال فكرة أو بلاغ" : "Submit feedback"}</CardTitle>
            <CardDescription>
              {locale === "ar"
                ? "اختر التصنيف المناسب واكتب وصفًا واضحًا حتى يصل الطلب للفريق الصحيح ويُتابع بسرعة."
                : "Each submission creates a real tracked ticket so it can be followed up through the same workflow."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {canSubmit ? null : (
              <Alert className="border-border/60 bg-muted/40 rounded-2xl">
                <AlertTitle>{locale === "ar" ? "وضع العرض فقط" : "View only"}</AlertTitle>
                <AlertDescription>
                  {locale === "ar"
                    ? "يمكن للمشرف العام مراجعة المقترحات هنا، أما الإرسال فيتم من داخل لوحة الشركة نفسها."
                    : "Ideas are submitted from tenant dashboards. You can review them here only."}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-3">
              {CATEGORY_ORDER.map((key) => {
                const meta = categoryMeta[key];
                const Icon = meta.icon;

                return (
                  <button
                    key={key}
                    type="button"
                    className={`rounded-2xl border p-4 text-start transition ${
                      category === key
                        ? "border-primary/30 bg-primary/5 shadow-sm"
                        : "border-border/60 bg-background hover:border-primary/30 hover:bg-muted/30"
                    }`}
                    onClick={() => setCategory(key)}
                    disabled={!canSubmit}>
                    <div className="flex items-start gap-3">
                      <div className="bg-muted rounded-xl p-2.5">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{locale === "ar" ? meta.ar : meta.en}</div>
                        <div className="text-muted-foreground mt-1 text-sm leading-6">
                          {locale === "ar" ? meta.arDesc : meta.enDesc}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label htmlFor="idea-subject">{locale === "ar" ? t.common.subject : "Subject"}</Label>
              <Input
                id="idea-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder={
                  locale === "ar"
                    ? t.ideas.subjectExample
                    : "Example: multi-step approval for expenses"
                }
                className="h-12 rounded-xl"
                disabled={!canSubmit || submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idea-priority">
                {locale === "ar" ? t.common.priority : "Priority"}
              </Label>
              <select
                id="idea-priority"
                aria-label={locale === "ar" ? t.ideas.priority : "Idea priority"}
                title={locale === "ar" ? t.ideas.priority : "Idea priority"}
                className="border-input bg-background h-12 w-full rounded-xl border px-3 text-sm"
                value={priority}
                onChange={(event) => setPriority(event.target.value as Ticket["priority"])}
                disabled={!canSubmit || submitting}>
                <option value="LOW">{priorityLabel(locale, "LOW")}</option>
                <option value="NORMAL">{priorityLabel(locale, "NORMAL")}</option>
                <option value="HIGH">{priorityLabel(locale, "HIGH")}</option>
                <option value="URGENT">{priorityLabel(locale, "URGENT")}</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="idea-message">
                {locale === "ar" ? t.common.description : "Description"}
              </Label>
              <Textarea
                id="idea-message"
                rows={8}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={
                  locale === "ar"
                    ? "اكتب الوضع الحالي، المشكلة أو الفرصة، وما النتيجة التي تتوقعها بعد التنفيذ أو المعالجة."
                    : "Describe the current flow, the problem or opportunity, and the expected outcome after the improvement."
                }
                className="min-h-40 rounded-2xl"
                disabled={!canSubmit || submitting}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => void handleSubmit()}
                disabled={!canSubmit || submitting}
                className="h-12 rounded-xl px-5">
                <Send className="me-2 h-4 w-4" />
                {submitting
                  ? locale === "ar"
                    ? t.common.sending
                    : "Submitting..."
                  : locale === "ar"
                    ? t.common.send
                    : "Submit"}
              </Button>
              <Button variant="outline" asChild className="h-12 rounded-xl px-5">
                <Link href={`${prefix}/dashboard/support`}>
                  {locale === "ar" ? "فتح تذاكر الدعم" : "Open support workspace"}
                  <ArrowUpRight className="ms-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>
                {locale === "ar" ? "سجل المقترحات والمتابعة" : "Ideas and follow-up log"}
              </CardTitle>
              <CardDescription>
                {locale === "ar"
                  ? "كل عنصر هنا مرتبط بنفس سجل التذكرة، لذلك ستجد الحالة وآخر تحديث وعدد الرسائل في مكان واحد."
                  : "Entries here are tied to the same ticketing workflow, so status and replies stay in one place."}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => void load()}
              disabled={loading}
              className="h-12 rounded-xl px-5">
              <RefreshCw className="me-2 h-4 w-4" />
              {locale === "ar" ? t.common.update : "Refresh"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadError ? (
              <Alert variant="destructive">
                <AlertTitle>
                  {locale === "ar" ? "تعذر تحميل البيانات" : "Failed to load data"}
                </AlertTitle>
                <AlertDescription>{loadError}</AlertDescription>
              </Alert>
            ) : null}

            {loading ? (
              <div className="text-muted-foreground border-border/60 bg-muted/20 rounded-2xl border border-dashed py-10 text-center text-sm">
                {locale === "ar" ? "جاري تحميل المقترحات..." : "Loading ideas..."}
              </div>
            ) : relevantItems.length === 0 ? (
              <div className="text-muted-foreground border-border/60 bg-muted/20 rounded-2xl border border-dashed p-8 text-center text-sm leading-7">
                {locale === "ar"
                  ? "لا توجد عناصر مصنفة بعد. أول مقترح أو بلاغ يتم إرساله من هذه الصفحة سيظهر هنا فورًا مع حالته الحالية."
                  : "There are no categorized ideas or bug reports yet. The first submission from this page will appear here immediately."}
              </div>
            ) : (
              <div className="grid gap-3">
                {relevantItems.map((item) => {
                  const meta = categoryMeta[item.category as CategoryKey];

                  return (
                    <Link
                      key={item.id}
                      href={`${prefix}/dashboard/support/${item.id}`}
                      className="border-border/60 bg-background hover:border-primary/20 hover:bg-muted/20 rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium">{item.subject}</h3>
                            <Badge variant={badgeVariantForStatus(item.status)}>
                              {statusLabel(locale, item.status)}
                            </Badge>
                            <Badge variant="outline">{priorityLabel(locale, item.priority)}</Badge>
                            <Badge variant="outline">{locale === "ar" ? meta.ar : meta.en}</Badge>
                          </div>
                          <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
                            <span>
                              {new Date(item.lastMessageAt).toLocaleString(
                                locale === "ar" ? "ar-SA" : "en-US"
                              )}
                            </span>
                            {item._count?.messages ? (
                              <span>
                                {locale === "ar" ? t.ideas.messages : "Messages:"}{" "}
                                {item._count.messages}
                              </span>
                            ) : null}
                            {isSuperAdmin && item.tenant ? (
                              <span>
                                {locale === "ar" ? t.common.company : "Tenant:"}{" "}
                                {item.tenant.nameAr || item.tenant.name}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <ArrowUpRight className="text-muted-foreground h-4 w-4 shrink-0" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
