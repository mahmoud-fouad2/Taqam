import type { Metadata } from "next";
import { HelpCircle, MessageCircle } from "lucide-react";

import { MarketingPageCta } from "@/components/marketing/page-cta";
import { MarketingPageHero } from "@/components/marketing/page-hero";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { JsonLd } from "@/components/marketing/json-ld";
import { faqSchema } from "@/lib/marketing/schema";
import { marketingMetadata } from "@/lib/marketing/seo";
import { getAppLocale } from "@/lib/i18n/locale";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/fade-in";

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    path: "/faq",
    titleAr: "الأسئلة الشائعة | طاقم",
    titleEn: "FAQ | Taqam",
    descriptionAr: "إجابات على الأسئلة الشائعة حول طاقم: البدء، الرواتب، الحضور، الإجازات، والأمان.",
    descriptionEn: "Frequently asked questions about Taqam: onboarding, payroll, attendance, leave, and security.",
  });
}

const faqCategories = [
  {
    emoji: "🚀",
    titleAr: "البدء والإعداد",
    titleEn: "Getting started",
    faqs: [
      {
        qAr: "كيف أبدأ؟ هل يوجد تجربة مجانية؟",
        qEn: "How do I get started? Is there a free trial?",
        aAr: "اطلب عرضًا تجريبيًا وسنجهّز لك بيئة كاملة خلال يوم عمل واحد. التجربة تشمل جميع مميزات الباقة المناسبة لك بدون أي التزام مسبق.",
        aEn: "Request a demo and we'll set up a full environment for you within one business day — no commitment required.",
      },
      {
        qAr: "كيف أضيف موظفين جدد؟",
        qEn: "How do I add new employees?",
        aAr: "من قائمة 'الموظفون'، تستطيع إضافة موظف يدويًا أو استيراد ملف Excel/CSV بضغطة واحدة. يمكنك إدخال البيانات الوظيفية والشخصية والراتب في خطوة واحدة.",
        aEn: "From the Employees section, add employees manually or import from Excel/CSV in one click, with all work, personal, and salary data in a single step.",
      },
      {
        qAr: "هل يمكن استيراد بياناتي الموجودة من Excel؟",
        qEn: "Can I import my existing data from Excel?",
        aAr: "نعم. يدعم النظام استيراد بيانات الموظفين وأرصدة الإجازات من ملفات Excel/CSV مع قوالب جاهزة تسهّل العملية.",
        aEn: "Yes. Import employees, leave balances, and more from Excel/CSV with ready-made templates.",
      },
      {
        qAr: "كيف أضبط أوقات الدوام والورديات؟",
        qEn: "How do I configure work hours and shifts?",
        aAr: "من إعدادات 'الورديات'، حدد أوقات البداية والنهاية وأيام العمل وفترات الراحة، ثم وزّع الموظفين على الورديات المناسبة.",
        aEn: "From 'Shifts' settings, define start/end times, work days, and breaks, then assign employees to the right shift.",
      },
    ],
  },
  {
    emoji: "⏰",
    titleAr: "الحضور والإجازات",
    titleEn: "Attendance & Leave",
    faqs: [
      {
        qAr: "هل يمكن للموظف تسجيل الحضور من الجوال؟",
        qEn: "Can employees check in via mobile?",
        aAr: "نعم. يوجد تطبيق جوال يتيح للموظفين تسجيل الحضور والانصراف وعرض السجل، مع إمكانية تحديد المواقع الجغرافية المسموح بها.",
        aEn: "Yes. The mobile app lets employees check in/out and view their history, with optional location verification.",
      },
      {
        qAr: "كيف أسجّل إجازة لموظف أو أوافق على طلب؟",
        qEn: "How do I record leave or approve a request?",
        aAr: "الموظف يرسل طلب الإجازة من لوحة التحكم أو التطبيق، والمسؤول يوافق أو يرفض من صفحة 'طلبات الإجازة'. يُخصم الرصيد تلقائيًا.",
        aEn: "Employees submit leave requests from the dashboard or app; managers approve or reject from 'Leave Requests'. Balances update automatically.",
      },
    ],
  },
  {
    emoji: "💰",
    titleAr: "الرواتب",
    titleEn: "Payroll",
    faqs: [
      {
        qAr: "كيف يتم صرف الرواتب؟",
        qEn: "How do I run payroll?",
        aAr: "من صفحة 'الرواتب'، حدد فترة المسير وراجع الاستحقاقات والاستقطاعات، ثم اعتمد وأرسل قسائم الرواتب أو صدّر ملف WPS مباشرة.",
        aEn: "From 'Payroll', select a period, review allowances and deductions, then approve and send payslips or export a WPS file directly.",
      },
      {
        qAr: "هل يمكنني طباعة أو تحميل كشف راتب الموظف؟",
        qEn: "Can I print or download payslips?",
        aAr: "نعم. تستطيع طباعة كشف الراتب بتنسيق احترافي أو تحميله كـ PDF وإرساله للموظف مباشرة من النظام.",
        aEn: "Yes. Payslips can be printed or downloaded as PDF and sent to employees directly from the system.",
      },
    ],
  },
  {
    emoji: "🔒",
    titleAr: "الصلاحيات والأمان",
    titleEn: "Permissions & Security",
    faqs: [
      {
        qAr: "هل يمكن إعطاء صلاحيات مختلفة لكل مستخدم؟",
        qEn: "Can I set different permissions for each user?",
        aAr: "حاليًا يعتمد طاقم على الصلاحيات بحسب الدور الوظيفي داخل الشركة مثل مدير الشركة، الموارد البشرية، المدير، والموظف. كل دور له نطاق وصول مناسب لوظيفته.",
        aEn: "Taqam currently uses role-based access inside each company, such as tenant admin, HR manager, manager, and employee. Each role gets access aligned with its responsibilities.",
      },
      {
        qAr: "هل بياناتي آمنة وخاصة؟",
        qEn: "Is my data secure and private?",
        aAr: "نعم. بيانات كل شركة معزولة تمامًا ولا تُشارَك مع شركات أخرى. جميع الاتصالات مشفّرة.",
        aEn: "Yes. Each company's data is fully isolated and never shared. All connections are encrypted.",
      },
    ],
  },
  {
    emoji: "📊",
    titleAr: "التقارير والتقنية",
    titleEn: "Reports & Tech",
    faqs: [
      {
        qAr: "هل يوجد تقارير وإحصاءات؟",
        qEn: "Are there reports and analytics?",
        aAr: "نعم. لوحة التحكم تعرض إحصاءات الحضور والغياب وتكاليف الرواتب، وصفحة التقارير تتيح تصدير البيانات بتنسيقات متعددة.",
        aEn: "Yes. The dashboard shows attendance, absences, and payroll costs, with a reports page that supports data export.",
      },
      {
        qAr: "هل يدعم النظام الواجهة العربية بالكامل؟",
        qEn: "Does the system fully support Arabic?",
        aAr: "نعم. الواجهة تدعم العربية بالكامل مع اتجاه من اليمين لليسار (RTL)، ويمكن التبديل بين العربية والإنجليزية في أي وقت.",
        aEn: "Yes. The interface fully supports Arabic with right-to-left (RTL) layout, and you can switch between Arabic and English at any time.",
      },
      {
        qAr: "هل يمكن استخدام النظام من الجوال والكمبيوتر؟",
        qEn: "Does it work on mobile and desktop?",
        aAr: "واجهة الويب تعمل على جميع الأجهزة بشكل كامل، ويوجد تطبيق جوال مخصص للموظفين لتسجيل الحضور ومتابعة طلباتهم.",
        aEn: "The web interface works on all devices, and a dedicated mobile app is available for employee check-in and request tracking.",
      },
    ],
  },
  {
    emoji: "💳",
    titleAr: "الأسعار والدعم",
    titleEn: "Pricing & Support",
    faqs: [
      {
        qAr: "ما الفرق بين الباقات الثلاثة؟",
        qEn: "What's the difference between the three plans?",
        aAr: "الأساسية: موظفون + حضور + إجازات. الأعمال: كل ما سبق + رواتب + WPS + صلاحيات متقدمة. المؤسسات: تكاملات مخصصة وتقارير وواجهة حسب احتياجك.",
        aEn: "Starter: employees, attendance, leave. Business: adds payroll, WPS, advanced roles. Enterprise: custom integrations, reports, and tailored features.",
      },
      {
        qAr: "كيف أتواصل مع الدعم الفني لو واجهتني مشكلة؟",
        qEn: "How do I reach support if I have an issue?",
        aAr: "من صفحة الدعم الفني داخل النظام أو من صفحة الدعم على الموقع. أرسل التفاصيل وسيتابعها فريق الدعم حتى الحل.",
        aEn: "Use the in-product support page or the public support page on the website. Send the details and the support team will follow the issue through to resolution.",
      },
    ],
  },
];

