import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { Clock3, HelpCircle, Headphones, LifeBuoy, Mail, MessageSquare, Phone, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getAppLocale } from "@/lib/i18n/locale";
import { marketingMetadata } from "@/lib/marketing/seo";
import { ContactForm } from "../help-center/contact-form";

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    path: "/support",
    titleAr: "الدعم الفني | طاقم",
    titleEn: "Support | Taqam",
    descriptionAr:
      "راسل فريق دعم طاقم مباشرة وتابع مشكلتك أو استفسارك من صفحة مستقلة وواضحة.",
    descriptionEn:
      "Reach Taqam support directly from a dedicated page for technical issues and inquiries.",
  });
}

const issueCopy = {
  "plan-expired": {
    ar: "انتهى اشتراك الشركة الحالي. استخدم هذه الصفحة للتواصل معنا لتجديد الخدمة أو إعادة التفعيل.",
    en: "The current company subscription has expired. Use this page to contact us for renewal or reactivation.",
  },
  "tenant-inactive": {
    ar: "مساحة الشركة غير نشطة حاليًا. اكتب لنا وسنتابع حالة التفعيل معك.",
    en: "The company workspace is currently inactive. Contact us and we will help you restore access.",
  },
  "tenant-missing": {
    ar: "لم نتمكن من تحديد الشركة المرتبطة بحسابك. اكتب لنا تفاصيل الحساب وسنساعدك على الربط الصحيح.",
    en: "We could not determine which company is linked to your account. Send us the account details and we will help you reconnect it correctly.",
  },
} as const;

const supportChannels = [
  {
    icon: Mail,
    color: "from-blue-500/20 to-blue-500/5 text-blue-600 dark:text-blue-400",
    titleAr: "البريد الإلكتروني",
    titleEn: "Email support",
    descAr: "ارسل المشكلة أو الطلب بالتفاصيل والملفات اللازمة، وسيتابعها الفريق حتى الإغلاق.",
    descEn: "Send the issue or request with the relevant details and files, and the team will follow it through closure.",
  },
  {
    icon: Clock3,
    color: "from-emerald-500/20 to-emerald-500/5 text-emerald-600 dark:text-emerald-400",
    titleAr: "ساعات المتابعة",
    titleEn: "Support window",
    descAr: "الأحد – الخميس: 9:00 ص – 6:00 م بتوقيت السعودية. إذا أرسلت خارج ساعات العمل، سيتولى الفريق المتابعة في أول نافذة تشغيل متاحة.",
    descEn: "Sunday – Thursday: 9:00 AM – 6:00 PM KSA time. If you send outside working hours, the team will follow up in the next available window.",
  },
  {
    icon: Shield,
    color: "from-amber-500/20 to-amber-500/5 text-amber-600 dark:text-amber-400",
    titleAr: "قبل فتح طلب جديد",
    titleEn: "Before opening a new case",
    descAr: "راجع مركز المساعدة للأساسيات، والـ FAQ للأسئلة المتكررة، ثم استخدم هذه الصفحة للمشكلات الفعلية.",
    descEn: "Check the help center for basics and the FAQ for common questions, then use this page for real incidents.",
  },
];

