import { getPricingData, type MarketingPricingPlan } from "@/lib/marketing/pricing";

export type FaqItem = {
  qAr: string;
  qEn: string;
  aAr: string;
  aEn: string;
};

export type FaqCategory = {
  emoji: string;
  titleAr: string;
  titleEn: string;
  faqs: FaqItem[];
};

export const faqCategories = [
  {
    emoji: "🚀",
    titleAr: "البدء والإعداد",
    titleEn: "Getting started",
    faqs: [
      {
        qAr: "كيف أبدأ؟ هل يوجد تجربة مجانية؟",
        qEn: "How do I get started? Is there a free trial?",
        aAr: "اطلب عرضًا تجريبيًا وسنجهّز لك بيئة كاملة خلال يوم عمل واحد. التجربة تشمل جميع مميزات الباقة المناسبة لك بدون أي التزام مسبق.",
        aEn:
          "Request a demo and we'll set up a full environment for you within one business day — no commitment required."
      },
      {
        qAr: "كيف أضيف موظفين جدد؟",
        qEn: "How do I add new employees?",
        aAr: "من قائمة 'الموظفون'، تستطيع إضافة موظف يدويًا أو استيراد ملف Excel/CSV بضغطة واحدة. يمكنك إدخال البيانات الوظيفية والشخصية والراتب في خطوة واحدة.",
        aEn:
          "From the Employees section, add employees manually or import from Excel/CSV in one click, with all work, personal, and salary data in a single step."
      },
      {
        qAr: "هل يمكن استيراد بياناتي الموجودة من Excel؟",
        qEn: "Can I import my existing data from Excel?",
        aAr: "نعم. يدعم النظام استيراد بيانات الموظفين من ملفات Excel/CSV مع قوالب جاهزة تسهّل العملية.",
        aEn: "Yes. Import employee data from Excel/CSV with ready-made templates."
      },
      {
        qAr: "كيف أضبط أوقات الدوام والورديات؟",
        qEn: "How do I configure work hours and shifts?",
        aAr: "من إعدادات 'الورديات'، حدد أوقات البداية والنهاية وأيام العمل وفترات الراحة، ثم وزّع الموظفين على الورديات المناسبة.",
        aEn:
          "From 'Shifts' settings, define start/end times, work days, and breaks, then assign employees to the right shift."
      }
    ]
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
        aEn:
          "Yes. The mobile app lets employees check in/out and view their history, with optional location verification."
      },
      {
        qAr: "كيف أسجّل إجازة لموظف أو أوافق على طلب؟",
        qEn: "How do I record leave or approve a request?",
        aAr: "الموظف يرسل طلب الإجازة من لوحة التحكم أو التطبيق، والمسؤول يوافق أو يرفض من صفحة 'طلبات الإجازة'. يُخصم الرصيد تلقائيًا.",
        aEn:
          "Employees submit leave requests from the dashboard or app; managers approve or reject from 'Leave Requests'. Balances update automatically."
      }
    ]
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
        aEn:
          "From 'Payroll', select a period, review allowances and deductions, then approve and send payslips or export a WPS file directly."
      },
      {
        qAr: "هل يمكنني طباعة أو تحميل كشف راتب الموظف؟",
        qEn: "Can I print or download payslips?",
        aAr: "نعم. تستطيع طباعة كشف الراتب بتنسيق احترافي أو تحميله كـ PDF وإرساله للموظف مباشرة من النظام.",
        aEn:
          "Yes. Payslips can be printed or downloaded as PDF and sent to employees directly from the system."
      }
    ]
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
        aEn:
          "Taqam currently uses role-based access inside each company, such as tenant admin, HR manager, manager, and employee. Each role gets access aligned with its responsibilities."
      },
      {
        qAr: "هل بياناتي آمنة وخاصة؟",
        qEn: "Is my data secure and private?",
        aAr: "نعم. بيانات كل شركة معزولة تمامًا ولا تُشارَك مع شركات أخرى. جميع الاتصالات مشفّرة.",
        aEn: "Yes. Each company's data is fully isolated and never shared. All connections are encrypted."
      }
    ]
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
        aEn:
          "Yes. The dashboard shows attendance, absences, and payroll costs, with a reports page that supports data export."
      },
      {
        qAr: "هل يدعم النظام الواجهة العربية بالكامل؟",
        qEn: "Does the system fully support Arabic?",
        aAr: "نعم. الواجهة تدعم العربية بالكامل مع اتجاه من اليمين لليسار (RTL)، ويمكن التبديل بين العربية والإنجليزية في أي وقت.",
        aEn:
          "Yes. The interface fully supports Arabic with right-to-left (RTL) layout, and you can switch between Arabic and English at any time."
      },
      {
        qAr: "هل يمكن استخدام النظام من الجوال والكمبيوتر؟",
        qEn: "Does it work on mobile and desktop?",
        aAr: "واجهة الويب تعمل على جميع الأجهزة بشكل كامل، ويوجد تطبيق جوال مخصص للموظفين لتسجيل الحضور ومتابعة طلباتهم.",
        aEn:
          "The web interface works on all devices, and a dedicated mobile app is available for employee check-in and request tracking."
      }
    ]
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
        aEn:
          "Starter: employees, attendance, leave. Business: adds payroll, WPS, advanced roles. Enterprise: custom integrations, reports, and tailored features."
      },
      {
        qAr: "كيف أتواصل مع الدعم الفني لو واجهتني مشكلة؟",
        qEn: "How do I reach support if I have an issue?",
        aAr: "من صفحة الدعم الفني داخل النظام أو من صفحة الدعم على الموقع. أرسل التفاصيل وسيتابعها فريق الدعم حتى الحل.",
        aEn:
          "Use the in-product support page or the public support page on the website. Send the details and the support team will follow the issue through to resolution."
      }
    ]
  }
] satisfies FaqCategory[];

