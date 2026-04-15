"use client";

/**
 * Subscription Request Form
 * نموذج طلب الاشتراك
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { t } from "@/lib/i18n/messages";

function createRequestSchema(isAr: boolean) {
  const phoneRegex = /^\+?\d{8,15}$/;
  return z.object({
    companyName: z.string().min(2, isAr ? "اسم الشركة مطلوب" : "Company name is required"),
    companyNameAr: z.string().optional(),
    contactName: z.string().min(2, isAr ? "اسم المسؤول مطلوب" : "Contact name is required"),
    contactEmail: z.string().email(isAr ? "البريد الإلكتروني غير صحيح" : "Invalid email address"),
    contactPhone: z
      .string()
      .optional()
      .refine(
        (v) => !v || phoneRegex.test(v),
        isAr ? "رقم الهاتف غير صحيح" : "Invalid phone number"
      ),
    employeesCount: z.string().min(1, isAr ? "اختر عدد الموظفين" : "Select employee count"),
    plan: z.enum(["trial", "starter", "business", "enterprise"]).optional(),
    message: z
      .string()
      .optional()
      .refine((v) => !v || v.length <= 2000, isAr ? "الرسالة طويلة جدًا" : "Message is too long")
  });
}

type RequestInput = z.infer<ReturnType<typeof createRequestSchema>>;

type SubscriptionRequestFormProps = {
  locale: "ar" | "en";
};

function normalizeRequestedPlan(value: string | null): RequestInput["plan"] {
  if (value === "trial" || value === "starter" || value === "business" || value === "enterprise") {
    return value;
  }

  return undefined;
}

export function SubscriptionRequestForm({ locale }: SubscriptionRequestFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isAr = locale === "ar";
  const prefix = locale === "en" ? "/en" : "";
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const requestedPlan = normalizeRequestedPlan(searchParams.get("plan"));

  const requestSchema = useMemo(() => createRequestSchema(isAr), [isAr]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<RequestInput>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      companyName: "",
      companyNameAr: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      employeesCount: "",
      plan: requestedPlan,
      message: ""
    }
  });

  useEffect(() => {
    if (requestedPlan) {
      setValue("plan", requestedPlan, { shouldDirty: false, shouldValidate: true });
    }
  }, [requestedPlan, setValue]);

  const onSubmit = useCallback(
    async (data: RequestInput) => {
      setSubmitError(null);

      if (!siteKey || !executeRecaptcha) {
        setSubmitError(t(locale, "captcha.missingConfig"));
        return;
      }

      setIsLoading(true);
      let captchaToken: string;
      try {
        captchaToken = await executeRecaptcha("request_demo");
      } catch {
        setSubmitError(t(locale, "captcha.invalid"));
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/public/tenant-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            locale,
            captchaToken
          })
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.error || (isAr ? "تعذر إرسال الطلب" : "Failed to submit request"));
        }

        setIsSuccess(true);
      } catch (e) {
        setSubmitError(
          e instanceof Error ? e.message : isAr ? "تعذر إرسال الطلب" : "Failed to submit request"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [locale, siteKey, executeRecaptcha, isAr]
  );

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-primary/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <CheckCircle2 className="text-primary h-8 w-8" />
        </div>
        <h3 className="mb-2 text-xl font-semibold">
          {isAr ? "تم استلام طلبك بنجاح!" : "Request received successfully!"}
        </h3>
        <p className="text-muted-foreground mb-6">
          {isAr
            ? "شكرًا لاهتمامك بمنصة طاقم. سيتواصل معك فريقنا خلال 24 ساعة."
            : "Thanks for your interest in Taqam. Our team will contact you within 24 hours."}
        </p>
        <Button variant="brandOutline" onClick={() => router.push(prefix || "/")}>
          {isAr ? "العودة للرئيسية" : "Back to home"}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Company Info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="companyName">
            {isAr ? "اسم الشركة (بالإنجليزية) *" : "Company name (English) *"}
          </Label>
          <Input
            id="companyName"
            placeholder={isAr ? "Company Name" : "Company Name"}
            autoComplete="organization"
            className="bg-muted/50 focus-visible:bg-background h-11 rounded-xl"
            {...register("companyName")}
          />
          {errors.companyName && (
            <p className="text-destructive text-sm">{errors.companyName.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="companyNameAr">
            {isAr ? "اسم الشركة (بالعربية)" : "Company name (Arabic)"}
          </Label>
          <Input
            id="companyNameAr"
            placeholder={isAr ? "اسم الشركة" : "اسم الشركة"}
            className="bg-muted/50 focus-visible:bg-background h-11 rounded-xl"
            {...register("companyNameAr")}
          />
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contactName">{isAr ? "اسم المسؤول *" : "Contact name *"}</Label>
          <Input
            id="contactName"
            placeholder={isAr ? "أحمد محمد" : "John Smith"}
            autoComplete="name"
            className="bg-muted/50 focus-visible:bg-background h-11 rounded-xl"
            {...register("contactName")}
          />
          {errors.contactName && (
            <p className="text-destructive text-sm">{errors.contactName.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contactEmail">{isAr ? "البريد الإلكتروني *" : "Email *"}</Label>
          <Input
            id="contactEmail"
            type="email"
            placeholder="email@company.sa"
            autoComplete="email"
            className="bg-muted/50 focus-visible:bg-background h-11 rounded-xl"
            {...register("contactEmail")}
          />
          {errors.contactEmail && (
            <p className="text-destructive text-sm">{errors.contactEmail.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contactPhone">{isAr ? "رقم الهاتف" : "Phone"}</Label>
          <Input
            id="contactPhone"
            placeholder="+966501234567"
            autoComplete="tel"
            className="bg-muted/50 focus-visible:bg-background h-11 rounded-xl"
            {...register("contactPhone")}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{isAr ? "عدد الموظفين *" : "Employee count *"}</Label>
          <Select
            onValueChange={(value) =>
              setValue("employeesCount", value, { shouldDirty: true, shouldValidate: true })
            }>
            <SelectTrigger className="bg-muted/50 focus:bg-background h-11 rounded-xl">
              <SelectValue placeholder={isAr ? "اختر" : "Select"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-10">{isAr ? "1 - 10 موظفين" : "1 - 10 employees"}</SelectItem>
              <SelectItem value="11-50">{isAr ? "11 - 50 موظف" : "11 - 50 employees"}</SelectItem>
              <SelectItem value="51-200">
                {isAr ? "51 - 200 موظف" : "51 - 200 employees"}
              </SelectItem>
              <SelectItem value="200+">{isAr ? "أكثر من 200 موظف" : "200+ employees"}</SelectItem>
            </SelectContent>
          </Select>
          {errors.employeesCount && (
            <p className="text-destructive text-sm">{errors.employeesCount.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>{isAr ? "الباقة الأقرب لاحتياجك" : "Preferred plan"}</Label>
        <Select
          value={watch("plan")}
          onValueChange={(value) =>
            setValue("plan", normalizeRequestedPlan(value), {
              shouldDirty: true,
              shouldValidate: true
            })
          }>
          <SelectTrigger className="bg-muted/50 focus:bg-background h-11 rounded-xl">
            <SelectValue
              placeholder={isAr ? "اختر الباقة المناسبة مبدئياً" : "Select the closest plan"}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="trial">{isAr ? "تجريبي / مبدئي" : "Trial / initial"}</SelectItem>
            <SelectItem value="starter">{isAr ? "Starter / الأساسية" : "Starter"}</SelectItem>
            <SelectItem value="business">{isAr ? "Business / الأعمال" : "Business"}</SelectItem>
            <SelectItem value="enterprise">
              {isAr ? "Enterprise / المؤسسات" : "Enterprise"}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <Label htmlFor="message">{isAr ? "رسالة أو ملاحظات" : "Message / notes"}</Label>
        <Textarea
          id="message"
          placeholder={isAr ? "أخبرنا المزيد عن احتياجاتك..." : "Tell us about your needs..."}
          rows={4}
          className="bg-muted/50 focus-visible:bg-background min-h-28 rounded-2xl"
          {...register("message")}
        />
      </div>

      {!siteKey && <p className="text-destructive text-sm">{t(locale, "captcha.missingConfig")}</p>}

      {submitError ? (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-xl border px-4 py-3 text-sm">
          {submitError}
        </div>
      ) : null}

      {/* Submit */}
      <Button type="submit" variant="brand" className="h-11 w-full rounded-xl" disabled={isLoading}>
        {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
        {isLoading ? t(locale, "form.submitting") : t(locale, "form.submit")}
      </Button>

      <p className="text-muted-foreground text-center text-xs">
        {t(locale, "form.agreePrefix")}
        <a href={`${prefix}/privacy`} className="text-primary hover:underline">
          {t(locale, "form.privacyPolicy")}
        </a>{" "}
        {t(locale, "form.and")}
        <a href={`${prefix}/terms`} className="text-primary hover:underline">
          {t(locale, "form.terms")}
        </a>
      </p>
    </form>
  );
}
