import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { marketingMetadata } from "@/lib/marketing/seo";
import { getAppLocale } from "@/lib/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    path: "/support",
    titleAr: "الدعم الفني | طاقم",
    titleEn: "Support | Taqam",
    descriptionAr: "قنوات الدعم الفني، ساعات العمل، وسياسة الاستجابة حسب الباقة.",
    descriptionEn: "Support channels, working hours, and response policy based on plan.",
  });
}

export default async function SupportPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@taqam.com";

  return (
    <main className="bg-background">
      <section className="container mx-auto px-4 py-14">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">{isAr ? "الدعم الفني" : "Support"}</h1>
          <p className="mt-3 text-muted-foreground">
            {isAr
              ? "قنوات التواصل وسياسة الاستجابة بشكل واضح — عشان حل المشاكل يبقى أسرع."
              : "Contact channels and response policy — so issues get resolved faster."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href={`${p}/request-demo`}>
              <Button variant="brand">{isAr ? "طلب تواصل" : "Contact us"}</Button>
            </Link>
            <Link href={`${p}/faq`}>
              <Button variant="outline">{isAr ? "الأسئلة الشائعة" : "FAQ"}</Button>
            </Link>
            <Link href={`${p}/help-center`}>
              <Button variant="secondary">{isAr ? "مركز المساعدة" : "Help Center"}</Button>
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "قنوات التواصل" : "Contact channels"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                {isAr ? "البريد" : "Email"}: {" "}
                <a className="text-foreground underline" href={`mailto:${supportEmail}`}>
                  {supportEmail}
                </a>
              </p>
              <p>
                {isAr
                  ? "لو عندك شركة بالفعل: شاركنا اسم الشركة (slug) + وصف المشكلة + لقطة شاشة (إن أمكن)."
                  : "If you already have a tenant: share the company slug + a clear issue description + a screenshot (if possible)."}
              </p>
              <p>
                {isAr
                  ? "معلومة مهمة: لو المشكلة خاصة بالموبايل، أرسل أيضًا x-device-id وإصدار التطبيق."
                  : "Tip: for mobile issues, include x-device-id and app version."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "ساعات العمل" : "Working hours"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                {isAr
                  ? "الأحد – الخميس: 9:00 ص إلى 6:00 م (بتوقيت السعودية)"
                  : "Sun – Thu: 9:00 AM to 6:00 PM (KSA time)"}
              </p>
              <p>
                {isAr
                  ? "الاستجابة تختلف حسب الباقة، ويمكن إضافة SLA مخصص لباقة المؤسسات."
                  : "Response times vary by plan; Enterprise can include custom SLA."}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mx-auto mt-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "سياسة الاستجابة (مبدئية)" : "Response policy (baseline)"}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
              <div className="rounded-lg border bg-background p-4">
                <p className="font-medium text-foreground">Starter</p>
                <p className="mt-1">{isAr ? "خلال 48 ساعة عمل" : "Within 48 business hours"}</p>
              </div>
              <div className="rounded-lg border bg-background p-4">
                <p className="font-medium text-foreground">Business</p>
                <p className="mt-1">{isAr ? "خلال 24 ساعة عمل" : "Within 24 business hours"}</p>
              </div>
              <div className="rounded-lg border bg-background p-4">
                <p className="font-medium text-foreground">Enterprise</p>
                <p className="mt-1">{isAr ? "SLA مخصص + قناة مباشرة" : "Custom SLA + direct channel"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