function getCorePricingFaqPlans(plans: MarketingPricingPlan[]) {
  const preferredPlanOrder = ["BASIC", "PROFESSIONAL", "ENTERPRISE"] as const;

  return preferredPlanOrder
    .map((planType) => plans.find((plan) => plan.planType === planType))
    .filter((plan): plan is MarketingPricingPlan => Boolean(plan));
}

const DIFFERENTIATOR_FEATURE_PATTERN =
  /(بوابة التوظيف|التوظيف|المتقدمين|careers portal|applicant|recruitment)/i;

function summarizePlanFeatures(features: string[]) {
  const normalized = features
    .map((feature) => feature.trim())
    .filter(Boolean);

  const selected = normalized.slice(0, 2);
  const differentiator = normalized.find(
    (feature) => DIFFERENTIATOR_FEATURE_PATTERN.test(feature) && !selected.includes(feature)
  );

  if (differentiator) {
    selected.push(differentiator);
  }

  return selected.length > 0 ? selected.join("، ") : "حسب نطاق التشغيل";
}

export function buildPricingFaqPlanAnswer(plans: MarketingPricingPlan[]) {
  const corePlans = getCorePricingFaqPlans(plans);

  if (corePlans.length === 0) {
    return {
      ar: "تختلف الباقات حسب مستوى التشغيل المطلوب. راجع صفحة الأسعار للحصول على أحدث التفاصيل والميزات وحدود كل باقة.",
      en: "Plans differ by the level of operations you need. Visit the pricing page for the latest details, features, and limits for each plan."
    };
  }

  return {
    ar: `${corePlans
      .map((plan) => `${plan.nameAr}: ${summarizePlanFeatures(plan.featuresAr)}`)
      .join(". ")}. التفاصيل والأسعار المحدثة تظهر دائمًا في صفحة الأسعار.`,
    en: `${corePlans
      .map((plan) => `${plan.name}: ${summarizePlanFeatures(plan.featuresEn)}`)
      .join(". ")}. The latest pricing and plan details are always reflected on the pricing page.`
  };
}

export function applyPricingFaqAnswers(
  categories: FaqCategory[],
  plans: MarketingPricingPlan[]
): FaqCategory[] {
  const pricingAnswer = buildPricingFaqPlanAnswer(plans);

  return categories.map((category) => ({
    ...category,
    faqs: category.faqs.map((faq) =>
      faq.qEn === "What's the difference between the three plans?"
        ? {
            ...faq,
            aAr: pricingAnswer.ar,
            aEn: pricingAnswer.en
          }
        : faq
    )
  }));
}

export async function getFaqCategories(): Promise<FaqCategory[]> {
  const { plans } = await getPricingData();
  return applyPricingFaqAnswers(faqCategories, plans);
}
