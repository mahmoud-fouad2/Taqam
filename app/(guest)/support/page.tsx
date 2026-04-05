import type { Metadata } from "next";
import Link from "next/link";

import { Clock3, HelpCircle, LifeBuoy, Mail } from "lucide-react";

import { MarketingPageCta } from "@/components/marketing/page-cta";
import { MarketingPageHero } from "@/components/marketing/page-hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppLocale } from "@/lib/i18n/locale";
import { marketingMetadata } from "@/lib/marketing/seo";
import { ContactForm } from "../help-center/contact-form";

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    path: "/support",
    titleAr: "الدعم الفني | طاقم",
    titleEn: "Support | Taqam",
    descriptionAr: "راسل فريق دعم طاقم مباشرة وتابع مشكلتك أو استفسارك من صفحة مستقلة وواضحة.",
    descriptionEn: "Reach Taqam support directly from a dedicated page for technical issues and inquiries.",
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

export default async function SupportPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@taqam.net";
  const sp = searchParams ? await searchParams : undefined;
  const issue = typeof sp?.issue === "string" ? sp.issue : null;
  const highlightedIssue = issue && issue in issueCopy ? issueCopy[issue as keyof typeof issueCopy] : null;

  return (
    <main className="bg-background">
      <MarketingPageHero
        icon={LifeBuoy}
        badge={isAr ? "قناة دعم مباشرة وواضحة" : "A direct and focused support channel"}
        title={isAr ? "الدعم الفني" : "Support"}
        description={
          isAr
            ? "صفحة مستقلة للتواصل المباشر مع فريق طاقم بخصوص الأعطال، التفعيل، أو أي استفسار تشغيلي يحتاج متابعة حقيقية."
            : "A dedicated page to contact the Taqam team directly for incidents, activation help, or operational questions that need real follow-up."
        }
        actions={[
          { href: `${p}/help-center`, label: isAr ? "العودة لمركز المساعدة" : "Back to help center", variant: "outline" },
          { href: `${p}/faq`, label: isAr ? "الأسئلة الشائعة" : "FAQ", variant: "ghost" },
        ]}
        stats={[
          { value: supportEmail, label: isAr ? "قناة البريد" : "Email channel" },
          { value: isAr ? "الأحد - الخميس" : "Sun - Thu", label: isAr ? "أيام المتابعة" : "Support days" },
          { value: "9-6", label: isAr ? "توقيت السعودية" : "KSA hours" },
        ]}
      />

      <section className="py-16">
        <div className="container mx-auto px-4">
          {highlightedIssue ? (
            <div className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm leading-7 text-foreground/85">
              {isAr ? highlightedIssue.ar : highlightedIssue.en}
            </div>
          ) : null}

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <ContactForm supportEmail={supportEmail} isAr={isAr} />

            <div className="space-y-4">
              <Card className="border-border/80">
                <CardHeader className="pb-3">
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{isAr ? "البريد الإلكتروني" : "Email support"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    {isAr
                      ? "ارسل المشكلة أو الطلب بالتفاصيل والملفات اللازمة، وسيتابعها الفريق حتى الإغلاق."
                      : "Send the issue or request with the relevant details and files, and the team will follow it through closure."}
                  </p>
                  <a href={`mailto:${supportEmail}`} className="inline-flex rounded-full border bg-background px-3 py-1.5 text-foreground transition hover:bg-muted">
                    {supportEmail}
                  </a>
                </CardContent>
              </Card>

              <Card className="border-border/80">
                <CardHeader className="pb-3">
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Clock3 className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{isAr ? "ساعات المتابعة" : "Support window"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>{isAr ? "الأحد – الخميس: 9:00 ص – 6:00 م بتوقيت السعودية." : "Sunday – Thursday: 9:00 AM – 6:00 PM KSA time."}</p>
                  <p>
                    {isAr
                      ? "لو أرسلت خارج ساعات العمل، سيتولى الفريق المتابعة في أول نافذة تشغيل متاحة."
                      : "If you send outside working hours, the team will follow up in the next available operating window."}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/80">
                <CardHeader className="pb-3">
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <HelpCircle className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{isAr ? "قبل فتح طلب جديد" : "Before opening a new case"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    {isAr
                      ? "راجع مركز المساعدة للأساسيات، والـ FAQ للأسئلة المتكررة، ثم استخدم هذه الصفحة للمشكلات الفعلية أو طلبات التفعيل والدعم."
                      : "Check the help center for basics and the FAQ for common questions, then use this page for real incidents, activation, and support requests."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`${p}/help-center`}>
                      <Button size="sm" variant="outline">{isAr ? "مركز المساعدة" : "Help Center"}</Button>
                    </Link>
                    <Link href={`${p}/faq`}>
                      <Button size="sm" variant="outline">{isAr ? "FAQ" : "FAQ"}</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <MarketingPageCta
        title={isAr ? "قبل إرسال طلب جديد" : "Before sending a new request"}
        description={
          isAr
            ? "إذا كانت المشكلة متكررة أو مرتبطة بالإعداد الأولي، راجع مركز المساعدة أو FAQ أولًا ثم افتح الطلب هنا لو احتجت متابعة مباشرة."
            : "If the issue is recurring or linked to initial setup, check the help center or FAQ first, then open a request here if you still need direct follow-up."
        }
        primaryAction={{ href: `${p}/help-center`, label: isAr ? "مركز المساعدة" : "Help Center" }}
        secondaryAction={{ href: `${p}/faq`, label: isAr ? "FAQ" : "FAQ" }}
        tone="muted"
      />
    </main>
  );
}