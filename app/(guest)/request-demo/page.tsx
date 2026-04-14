/**
 * Request Demo / Subscription Request Page
 * صفحة طلب اشتراك / عرض تجريبي
 */

import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock3, ShieldCheck } from "lucide-react";

import { JsonLd } from "@/components/marketing/json-ld";
import { LogoMark } from "@/components/logo-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubscriptionRequestForm } from "./subscription-request-form";
import { RecaptchaProvider } from "@/components/recaptcha-provider";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/fade-in";
import { getSiteUrl } from "@/lib/marketing/site";
import { itemListSchema, pageSchema } from "@/lib/marketing/schema";
import { marketingMetadata } from "@/lib/marketing/seo";
import { getPlatformSiteContent } from "@/lib/marketing/site-content";
import { getAppLocale } from "@/lib/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  const siteContent = await getPlatformSiteContent();

  return marketingMetadata({
    path: "/request-demo",
    titleAr: "طلب عرض تجريبي | طاقم",
    titleEn: "Request a Demo | Taqam",
    descriptionAr: siteContent.requestDemo.description.ar,
    descriptionEn: siteContent.requestDemo.description.en
  });
}

export default async function RequestDemoPage() {
  const locale = await getAppLocale();
  const siteContent = await getPlatformSiteContent();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";
  const base = getSiteUrl();
  const pageUrl = `${base}${p}/request-demo`;
  const requestDemoContent = siteContent.requestDemo;
  const highlightIcons = [Clock3, ShieldCheck, CheckCircle2];
  const highlights = requestDemoContent.highlights.map((highlight, index) => ({
    icon: highlightIcons[index] ?? CheckCircle2,
    title: isAr ? highlight.title.ar : highlight.title.en,
    description: isAr ? highlight.description.ar : highlight.description.en
  }));

  return (
    <main className="bg-background min-h-[calc(100vh-8rem)]">
      <JsonLd
        data={[
          pageSchema({
            url: pageUrl,
            locale,
            title: isAr ? "طلب عرض تجريبي" : "Request a Demo",
            description: isAr ? requestDemoContent.description.ar : requestDemoContent.description.en,
            type: "ContactPage",
            about: isAr ? "طلب عرض تجريبي لمنصة طاقم" : "Request a Taqam product demo"
          }),
          itemListSchema({
            url: pageUrl,
            locale,
            name: isAr ? "أسباب طلب العرض" : "Demo request highlights",
            description: isAr ? requestDemoContent.description.ar : requestDemoContent.description.en,
            items: highlights.map((highlight) => ({
              name: highlight.title,
              description: highlight.description
            }))
          })
        ]}
      />
      <section className="container mx-auto px-4 py-14 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,.95fr)]">
          <div className="mx-auto w-full max-w-2xl lg:mx-0">
            <FadeIn>
              <div className="mb-8">
                <LogoMark
                  className="mb-5"
                  frameClassName="rounded-2xl p-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:bg-white dark:ring-white/20"
                  imageClassName="h-16"
                />
                <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200">
                  {isAr ? requestDemoContent.badge.ar : requestDemoContent.badge.en}
                </span>
                <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
                  {isAr ? requestDemoContent.title.ar : requestDemoContent.title.en}
                </h1>
                <p className="text-muted-foreground mt-4 max-w-xl text-base leading-7">
                  {isAr ? requestDemoContent.description.ar : requestDemoContent.description.en}
                </p>

                <div className="mt-6 grid gap-2 sm:grid-cols-3 lg:hidden">
                  {highlights.map((item) => (
                    <div
                      key={item.title}
                      className="border-border/60 bg-background/85 rounded-[1.35rem] border p-3 shadow-sm">
                      <div className="text-primary flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <p className="mt-3 text-sm font-semibold">{item.title}</p>
                      <p className="text-muted-foreground mt-1 text-xs leading-5">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn>
              <Card className="border-border/70 overflow-hidden rounded-[1.75rem] shadow-xl shadow-black/5">
                <CardHeader className="bg-muted/30 border-b px-6 py-6 sm:px-8">
                  <CardTitle className="text-xl">
                    {isAr ? requestDemoContent.formTitle.ar : requestDemoContent.formTitle.en}
                  </CardTitle>
                  <CardDescription>
                    {isAr
                      ? requestDemoContent.formDescription.ar
                      : requestDemoContent.formDescription.en}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 py-6 sm:px-8 sm:py-8">
                  <RecaptchaProvider>
                    <SubscriptionRequestForm locale={locale} />
                  </RecaptchaProvider>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground text-sm">
                  {isAr
                    ? "عندك حساب بالفعل؟ يمكنك الدخول مباشرة."
                    : "Already have an account? You can sign in directly."}
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild variant="brandOutline">
                    <Link href={`${p}/pricing`}>{isAr ? "عرض الأسعار" : "View pricing"}</Link>
                  </Button>
                  <Button asChild variant="brandOutline">
                    <Link href={`${p}/login`}>{isAr ? "تسجيل الدخول" : "Login"}</Link>
                  </Button>
                </div>
              </div>
            </FadeIn>
          </div>

          <aside className="relative hidden overflow-hidden rounded-[2rem] border border-slate-200/70 bg-gradient-to-br from-sky-50 via-white to-indigo-50/70 p-8 text-slate-950 shadow-xl shadow-sky-100/40 lg:sticky lg:top-24 lg:block dark:border-white/10 dark:from-neutral-950 dark:via-neutral-900 dark:to-slate-900 dark:text-white dark:shadow-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-200/70 via-sky-50/50 to-indigo-100/70 dark:from-indigo-900/20 dark:via-transparent dark:to-transparent" />
            <div className="marketing-grid-pattern absolute inset-0 opacity-[0.04] dark:opacity-[0.05]" />

            <div className="relative">
              <FadeIn>
                <LogoMark className="mb-6" frameClassName="rounded-xl p-0" imageClassName="h-10" />
                <h2 className="text-3xl leading-tight font-bold">
                  {isAr ? requestDemoContent.sideTitle.ar : requestDemoContent.sideTitle.en}
                </h2>
                <p className="mt-4 max-w-md text-sm leading-7 text-slate-600 dark:text-white/70">
                  {isAr ? requestDemoContent.sideDescription.ar : requestDemoContent.sideDescription.en}
                </p>
              </FadeIn>

              <StaggerContainer className="mt-8 space-y-4">
                {highlights.map((item) => (
                  <StaggerItem key={item.title}>
                    <div className="rounded-2xl border border-slate-200/70 bg-white/75 p-4 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-700 dark:text-sky-300">
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-white/65">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>

              <FadeIn>
                <div className="mt-8 rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {isAr
                      ? requestDemoContent.secondaryCtaTitle.ar
                      : requestDemoContent.secondaryCtaTitle.en}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/65">
                    {isAr
                      ? requestDemoContent.secondaryCtaDescription.ar
                      : requestDemoContent.secondaryCtaDescription.en}
                  </p>
                  <div className="mt-4">
                    <Button
                      asChild
                      variant="brandOutline"
                      className="w-full border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:hover:text-white">
                      <Link href={`${p}/plans`}>
                        {isAr
                          ? requestDemoContent.secondaryCtaLabel.ar
                          : requestDemoContent.secondaryCtaLabel.en}
                      </Link>
                    </Button>
                  </div>
                </div>
              </FadeIn>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