export default async function SupportPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";
  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@taqam.net";
  const sp = searchParams ? await searchParams : undefined;
  const issue = typeof sp?.issue === "string" ? sp.issue : null;
  const highlightedIssue =
    issue && issue in issueCopy
      ? issueCopy[issue as keyof typeof issueCopy]
      : null;

  return (
    <main className="bg-background">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden border-b pb-20 pt-20 sm:pt-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,rgba(99,102,241,0.14),transparent_65%)] dark:bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,rgba(99,102,241,0.22),transparent_65%)]" />
          <div className="absolute start-0 top-20 h-64 w-64 rounded-full bg-indigo-500/[0.06] blur-[100px]" />
          <div className="absolute end-0 top-32 h-56 w-56 rounded-full bg-sky-500/[0.06] blur-[80px]" />
        </div>

        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Copy */}
            <div className="text-center lg:text-start">
              <div className="mb-5 flex justify-center lg:justify-start">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.07] px-4 py-1.5 text-xs font-semibold text-primary">
                  <Headphones className="h-3.5 w-3.5" />
                  {isAr ? "قناة دعم مباشرة وواضحة" : "A direct and focused support channel"}
                </span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                {isAr ? "الدعم الفني" : "Support"}
              </h1>
              <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground/80 lg:mx-0">
                {isAr
                  ? "صفحة مستقلة للتواصل المباشر مع فريق طاقم بخصوص الأعطال، التفعيل، أو أي استفسار تشغيلي يحتاج متابعة حقيقية."
                  : "A dedicated page to contact the Taqam team directly for incidents, activation help, or operational questions that need real follow-up."}
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Link href={`${p}/help-center`}>
                  <Button size="lg" variant="outline" className="h-12 gap-2 rounded-xl px-6">
                    {isAr ? "العودة لمركز المساعدة" : "Back to help center"}
                  </Button>
                </Link>
                <Link href={`${p}/faq`}>
                  <Button size="lg" variant="ghost" className="h-12 gap-2 rounded-xl px-6">
                    <MessageSquare className="h-4 w-4" />
                    {isAr ? "الأسئلة الشائعة" : "FAQ"}
                  </Button>
                </Link>
              </div>

              {/* Contact pills */}
              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                <div className="flex items-center gap-2 rounded-full border border-border/50 bg-muted/30 px-4 py-2 text-sm backdrop-blur-sm">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  <span className="text-muted-foreground">{supportEmail}</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-border/50 bg-muted/30 px-4 py-2 text-sm backdrop-blur-sm">
                  <Clock3 className="h-3.5 w-3.5 text-primary" />
                  <span className="text-muted-foreground">{isAr ? "الأحد - الخميس • 9-6" : "Sun-Thu • 9-6 KSA"}</span>
                </div>
              </div>
            </div>

            {/* Visual — product screenshot */}
            <div className="relative mx-auto hidden w-full max-w-sm lg:block">
              {/* Decorative glows */}
              <div className="pointer-events-none absolute -inset-6 -z-10 bg-gradient-to-tr from-sky-300 via-indigo-200 to-purple-200 blur-2xl dark:from-sky-900/50 dark:via-indigo-900/50 dark:to-purple-900/50" />
              <div className="pointer-events-none absolute -start-10 top-10 -z-10 h-32 w-32 rounded-full bg-emerald-400/20 blur-3xl" />
              
              <div className="relative overflow-hidden rounded-[2.5rem] rounded-tl-[6rem] rounded-br-[6rem] border-[6px] border-white/60 bg-white/90 shadow-2xl dark:border-white/10 dark:bg-card/90">
                <div className="relative aspect-[3/4] w-full">
                  <Image
                    src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=80"
                    alt={isAr ? "الدعم الفني" : "Technical support"}
                    fill
                    sizes="380px"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/30 to-transparent" />
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -start-8 top-16 rounded-2xl border border-white/60 bg-white/95 p-3.5 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-card/95">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-inner">
                    <Headphones className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{isAr ? "فريق خبراء متاح" : "Expert team available"}</p>
                    <p className="text-xs font-medium text-muted-foreground">{isAr ? "رد سريع خلال 24 ساعة" : "Quick reply within 24h"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FORM + SIDEBAR ── */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          {highlightedIssue ? (
            <div className="mb-10 rounded-[2rem] border border-primary/20 bg-primary/5 px-6 py-5 text-sm leading-7 text-foreground/85">
              {isAr ? highlightedIssue.ar : highlightedIssue.en}
            </div>
          ) : null}

          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            {/* Form */}
            <div className="rounded-[2.5rem] border border-border/50 bg-card/90 p-8 shadow-sm backdrop-blur-sm sm:p-10">
              <div className="mb-8">
                <h2 className="text-2xl font-extrabold tracking-tight">
                  {isAr ? "أرسل طلب دعم" : "Submit a support request"}
                </h2>
                <p className="mt-2 text-muted-foreground">
                  {isAr
                    ? "املأ التفاصيل وسيتواصل معك الفريق في أقرب وقت."
                    : "Fill in the details and the team will get back to you shortly."}
                </p>
              </div>
              <ContactForm supportEmail={supportEmail} isAr={isAr} />
            </div>

            {/* Info cards */}
            <div className="space-y-5">
              {supportChannels.map((channel) => {
                const ChannelIcon = channel.icon;
                return (
                  <div
                    key={channel.titleEn}
                    className="group relative overflow-hidden rounded-[2.5rem] border border-border/40 bg-card/60 p-8 shadow-sm backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-border/80 hover:bg-card/95 hover:shadow-xl"
                  >
                      <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-[1.25rem] shadow-inner bg-gradient-to-br ${channel.color}`}>
                        <ChannelIcon className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-bold tracking-tight">{isAr ? channel.titleAr : channel.titleEn}</h3>
                      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                        {isAr ? channel.descAr : channel.descEn}
                      </p>
                      {channel.icon === Mail && (
                        <a
                          href={`mailto:${supportEmail}`}
                          className="mt-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-2 text-sm font-medium text-foreground transition duration-300 hover:scale-105 hover:bg-muted"
                        >
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {supportEmail}
                        </a>
                      )}
                      {channel.icon === Shield && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link href={`${p}/help-center`}>
                          <Button size="sm" variant="outline" className="rounded-lg">
                            {isAr ? "مركز المساعدة" : "Help Center"}
                          </Button>
                        </Link>
                        <Link href={`${p}/faq`}>
                          <Button size="sm" variant="outline" className="rounded-lg">
                            FAQ
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl rounded-[2.5rem] border border-border/50 bg-card/90 p-10 text-center shadow-sm backdrop-blur-sm sm:p-14">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.07]">
              <HelpCircle className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {isAr ? "قبل إرسال طلب جديد" : "Before sending a new request"}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              {isAr
                ? "إذا كانت المشكلة متكررة أو مرتبطة بالإعداد الأولي، راجع مركز المساعدة أو FAQ أولًا."
                : "If the issue is recurring or linked to initial setup, check the help center or FAQ first."}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={`${p}/help-center`}>
                <Button size="lg" variant="brand" className="h-12 rounded-xl px-6">
                  {isAr ? "مركز المساعدة" : "Help Center"}
                </Button>
              </Link>
              <Link href={`${p}/faq`}>
                <Button size="lg" variant="outline" className="h-12 rounded-xl px-6">
                  FAQ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

