import type { Metadata } from "next";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { JsonLd } from "@/components/marketing/json-ld";
import { faqSchema } from "@/lib/marketing/schema";
import { marketingMetadata } from "@/lib/marketing/seo";
import { getAppLocale } from "@/lib/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    path: "/faq",
    titleAr: "الأسئلة الشائعة | طاقم",
    titleEn: "FAQ | Taqam",
    descriptionAr: "إجابات على الأسئلة الشائعة حول طاقم: التفعيل، التسعير، الدعم، والأمان.",
    descriptionEn: "Frequently asked questions about Taqam: onboarding, pricing, support, and security.",
  });
}

const faqs = [
  {
    qAr: "هل طاقم مناسب للشركات الصغيرة والمتوسطة؟",
    qEn: "Is Taqam suitable for small and mid-sized companies?",
    aAr: "نعم. تقدر تبدأ بسرعة على باقة مناسبة، ومع النمو تنتقل لباقات أكبر بدون فقد بيانات أو إعادة إعدادات.",
    aEn: "Yes. You can start quickly on a plan that fits your size and upgrade later without losing data or reconfiguring everything.",
  },
  {
    qAr: "هل الواجهة تدعم عربي/إنجليزي بشكل كامل؟",
    qEn: "Does the UI fully support Arabic/English?",
    aAr: "نعم، مع دعم RTL للعربية. التبديل يغيّر اللغة والاتجاه بشكل صحيح عبر الويب.",
    aEn: "Yes, including RTL for Arabic. Switching updates both language and direction across the web UI.",
  },
  {
    qAr: "هل النظام متعدد الشركات (Multi-tenant)؟",
    qEn: "Is it multi-tenant?",
    aAr: "نعم. كل شركة تعمل داخل مساحة معزولة مع مستخدمين وصلاحيات وإعدادات مستقلة.",
    aEn: "Yes. Each company runs in an isolated workspace with separate users, permissions, and settings.",
  },
  {
    qAr: "كيف يتم إنشاء شركة (Tenant) جديدة؟",
    qEn: "How do I create a new tenant?",
    aAr: "يتم تجهيز Tenant عند التفعيل/الديمو، أو من لوحة تحكم الـ Super Admin حسب الإعداد.",
    aEn: "A tenant can be provisioned during onboarding/demo, or via Super Admin tools depending on setup.",
  },
  {
    qAr: "هل يوجد نظام أدوار وصلاحيات؟",
    qEn: "Do you support roles and permissions?",
    aAr: "نعم، يوجد أدوار وصلاحيات لتحديد من يرى/يدير الموارد البشرية والرواتب والحضور.",
    aEn: "Yes. Roles help control who can manage HR, payroll, attendance and related settings.",
  },
  {
    qAr: "هل يمكن ربط الحضور بالموقع (Geofence)؟",
    qEn: "Can attendance be restricted by location (geofence)?",
    aAr: "نعم، يمكن ضبط مواقع العمل وسياسات الحضور، ويتم التحقق منها على السيرفر.",
    aEn: "Yes. Work locations and attendance policies can be configured and are enforced server-side.",
  },
  {
    qAr: "هل يوجد تطبيق جوال؟",
    qEn: "Is there a mobile app?",
    aAr: "يوجد تطبيق جوال (Expo) مع تسجيل حضور/انصراف وتاريخ، مع نظام توكنات منفصل وآمن.",
    aEn: "A mobile app (Expo) is available for check-in/out and history, with a separate secure token flow.",
  },
  {
    qAr: "كيف يعمل تسجيل الدخول؟",
    qEn: "How does authentication work?",
    aAr: "الويب يستخدم NextAuth، والجوال يستخدم Bearer JWT + Refresh Tokens (تخزين آمن + تدوير) وربط بالجهاز.",
    aEn: "Web uses NextAuth. Mobile uses Bearer JWT + refresh tokens (secure storage + rotation) with device binding.",
  },
  {
    qAr: "هل بياناتي آمنة؟",
    qEn: "Is my data secure?",
    aAr: "نطبق عزل الشركات، وتخزين آمن للـ refresh tokens (hash فقط)، وتسجيل عمليات مهمة حسب الإعداد.",
    aEn: "We enforce tenant isolation, store refresh tokens hashed (never raw), and can audit important actions depending on configuration.",
  },
  {
    qAr: "هل يوجد تصدير للرواتب (WPS)؟",
    qEn: "Do you support payroll exports (WPS)?",
    aAr: "متاح ضمن الباقات التي تشمل الرواتب والتصدير، ويمكن تخصيص صيغ التصدير حسب احتياجك.",
    aEn: "Available in plans that include payroll/export, and formats can be customized as needed.",
  },
  {
    qAr: "هل يمكن استيراد البيانات من Excel؟",
    qEn: "Can I import data from Excel?",
    aAr: "نعم، يوجد استيراد للبيانات الأساسية، ويمكن مساعدتك في تجهيز القوالب أثناء التفعيل.",
    aEn: "Yes. Core data import is supported, and onboarding can help you prepare templates.",
  },
  {
    qAr: "هل يوجد API أو تكاملات؟",
    qEn: "Do you offer an API or integrations?",
    aAr: "باقة المؤسسات تدعم تكاملات وتخصيصات حسب الحاجة، ويمكن إضافة API Access حسب العقد.",
    aEn: "Enterprise can include custom integrations and optional API access depending on your agreement.",
  },
  {
    qAr: "كيف يتم التسعير؟",
    qEn: "How does pricing work?",
    aAr: "التسعير يعتمد على حجم الشركة والميزات المطلوبة. راجع صفحة الأسعار أو اطلب عرضًا.",
    aEn: "Pricing depends on team size and required modules. Check pricing or request a quote." ,
  },
  {
    qAr: "كيف أتواصل مع الدعم؟",
    qEn: "How do I contact support?",
    aAr: "من صفحة الدعم الفني أو عبر البريد. اذكر الـ slug ووصف المشكلة والخطوات ولقطة شاشة إن أمكن.",
    aEn: "Use the Support page or email. Include your tenant slug, steps to reproduce, and a screenshot if possible.",
  },
  {
    qAr: "هل يمكن طلب تخصيصات؟",
    qEn: "Can I request customizations?",
    aAr: "أكيد. باقة المؤسسات تشمل تكاملات وتخصيصات حسب احتياجك.",
    aEn: "Absolutely. Enterprise can include custom workflows, integrations and UI changes.",
  },
];

export default async function FaqPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";

  const localizedFaqs = faqs.map((f) => ({
    q: isAr ? f.qAr : f.qEn,
    a: isAr ? f.aAr : f.aEn,
  }));

  return (
    <main className="bg-background">
      <section className="container mx-auto px-4 py-14">
        <JsonLd data={faqSchema(localizedFaqs)} />
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">{isAr ? "الأسئلة الشائعة" : "FAQ"}</h1>
          <p className="mt-3 text-muted-foreground">
            {isAr ? "لو سؤالك مش موجود، ابعتلنا من صفحة الدعم." : "If your question isn’t listed, contact us via Support."}
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-xl border bg-background p-2">
          <Accordion type="single" collapsible>
            {localizedFaqs.map((f, idx) => (
              <AccordionItem key={f.q} value={`item-${idx}`}>
                <AccordionTrigger className="px-4">{f.q}</AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </main>
  );
}
