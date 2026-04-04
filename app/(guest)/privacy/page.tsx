import type { Metadata } from "next";

import { marketingMetadata } from "@/lib/marketing/seo";
import { getAppLocale } from "@/lib/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    titleAr: "سياسة الخصوصية | طاقم",
    titleEn: "Privacy Policy | Taqam",
    descriptionAr: "تعرف على سياسة الخصوصية وكيفية تعامل طاقم مع البيانات.",
    descriptionEn: "Learn how Taqam handles and protects your data.",
    path: "/privacy",
  });
}

export default async function PrivacyPage() {
  const locale = await getAppLocale();

  const isAr = locale === "ar";

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">{isAr ? "سياسة الخصوصية" : "Privacy Policy"}</h1>
      <p className="mt-3 text-muted-foreground">
        {isAr
          ? "توضح هذه الصفحة كيفية جمع البيانات واستخدامها وحمايتها عند استخدام منصة طاقم."
          : "This page explains how Taqam collects, uses, and protects data."}
      </p>

      <div className="mt-10 space-y-8 text-sm leading-7 text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            {isAr ? "1) البيانات التي نجمعها" : "1) Data we collect"}
          </h2>
          <p>
            {isAr
              ? "قد نجمع بيانات الحساب (مثل البريد الإلكتروني) وبيانات الاستخدام وبيانات فنية (مثل نوع المتصفح) لتحسين الخدمة."
              : "We may collect account data (e.g., email), usage data, and technical data (e.g., browser type) to improve the service."}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            {isAr ? "2) كيف نستخدم البيانات" : "2) How we use data"}
          </h2>
          <p>
            {isAr
              ? "نستخدم البيانات لتقديم الخدمة، تحسين تجربة المستخدم، دعم العملاء، والالتزام بالمتطلبات القانونية عند الحاجة."
              : "We use data to provide the service, improve user experience, support customers, and comply with legal requirements when needed."}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            {isAr ? "3) مشاركة البيانات" : "3) Data sharing"}
          </h2>
          <p>
            {isAr
              ? "لا نبيع البيانات. قد نشارك بيانات محدودة مع مزودي خدمات موثوقين (مثل الاستضافة) فقط لتشغيل المنصة وبما يتوافق مع السياسة."
              : "We do not sell data. We may share limited data with trusted service providers (e.g., hosting) only to operate the platform, consistent with this policy."}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            {isAr ? "4) الأمان" : "4) Security"}
          </h2>
          <p>
            {isAr
              ? "نتبع ممارسات أمنية مناسبة لحماية البيانات، لكن لا يوجد نظام آمن بنسبة 100%."
              : "We follow appropriate security practices, but no system is 100% secure."}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            {isAr ? "5) التواصل" : "5) Contact"}
          </h2>
          <p>
            {isAr
              ? "للاستفسارات المتعلقة بالخصوصية، تواصل معنا من خلال صفحة الدعم."
              : "For privacy inquiries, contact us through the support page."}
          </p>
        </section>
      </div>
    </main>
  );
}