export default async function FaqPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";

  const allFaqs = faqCategories.flatMap((c) =>
    c.faqs.map((f) => ({ q: isAr ? f.qAr : f.qEn, a: isAr ? f.aAr : f.aEn }))
  );

  return (
    <main className="bg-background">
      <JsonLd data={faqSchema(allFaqs)} />

      <FadeIn>
        <MarketingPageHero
          icon={HelpCircle}
          badge={isAr ? "إجابات مركزة وسريعة" : "Focused answers, fast access"}
          title={isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
          description={
            isAr
              ? "كل ما تحتاج معرفته عن طاقم في مكان واحد. لو سؤالك غير موجود هنا، تواصل معنا مباشرة أو انتقل لمركز المساعدة."
              : "Everything you need to know about Taqam in one place. If your question is not here, reach out directly or move to the help center."
          }
          actions={[
            { href: `${p}/help-center`, label: isAr ? "مركز المساعدة" : "Help Center", variant: "brand" },
            { href: `${p}/request-demo`, label: isAr ? "اطلب عرضًا" : "Request a demo", variant: "outline" },
          ]}
          stats={[
            { value: `${faqCategories.length}`, label: isAr ? "فئات" : "Categories" },
            { value: `${allFaqs.length}+`, label: isAr ? "إجابة" : "Answers" },
            { value: isAr ? "ثنائي اللغة" : "Bilingual", label: isAr ? "اللغة" : "Language" },
          ]}
        />
      </FadeIn>

      {/* ── FAQ CATEGORIES ── */}
      <section className="container mx-auto px-4 py-14">
        <StaggerContainer className="mx-auto max-w-3xl space-y-8">
          {faqCategories.map((cat) => (
            <StaggerItem key={cat.titleEn}>
              <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                {/* Category header */}
                <div className="flex items-center gap-3 border-b bg-muted/40 px-5 py-4">
                  <div>
                    <h2 className="font-semibold">{isAr ? cat.titleAr : cat.titleEn}</h2>
                    <p className="text-xs text-muted-foreground">{isAr ? cat.titleEn : cat.titleAr}</p>
                  </div>
                  <span className="ms-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {cat.faqs.length}
                  </span>
                </div>
                {/* Accordion */}
                <div className="px-2 py-1">
                  <Accordion type="single" collapsible>
                    {cat.faqs.map((f, idx) => (
                      <AccordionItem
                        key={idx}
                        value={`${cat.titleEn}-${idx}`}
                        className="border-b last:border-b-0"
                      >
                        <AccordionTrigger className="px-3 text-start leading-snug hover:no-underline">
                          {isAr ? f.qAr : f.qEn}
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-4 leading-relaxed text-muted-foreground">
                          {isAr ? f.aAr : f.aEn}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      <FadeIn>
        <MarketingPageCta
        icon={MessageCircle}
        title={isAr ? "لم تجد إجابتك؟" : "Still have questions?"}
        description={
          isAr
            ? "فريق الدعم جاهز يساعدك في الأسئلة التشغيلية أو طلبات التفعيل، ويمكننا أيضًا ترتيب عرض عملي إذا كنت تقيم المنصة."
            : "The support team can help with operational questions or activation issues, and we can also arrange a practical demo if you're still evaluating the platform."
        }
        primaryAction={{ href: `${p}/support`, label: isAr ? "تواصل مع الدعم" : "Contact support" }}
        secondaryAction={{ href: `${p}/request-demo`, label: isAr ? "اطلب عرضًا" : "Request a demo" }}
      />
      </FadeIn>
    </main>
  );
}
