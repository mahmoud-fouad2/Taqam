"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Building2,
  Settings2,
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  PartyPopper,
  ArrowLeft,
  UserCircle2,
  BarChart3,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { SetupData, SetupStepKey } from "@/lib/setup";

// ── Types ─────────────────────────────────────────────────────────────────────

type StepDef = { key: SetupStepKey; titleAr: string; titleEn: string };

type Props = {
  tenantId: string;
  tenantName: string;
  initialStep: number;
  totalSteps: number;
  steps: StepDef[];
  savedData: SetupData;
};

const STEP_ICONS = [Building2, Settings2, Users, UserPlus, ShieldCheck];

// Estimated minutes per step (used in the progress header)
const STEP_MINUTES = [2, 1, 2, 2, 1];

const TIMEZONES = [
  { value: "Asia/Riyadh", label: "الرياض (GMT+3)" },
  { value: "Asia/Dubai", label: "دبي (GMT+4)" },
  { value: "Africa/Cairo", label: "القاهرة (GMT+2)" },
  { value: "Asia/Kuwait", label: "الكويت (GMT+3)" },
  { value: "UTC", label: "UTC (GMT+0)" }
];

// ── Hook: save step data to backend ──────────────────────────────────────────

async function apiSaveStep(step: number, data: Record<string, unknown>) {
  const res = await fetch("/api/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ step, data })
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to save step");
  }
  return res.json() as Promise<{ ok: boolean; completionPercent: number }>;
}

async function apiComplete() {
  const res = await fetch("/api/setup/complete", { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to complete setup");
  }
}

async function apiTrackSetupEvent(event: {
  event: "setup_step_viewed" | "setup_checklist_viewed" | "setup_done_viewed";
  phase: "wizard" | "checklist" | "done";
  currentStep: number;
  totalSteps: number;
}) {
  await fetch("/api/setup/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event)
  });
}

// ── Wizard component ──────────────────────────────────────────────────────────

