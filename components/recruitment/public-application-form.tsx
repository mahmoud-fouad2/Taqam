"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, FileText, Loader2, Send, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  locale: "ar" | "en";
  jobPostingId: string;
  tenantSlug: string;
  jobTitle: string;
  companyName: string;
};

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  coverLetter: "",
};

const RESUME_MAX_SIZE = 5 * 1024 * 1024;
const RESUME_ACCEPT = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const ALLOWED_RESUME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function PublicApplicationForm({ locale, jobPostingId, tenantSlug, jobTitle, companyName }: Props) {
  const p = locale === "en" ? "/en" : "";
  const [form, setForm] = useState(initialForm);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeInputKey, setResumeInputKey] = useState(0);
  const [uploadedResumeName, setUploadedResumeName] = useState<string | null>(null);
  const [uploadedResumeUrl, setUploadedResumeUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canSubmit =
    form.firstName.trim().length >= 2 &&
    form.lastName.trim().length >= 2 &&
    form.email.trim().length > 3 &&
    Boolean(resumeFile || uploadedResumeUrl) &&
    !submitting &&
    !uploadingResume;

  const setValue = (key: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetResume = () => {
    setResumeFile(null);
    setUploadedResumeName(null);
    setUploadedResumeUrl(null);
    setResumeInputKey((current) => current + 1);
  };

  const validateResume = (file: File) => {
    if (!ALLOWED_RESUME_TYPES.has(file.type)) {
      return locale === "ar"
        ? "صيغة السيرة الذاتية يجب أن تكون PDF أو DOC أو DOCX."
        : "Resume must be a PDF, DOC, or DOCX file.";
    }

    if (file.size > RESUME_MAX_SIZE) {
      return locale === "ar"
        ? "الحد الأقصى لحجم السيرة الذاتية هو 5 ميجابايت."
        : "Resume size must be 5MB or less.";
    }

    return null;
  };

  const handleResumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setError(null);

    if (!nextFile) {
      resetResume();
      return;
    }

    const validationError = validateResume(nextFile);
    if (validationError) {
      setError(validationError);
      resetResume();
      return;
    }

    setResumeFile(nextFile);
    setUploadedResumeName(nextFile.name);
    setUploadedResumeUrl(null);
  };

  const ensureResumeUploaded = async () => {
    if (uploadedResumeUrl) {
      return uploadedResumeUrl;
    }

    if (!resumeFile) {
      throw new Error(locale === "ar" ? "أرفق السيرة الذاتية أولًا." : "Attach a resume first.");
    }

    setUploadingResume(true);

    try {
      const formData = new FormData();
      formData.append("file", resumeFile);
      formData.append("jobPostingId", jobPostingId);
      formData.append("tenantSlug", tenantSlug);

      const uploadResponse = await fetch("/api/public/job-applications/resume", {
        method: "POST",
        body: formData,
      });

      const uploadPayload = await uploadResponse.json().catch(() => null);
      if (!uploadResponse.ok || !uploadPayload?.data?.url) {
        throw new Error(
          uploadPayload?.error ||
            (locale === "ar"
              ? "تعذر رفع السيرة الذاتية الآن. حاول مرة أخرى."
              : "We could not upload the resume right now.")
        );
      }

      setUploadedResumeName(uploadPayload.data.fileName || resumeFile.name);
      setUploadedResumeUrl(uploadPayload.data.url);

      return uploadPayload.data.url as string;
    } finally {
      setUploadingResume(false);
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const resumeUrl = await ensureResumeUploaded();
      const response = await fetch("/api/public/job-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobPostingId,
          tenantSlug,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          resumeUrl,
          coverLetter: form.coverLetter.trim() || undefined,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          payload?.error ||
            (locale === "ar" ? "تعذر إرسال الطلب الآن. حاول مرة أخرى." : "We could not submit the application right now.")
        );
      }

      setDone(true);
      setForm(initialForm);
      resetResume();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : locale === "ar"
            ? "حدث خطأ غير متوقع أثناء الإرسال."
            : "An unexpected error happened while submitting."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Card className="border-primary/25 bg-primary/5">
        <CardHeader>
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <CardTitle>{locale === "ar" ? "تم إرسال طلبك بنجاح" : "Application submitted"}</CardTitle>
          <CardDescription>
            {locale === "ar"
              ? `استلم فريق ${companyName} طلبك على وظيفة ${jobTitle}. سنرسل إليك أي تحديثات عبر البريد الإلكتروني.`
              : `${companyName} has received your application for ${jobTitle}. Further updates will be shared by email.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="brand">
            <Link href={`${p}/t/${tenantSlug}/careers`}>
              {locale === "ar" ? "وظائف هذه الشركة" : "This company's jobs"}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`${p}/careers`}>{locale === "ar" ? "كل الوظائف" : "All careers"}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle>{locale === "ar" ? "قدّم الآن" : "Apply now"}</CardTitle>
        <CardDescription>
          {locale === "ar"
            ? "أدخل بياناتك الأساسية وارفع السيرة الذاتية مباشرة إلى المنصة ليصل ملفك فورًا إلى فريق التوظيف."
            : "Share your core details and upload the resume directly to the platform so the recruitment team receives it immediately."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">{locale === "ar" ? "الاسم الأول" : "First name"}</Label>
              <Input id="firstName" value={form.firstName} onChange={(event) => setValue("firstName", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{locale === "ar" ? "الاسم الأخير" : "Last name"}</Label>
              <Input id="lastName" value={form.lastName} onChange={(event) => setValue("lastName", event.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">{locale === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
              <Input id="email" type="email" dir="ltr" value={form.email} onChange={(event) => setValue("email", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{locale === "ar" ? "رقم الجوال" : "Phone"}</Label>
              <Input id="phone" type="tel" dir="ltr" value={form.phone} onChange={(event) => setValue("phone", event.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="resumeFile">{locale === "ar" ? "السيرة الذاتية" : "Resume"}</Label>
              {(resumeFile || uploadedResumeUrl) && (
                <Button onClick={resetResume} size="sm" type="button" variant="ghost">
                  <X className="h-4 w-4" />
                  {locale === "ar" ? "إزالة الملف" : "Remove file"}
                </Button>
              )}
            </div>

            <Input
              accept={RESUME_ACCEPT}
              id="resumeFile"
              key={resumeInputKey}
              onChange={handleResumeChange}
              type="file"
            />

            <div className="rounded-xl border bg-muted/20 px-4 py-3 text-xs leading-6 text-muted-foreground">
              {locale === "ar"
                ? "الملفات المقبولة: PDF و DOC و DOCX بحد أقصى 5 ميجابايت. سيتم رفع الملف إلى تخزين المنصة مباشرة عند إرسال الطلب."
                : "Accepted files: PDF, DOC, and DOCX up to 5MB. The file is uploaded directly to platform storage when you submit the application."}
            </div>

            {resumeFile || uploadedResumeUrl ? (
              <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
                <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {uploadingResume ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-medium text-foreground">{uploadedResumeName || resumeFile?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {uploadingResume
                      ? locale === "ar"
                        ? "جاري رفع السيرة الذاتية..."
                        : "Uploading resume..."
                      : uploadedResumeUrl
                        ? locale === "ar"
                          ? "تم تجهيز السيرة الذاتية، وسيتم ربطها بطلب التقديم الحالي."
                          : "Resume is ready and will be attached to this application."
                        : locale === "ar"
                          ? "سيتم رفع السيرة الذاتية تلقائيًا عند إرسال الطلب."
                          : "The resume will upload automatically when you submit the application."}
                  </p>
                </div>
                <Upload className="mt-1 h-4 w-4 text-primary" />
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverLetter">{locale === "ar" ? "رسالة مختصرة (اختياري)" : "Short note (optional)"}</Label>
            <Textarea
              id="coverLetter"
              rows={6}
              value={form.coverLetter}
              onChange={(event) => setValue("coverLetter", event.target.value)}
              placeholder={
                locale === "ar"
                  ? "عرّف بنفسك باختصار، واذكر لماذا ترى أنك مناسب لهذه الوظيفة."
                  : "Introduce yourself briefly and explain why you're a good fit for this role."
              }
            />
          </div>

          {error ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div> : null}

          <div className="rounded-xl border bg-muted/30 px-4 py-3 text-xs leading-6 text-muted-foreground">
            {locale === "ar"
              ? "بتقديمك على الوظيفة، فأنت توافق على مشاركة بياناتك مع فريق التوظيف داخل الشركة المعنية فقط لغرض التقييم والتواصل بخصوص هذا الدور."
              : "By applying, you agree that your information will be shared only with the relevant company's recruitment team to evaluate and contact you about this role."}
          </div>

          <Button className="w-full" variant="brand" size="lg" disabled={!canSubmit} type="submit">
            {submitting || uploadingResume ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {locale === "ar" ? "جاري رفع السيرة وإرسال الطلب..." : "Uploading resume and submitting..."}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {locale === "ar" ? "إرسال الطلب" : "Submit application"}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}