export function SetupWizard({ tenantName, initialStep, totalSteps, steps, savedData }: Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(Math.min(initialStep, totalSteps));
  const [saving, setSaving] = useState(false);
  // "checklist" = intermediate readiness review before final completion screen
  const [phase, setPhase] = useState<"wizard" | "checklist" | "done">("wizard");
  const lastTrackedEventKeyRef = useRef<string | null>(null);

  // Per-step form state initialised from savedData
  const [form1, setForm1] = useState<Form1>({
    nameAr: savedData.step1?.nameAr ?? tenantName,
    nameEn: savedData.step1?.nameEn ?? "",
    city: savedData.step1?.city ?? "",
    country: savedData.step1?.country ?? "SA",
    commercialRegister: savedData.step1?.commercialRegister ?? "",
    taxNumber: savedData.step1?.taxNumber ?? ""
  });

  const [form2, setForm2] = useState({
    timezone: savedData.step2?.timezone ?? "Asia/Riyadh",
    currency: savedData.step2?.currency ?? "SAR",
    weekStartDay: savedData.step2?.weekStartDay ?? 0
  });

  const [form3, setForm3] = useState<Form3>({
    departmentName: savedData.step3?.departmentName ?? "",
    departmentNameAr: savedData.step3?.departmentNameAr ?? "",
    jobTitleName: savedData.step3?.jobTitleName ?? "",
    jobTitleNameAr: savedData.step3?.jobTitleNameAr ?? ""
  });

  const [form4Action, setForm4Action] = useState<"invite" | "skip">(
    savedData.step4?.action ?? "skip"
  );
  const [form4Invite, setForm4Invite] = useState({
    email: savedData.step4?.action === "invite" ? savedData.step4.email : "",
    firstName: savedData.step4?.action === "invite" ? savedData.step4.firstName : "",
    lastName: savedData.step4?.action === "invite" ? savedData.step4.lastName : ""
  });

  const [form5, setForm5] = useState({
    leaveDaysPerYear: savedData.step5?.leaveDaysPerYear ?? 21,
    annualLeaveEnabled: savedData.step5?.annualLeaveEnabled ?? true,
    sickLeaveEnabled: savedData.step5?.sickLeaveEnabled ?? true,
    payrollEnabled: savedData.step5?.payrollEnabled ?? false,
    seedSampleData: savedData.step5?.seedSampleData ?? false
  });

  const completionPercent = Math.round((currentStep / totalSteps) * 100);

  useEffect(() => {
    const payload =
      phase === "wizard"
        ? {
            event: "setup_step_viewed" as const,
            phase,
            currentStep,
            totalSteps
          }
        : phase === "checklist"
          ? {
              event: "setup_checklist_viewed" as const,
              phase,
              currentStep,
              totalSteps
            }
          : {
              event: "setup_done_viewed" as const,
              phase,
              currentStep,
              totalSteps
            };

    const eventKey = JSON.stringify(payload);
    if (lastTrackedEventKeyRef.current === eventKey) {
      return;
    }

    lastTrackedEventKeyRef.current = eventKey;
    void apiTrackSetupEvent(payload).catch(() => {});
  }, [currentStep, phase, totalSteps]);

  async function handleNext() {
    setSaving(true);
    try {
      let payload: Record<string, unknown>;
      if (currentStep === 1) payload = form1;
      else if (currentStep === 2) payload = form2;
      else if (currentStep === 3) payload = form3;
      else if (currentStep === 4)
        payload =
          form4Action === "invite" ? { action: "invite", ...form4Invite } : { action: "skip" };
      else payload = form5;

      await apiSaveStep(currentStep, payload);

      if (currentStep === totalSteps) {
        await apiComplete();
        setPhase("checklist");
      } else {
        setCurrentStep((s) => s + 1);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ، حاول مرة أخرى");
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    setCurrentStep((s) => Math.max(1, s - 1));
  }

  const StepIcon = STEP_ICONS[(currentStep - 1) % STEP_ICONS.length] ?? Building2;
  const stepDef = steps[currentStep - 1];

  // ── Readiness Checklist Screen ────────────────────────────────────────────
  if (phase === "checklist") {
    const checklistItems = [
      {
        id: "company",
        label: "بيانات الشركة مكتملة",
        done: !!(form1.nameAr),
        hint: form1.nameAr || "—"
      },
      {
        id: "settings",
        label: "إعدادات العمل مضبوطة",
        done: true,
        hint: `${form2.timezone} · ${form2.currency}`
      },
      {
        id: "structure",
        label: "الهيكل الأساسي موجود",
        done: !!(form3.departmentName && form3.jobTitleName),
        hint: form3.departmentName
          ? `${form3.departmentName} · ${form3.jobTitleName}`
          : "لم يُضف قسم أو مسمى وظيفي"
      },
      {
        id: "employee",
        label: "الموظف الأول",
        done: form4Action === "invite",
        hint: form4Action === "invite" ? form4Invite.email : "تم التخطي — يمكن الإضافة لاحقاً"
      },
      {
        id: "leaves",
        label: "أنواع الإجازات الأساسية مفعّلة",
        done: form5.annualLeaveEnabled || form5.sickLeaveEnabled,
        hint: [
          form5.annualLeaveEnabled && "سنوية",
          form5.sickLeaveEnabled && "مرضية"
        ]
          .filter(Boolean)
          .join(" · ") || "لا إجازات مفعّلة"
      }
    ];

    const allDone = checklistItems.every((c) => c.done);

    return (
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">مراجعة الجاهزية</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            تحقق من تفاصيل الإعداد قبل الانطلاق
          </p>
        </div>

        <div className="space-y-3">
          {checklistItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-3 rounded-2xl border px-4 py-3.5",
                item.done
                  ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30"
                  : "border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/30"
              )}
            >
              <div className="mt-0.5 shrink-0">
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-muted-foreground mt-0.5 truncate text-xs">{item.hint}</p>
              </div>
            </div>
          ))}
        </div>

        {!allDone && (
          <p className="text-muted-foreground mt-4 text-center text-xs leading-6">
            البنود باللون الأصفر غير مكتملة — يمكنك متابعة الإعداد لاحقاً من لوحة التحكم
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setPhase("wizard");
              setCurrentStep(totalSteps);
            }}
          >
            <ChevronRight className="me-1.5 h-4 w-4" />
            تعديل
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={() => setPhase("done")}
          >
            انطلق الآن
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Setup Complete Screen ──────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <div className="w-full max-w-2xl text-center">
        <div className="bg-primary/10 text-primary mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl">
          <PartyPopper className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-black tracking-tight">مساحة العمل جاهزة!</h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-md text-sm leading-7">
          تم إعداد{" "}
          <span className="text-foreground font-semibold">
            {tenantName}
          </span>{" "}
          بنجاح. الخطوات التالية ستساعدك على البدء الفوري.
        </p>

        {/* Next steps cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Link
            href="/dashboard/employees"
            className="bg-card border-border/60 hover:border-primary/40 group flex flex-col items-center gap-3 rounded-2xl border p-5 text-center transition-all hover:shadow-sm">
            <div className="bg-blue-50 text-blue-600 dark:bg-blue-950/60 flex h-10 w-10 items-center justify-center rounded-xl group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">إضافة الموظفين</p>
              <p className="text-muted-foreground mt-1 text-xs leading-5">
                ابدأ ببناء قاعدة بيانات فريقك
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/settings"
            className="bg-card border-border/60 hover:border-primary/40 group flex flex-col items-center gap-3 rounded-2xl border p-5 text-center transition-all hover:shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 group-hover:scale-110 transition-transform">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">إعداد الرواتب</p>
              <p className="text-muted-foreground mt-1 text-xs leading-5">
                ضبط إعدادات مسير الرواتب والـ WPS
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="bg-card border-border/60 hover:border-primary/40 group flex flex-col items-center gap-3 rounded-2xl border p-5 text-center transition-all hover:shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 group-hover:scale-110 transition-transform">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">استكشاف لوحة التحكم</p>
              <p className="text-muted-foreground mt-1 text-xs leading-5">
                تعرّف على كل الأقسام والتقارير
              </p>
            </div>
          </Link>
        </div>

        {/* Completed steps summary */}
        <div className="bg-muted/30 mt-8 rounded-2xl p-4 text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 text-center">
            ما تم إعداده
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {steps.map((s) => (
              <div key={s.key} className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span className="text-sm">{s.titleAr}</span>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={() => {
            router.push("/dashboard");
            router.refresh();
          }}
          className="mt-8 gap-2 px-8">
          <ArrowLeft className="h-4 w-4" />
          انتقل للوحة التحكم
        </Button>
      </div>
    );
  }

  // ── Wizard steps ──────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-2xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
          <StepIcon className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-black tracking-tight">إعداد مساحة العمل</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {stepDef?.titleAr} — الخطوة {currentStep} من {totalSteps}
          {" · "}
          <span className="text-primary/80 font-medium">
            ~{STEP_MINUTES[currentStep - 1] ?? 1} دقيقة
          </span>
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">التقدم</span>
          <span className="font-semibold text-muted-foreground">
            {completionPercent}%
            {" · "}
            متبقي حوالي {STEP_MINUTES.slice(currentStep - 1).reduce((a, b) => a + b, 0)} دقيقة
          </span>
        </div>
        <Progress value={completionPercent} className="h-2" />
        <div className="mt-3 flex justify-between">
          {steps.map((s, idx) => (
            <div
              key={s.key}
              className={cn(
                "flex flex-col items-center gap-1 text-[11px]",
                idx + 1 < currentStep
                  ? "text-primary"
                  : idx + 1 === currentStep
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground"
              )}>
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                  idx + 1 < currentStep
                    ? "border-primary bg-primary text-white"
                    : idx + 1 === currentStep
                      ? "border-primary text-primary"
                      : "border-muted-foreground/30"
                )}>
                {idx + 1 < currentStep ? <CheckCircle2 className="h-3 w-3" /> : idx + 1}
              </div>
              <span className="hidden sm:block">{s.titleAr}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-card border-border/60 rounded-2xl border p-6 shadow-sm">
        {currentStep === 1 && (
          <StepCompanyProfile form={form1} onChange={setForm1} />
        )}
        {currentStep === 2 && (
          <StepWorkSettings form={form2} onChange={setForm2} timezones={TIMEZONES} />
        )}
        {currentStep === 3 && (
          <StepStructure form={form3} onChange={setForm3} />
        )}
        {currentStep === 4 && (
          <StepFirstEmployee
            action={form4Action}
            inviteData={form4Invite}
            onActionChange={setForm4Action}
            onInviteChange={setForm4Invite}
          />
        )}
        {currentStep === 5 && (
          <StepPolicies form={form5} onChange={setForm5} />
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1 || saving}
          className="gap-2">
          <ChevronRight className="h-4 w-4" />
          السابق
        </Button>
        <Button onClick={handleNext} disabled={saving} className="gap-2 min-w-[140px]">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {currentStep === totalSteps ? "إتمام الإعداد" : "التالي"}
          {!saving && currentStep < totalSteps && <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

// ── Step 1: Company Profile ───────────────────────────────────────────────────

type Form1 = {
  nameAr: string;
  nameEn: string;
  city: string;
  country: string;
  commercialRegister: string;
  taxNumber: string;
};

function StepCompanyProfile({
  form,
  onChange
}: {
  form: Form1;
  onChange: (v: Form1) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">أدخل بيانات شركتك الأساسية للبدء.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nameAr">اسم الشركة بالعربي *</Label>
          <Input
            id="nameAr"
            value={form.nameAr}
            onChange={(e) => onChange({ ...form, nameAr: e.target.value })}
            placeholder="شركة الأعمال المتقدمة"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nameEn">اسم الشركة بالإنجليزي</Label>
          <Input
            id="nameEn"
            value={form.nameEn ?? ""}
            onChange={(e) => onChange({ ...form, nameEn: e.target.value })}
            placeholder="Advanced Business Co."
            dir="ltr"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">المدينة</Label>
          <Input
            id="city"
            value={form.city ?? ""}
            onChange={(e) => onChange({ ...form, city: e.target.value })}
            placeholder="الرياض"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="commercialRegister">السجل التجاري</Label>
          <Input
            id="commercialRegister"
            value={form.commercialRegister ?? ""}
            onChange={(e) => onChange({ ...form, commercialRegister: e.target.value })}
            placeholder="1010XXXXXX"
            dir="ltr"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxNumber">الرقم الضريبي</Label>
          <Input
            id="taxNumber"
            value={form.taxNumber ?? ""}
            onChange={(e) => onChange({ ...form, taxNumber: e.target.value })}
            placeholder="3XXXXXXXXX3"
            dir="ltr"
          />
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Work Settings ─────────────────────────────────────────────────────

type Form2 = { timezone: string; currency: string; weekStartDay: number };

function StepWorkSettings({
  form,
  onChange,
  timezones
}: {
  form: Form2;
  onChange: (v: Form2) => void;
  timezones: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">اضبط الإعدادات الزمنية والمالية لشركتك.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>المنطقة الزمنية</Label>
          <Select
            value={form.timezone}
            onValueChange={(v) => onChange({ ...form, timezone: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>العملة</Label>
          <Select
            value={form.currency}
            onValueChange={(v) => onChange({ ...form, currency: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
              <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
              <SelectItem value="KWD">دينار كويتي (KWD)</SelectItem>
              <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
              <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>بداية الأسبوع</Label>
          <Select
            value={String(form.weekStartDay)}
            onValueChange={(v) => onChange({ ...form, weekStartDay: Number(v) })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">الأحد</SelectItem>
              <SelectItem value="1">الاثنين</SelectItem>
              <SelectItem value="6">السبت</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Org Structure ─────────────────────────────────────────────────────

type Form3 = {
  departmentName: string;
  departmentNameAr: string;
  jobTitleName: string;
  jobTitleNameAr: string;
};

function StepStructure({ form, onChange }: { form: Form3; onChange: (v: Form3) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        أنشئ أول قسم ومسمى وظيفي. يمكنك إضافة المزيد لاحقاً.
      </p>
      <div className="rounded-xl border p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">أول قسم</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>اسم القسم بالعربي *</Label>
            <Input
              value={form.departmentNameAr ?? ""}
              onChange={(e) => onChange({ ...form, departmentNameAr: e.target.value })}
              placeholder="الموارد البشرية"
            />
          </div>
          <div className="space-y-2">
            <Label>اسم القسم بالإنجليزي *</Label>
            <Input
              value={form.departmentName}
              onChange={(e) => onChange({ ...form, departmentName: e.target.value })}
              placeholder="Human Resources"
              dir="ltr"
            />
          </div>
        </div>
      </div>
      <div className="rounded-xl border p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">أول مسمى وظيفي</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>المسمى بالعربي *</Label>
            <Input
              value={form.jobTitleNameAr ?? ""}
              onChange={(e) => onChange({ ...form, jobTitleNameAr: e.target.value })}
              placeholder="مدير الموارد البشرية"
            />
          </div>
          <div className="space-y-2">
            <Label>المسمى بالإنجليزي *</Label>
            <Input
              value={form.jobTitleName}
              onChange={(e) => onChange({ ...form, jobTitleName: e.target.value })}
              placeholder="HR Manager"
              dir="ltr"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 4: First Employee ────────────────────────────────────────────────────

type Form4Invite = { email: string; firstName: string; lastName: string };

function StepFirstEmployee({
  action,
  inviteData,
  onActionChange,
  onInviteChange
}: {
  action: "invite" | "skip";
  inviteData: Form4Invite;
  onActionChange: (v: "invite" | "skip") => void;
  onInviteChange: (v: Form4Invite) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        يمكنك دعوة أول موظف الآن أو تخطي هذه الخطوة وإضافتهم لاحقاً.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onActionChange("skip")}
          className={cn(
            "flex-1 rounded-xl border p-4 text-sm font-medium transition-all",
            action === "skip"
              ? "border-primary bg-primary/5 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40"
          )}>
          تخطي الآن
        </button>
        <button
          type="button"
          onClick={() => onActionChange("invite")}
          className={cn(
            "flex-1 rounded-xl border p-4 text-sm font-medium transition-all",
            action === "invite"
              ? "border-primary bg-primary/5 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40"
          )}>
          دعوة موظف الآن
        </button>
      </div>
      {action === "invite" && (
        <div className="space-y-3 rounded-xl border p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>الاسم الأول *</Label>
              <Input
                value={inviteData.firstName}
                onChange={(e) => onInviteChange({ ...inviteData, firstName: e.target.value })}
                placeholder="محمد"
              />
            </div>
            <div className="space-y-2">
              <Label>الاسم الأخير *</Label>
              <Input
                value={inviteData.lastName}
                onChange={(e) => onInviteChange({ ...inviteData, lastName: e.target.value })}
                placeholder="الأحمدي"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>البريد الإلكتروني *</Label>
            <Input
              type="email"
              value={inviteData.email}
              onChange={(e) => onInviteChange({ ...inviteData, email: e.target.value })}
              placeholder="employee@company.com"
              dir="ltr"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 5: Policies ──────────────────────────────────────────────────────────

type Form5 = {
  leaveDaysPerYear: number;
  annualLeaveEnabled: boolean;
  sickLeaveEnabled: boolean;
  payrollEnabled: boolean;
  seedSampleData: boolean;
};

function StepPolicies({ form, onChange }: { form: Form5; onChange: (v: Form5) => void }) {
  return (
    <div className="space-y-5">
      <p className="text-muted-foreground text-sm">
        اضبط السياسات الأساسية لبدء التشغيل. كلها قابلة للتعديل لاحقاً.
      </p>

      <div className="rounded-xl border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">تفعيل الإجازة السنوية</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              إنشاء نوع إجازة سنوية تلقائياً عند الإعداد
            </p>
          </div>
          <Switch
            checked={form.annualLeaveEnabled}
            onCheckedChange={(v) => onChange({ ...form, annualLeaveEnabled: v })}
          />
        </div>
        {form.annualLeaveEnabled && (
          <div className="space-y-2">
            <Label>عدد أيام الإجازة السنوية</Label>
            <Input
              type="number"
              min={1}
              max={365}
              value={form.leaveDaysPerYear}
              onChange={(e) => onChange({ ...form, leaveDaysPerYear: Number(e.target.value) })}
              className="max-w-[120px]"
            />
          </div>
        )}
      </div>

      <div className="rounded-xl border p-4 flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">تفعيل الإجازة المرضية</p>
          <p className="text-muted-foreground text-xs mt-0.5">30 يوم سنوياً بشكل افتراضي</p>
        </div>
        <Switch
          checked={form.sickLeaveEnabled}
          onCheckedChange={(v) => onChange({ ...form, sickLeaveEnabled: v })}
        />
      </div>

      <div className="rounded-xl border p-4 flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">تفعيل الرواتب</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            تفعيل وحدة الرواتب لتشغيل مسير الرواتب الشهري
          </p>
        </div>
        <Switch
          checked={form.payrollEnabled}
          onCheckedChange={(v) => onChange({ ...form, payrollEnabled: v })}
        />
      </div>

      <div className="rounded-xl border p-4 flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-sm">إضافة بيانات تجريبية</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            إنشاء موظفين وسجلات حضور ووظيفة ومتقدمين تجريبيين لتظهر لوحة التحكم بشكل عملي فوراً
          </p>
        </div>
        <Switch
          checked={form.seedSampleData}
          onCheckedChange={(v) => onChange({ ...form, seedSampleData: v })}
        />
      </div>
    </div>
  );
}
