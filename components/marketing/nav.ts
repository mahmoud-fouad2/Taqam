import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CircleHelp,
  Clock3,
  FileText,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  MessagesSquare,
  ReceiptText,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards
} from "lucide-react";

export type MarketingNavLink = {
  href: string;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  icon: LucideIcon;
};

export type MarketingNavSection = {
  titleAr: string;
  titleEn: string;
  items: MarketingNavLink[];
};

export type MarketingNavSpotlight = {
  badgeAr: string;
  badgeEn: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  href: string;
  ctaAr: string;
  ctaEn: string;
  tagsAr: string[];
  tagsEn: string[];
};

export type MarketingNavItem = {
  href: string;
  labelAr: string;
  labelEn: string;
  sections?: MarketingNavSection[];
  spotlight?: MarketingNavSpotlight;
};

export const marketingNav: MarketingNavItem[] = [
  { href: "/", labelAr: "الرئيسية", labelEn: "Home" },
  {
    href: "/features",
    labelAr: "المنتج",
    labelEn: "Product",
    sections: [
      {
        titleAr: "استكشف",
        titleEn: "Explore",
        items: [
          {
            href: "/features",
            labelAr: "نظرة عامة",
            labelEn: "Overview",
            descAr: "ملخص سريع لوحدات طاقم الأساسية وطريقة عملها معًا.",
            descEn: "A quick overview of Taqam's core modules and how they work together.",
            icon: LayoutDashboard
          },
          {
            href: "/features#core",
            labelAr: "المميزات",
            labelEn: "Features",
            descAr: "شاهد كيف ينظم طاقم الموظفين والحضور والرواتب في مسار واحد.",
            descEn: "See how Taqam connects people, attendance, and payroll in one flow.",
            icon: Sparkles
          },
          {
            href: "/features#integrations",
            labelAr: "التكاملات",
            labelEn: "Integrations",
            descAr: "ربط مباشر مع GOSI وWPS، مع تكاملات مخصصة للمؤسسات عند الطلب.",
            descEn: "Direct GOSI and WPS connections, with custom enterprise integrations on request.",
            icon: ShieldCheck
          }
        ]
      },
      {
        titleAr: "العمليات الأساسية",
        titleEn: "Core Operations",
        items: [
          {
            href: "/features#people",
            labelAr: "الموظفون",
            labelEn: "People",
            descAr: "ملفات الموظفين، الهيكل التنظيمي، والصلاحيات من لوحة واحدة.",
            descEn: "Employee profiles, org structure, and permissions from one dashboard.",
            icon: Users
          },
          {
            href: "/features#attendance",
            labelAr: "الحضور والانصراف",
            labelEn: "Attendance",
            descAr: "دوام، شفتات، تأخيرات، وطلبات يومية بدون تعقيد.",
            descEn: "Attendance, shifts, lateness, and daily requests without extra complexity.",
            icon: Clock3
          },
          {
            href: "/features#payroll",
            labelAr: "الرواتب والامتثال",
            labelEn: "Payroll & Compliance",
            descAr: "رواتب، WPS، وتأمينات في نفس المسار التشغيلي.",
            descEn: "Payroll, WPS, and compliance in the same operational flow.",
            icon: WalletCards
          }
        ]
      }
    ],
    spotlight: {
      badgeAr: "منصة تشغيل واحدة",
      badgeEn: "One operating layer",
      titleAr: "كل شؤون الفريق في تجربة واحدة واضحة",
      titleEn: "Run your whole team from one clear experience",
      descAr: "بدل التنقل بين أدوات منفصلة، طاقم يجمع ملفات الموظفين والحضور والرواتب والتكاملات في مساحة واحدة مفهومة.",
      descEn: "Instead of switching between separate tools, Taqam brings people data, attendance, payroll, and integrations into one clear workspace.",
      href: "/request-demo",
      ctaAr: "شاهد طاقم عمليًا",
      ctaEn: "See Taqam in action",
      tagsAr: ["امتثال سعودي", "واجهة عربية أصلية", "تفعيل سريع"],
      tagsEn: ["Saudi-ready", "Arabic-first UI", "Fast onboarding"]
    }
  },
  {
    href: "/plans",
    labelAr: "الحلول",
    labelEn: "Solutions",
    sections: [
      {
        titleAr: "ابدأ بسرعة",
        titleEn: "Start Fast",
        items: [
          {
            href: "/plans",
            labelAr: "الباقات",
            labelEn: "Plans",
            descAr: "اختر الباقة الأنسب لحجم فريقك ومرحلة نموك.",
            descEn: "Choose the plan that best fits your team size and growth stage.",
            icon: BriefcaseBusiness
          },
          {
            href: "/pricing",
            labelAr: "الأسعار التفصيلية",
            labelEn: "Detailed Pricing",
            descAr: "قارن الأسعار والمزايا التجارية بشكل أوضح قبل البدء.",
            descEn: "Compare pricing and commercial details more clearly before you start.",
            icon: ReceiptText
          },
          {
            href: "/request-demo",
            labelAr: "احجز جلسة تعريف",
            labelEn: "Schedule a walkthrough",
            descAr: "رتّب جلسة مناسبة لطريقة عمل شركتك الحالية.",
            descEn: "Book a walkthrough tailored to how your company works today.",
            icon: Rocket
          }
        ]
      },
      {
        titleAr: "مناسب لـ",
        titleEn: "Best For",
        items: [
          {
            href: "/plans#small-teams",
            labelAr: "الشركات الصغيرة",
            labelEn: "Small Teams",
            descAr: "تشغيل أساسي سريع وواضح من أول يوم.",
            descEn: "A fast, clear operational setup from day one.",
            icon: Building2
          },
          {
            href: "/plans#growing-teams",
            labelAr: "الفرق المتنامية",
            labelEn: "Growing Teams",
            descAr: "تقارير وصلاحيات أوسع مع مرونة أعلى في التشغيل.",
            descEn: "More reports, permissions, and operational flexibility.",
            icon: BriefcaseBusiness
          },
          {
            href: "/plans#enterprises",
            labelAr: "المؤسسات",
            labelEn: "Enterprises",
            descAr: "تكاملات أعمق، دعم أعلى، ومسارات تشغيل أكثر تخصيصًا.",
            descEn: "Deeper integrations, stronger support, and more tailored workflows.",
            icon: Landmark
          }
        ]
      }
    ],
    spotlight: {
      badgeAr: "اختيار أوضح",
      badgeEn: "Clearer fit",
      titleAr: "ابدأ بالخطة المناسبة اليوم ووسّعها مع نمو فريقك",
      titleEn: "Choose the right plan now and scale it as your team grows",
      descAr: "باقات طاقم مرتبة بوضوح لتناسب الشركات الصغيرة والفرق المتنامية والمؤسسات، مع انتقال سهل كلما كبر فريقك.",
      descEn: "Taqam plans are clear for small businesses, growing teams, and enterprises, with a straightforward upgrade path.",
      href: "/pricing",
      ctaAr: "اعرض الباقات والأسعار",
      ctaEn: "View plans and pricing",
      tagsAr: ["من 5 موظفين", "إعداد خلال 24 ساعة", "تدرج واضح"],
      tagsEn: ["From 5 employees", "24h setup", "Clear scaling path"]
    }
  },
  {
    href: "/help-center",
    labelAr: "الموارد",
    labelEn: "Resources",
    sections: [
      {
        titleAr: "الدعم والمعرفة",
        titleEn: "Support & Knowledge",
        items: [
          {
            href: "/help-center",
            labelAr: "مركز المساعدة",
            labelEn: "Help Center",
            descAr: "أدلة استخدام وإعداد سريعة مكتوبة بوضوح.",
            descEn: "Clear usage guides and quick setup documentation.",
            icon: BookOpen
          },
          {
            href: "/faq",
            labelAr: "الأسئلة الشائعة",
            labelEn: "FAQ",
            descAr: "إجابات مباشرة على أكثر الأسئلة تكرارًا قبل التواصل.",
            descEn: "Direct answers to the most common questions before contacting support.",
            icon: CircleHelp
          }
        ]
      }
    ],
    spotlight: {
      badgeAr: "وصول أسرع",
      badgeEn: "Start from clarity",
      titleAr: "موارد واضحة توصلك للمعلومة بسرعة",
      titleEn: "Short, clear resources instead of getting lost across many pages",
      descAr: "جمعنا مركز المساعدة والأسئلة الشائعة في مسار واضح، حتى تصل لما تحتاجه من أول مرة.",
      descEn: "We grouped help and FAQ paths so you can reach the right answer faster.",
      href: "/help-center",
      ctaAr: "افتح مركز المساعدة",
      ctaEn: "Open help center",
      tagsAr: ["أدلة سريعة", "إجابات جاهزة", "FAQ"],
      tagsEn: ["Quick guides", "Ready answers", "FAQ"]
    }
  },
  {
    href: "/support",
    labelAr: "الشركة",
    labelEn: "Company",
    sections: [
      {
        titleAr: "التواصل والثقة",
        titleEn: "Contact & Trust",
        items: [
          {
            href: "/support",
            labelAr: "تواصل معنا",
            labelEn: "Contact Us",
            descAr: "للتواصل التجاري أو التشغيلي مع فريق طاقم مباشرة.",
            descEn: "Reach the Taqam team directly for commercial or operational questions.",
            icon: MessagesSquare
          },
          {
            href: "/privacy",
            labelAr: "الأمان والخصوصية",
            labelEn: "Security & Privacy",
            descAr: "كيف نحمي بيانات الشركات والموظفين داخل المنصة.",
            descEn: "How we protect company and employee data across the platform.",
            icon: ShieldCheck
          }
        ]
      },
      {
        titleAr: "مرجع التشغيل",
        titleEn: "Operational Reference",
        items: [
          {
            href: "/terms",
            labelAr: "الشروط والأحكام",
            labelEn: "Terms & Conditions",
            descAr: "النطاق التشغيلي، المسؤوليات، وضوابط الاستخدام.",
            descEn: "Operational scope, responsibilities, and usage rules.",
            icon: FileText
          },
          {
            href: "/plans",
            labelAr: "الباقات",
            labelEn: "Plans",
            descAr: "مستويات الباقات ومتى تحتاج الترقية.",
            descEn: "Plan tiers and when an upgrade makes sense.",
            icon: ReceiptText
          }
        ]
      }
    ],
    spotlight: {
      badgeAr: "وصول مباشر",
      badgeEn: "Direct access",
      titleAr: "التواصل والسياسات الأساسية في مكان واحد واضح",
      titleEn: "Everything you need from Taqam in one clear place",
      descAr: "كل ما يخص التواصل مع طاقم والسياسات المرجعية أصبح مرتبًا في مسار واحد أوضح وأسهل وصولًا.",
      descEn: "From contact and support to policies and essential references, you can reach the right destination quickly without scattered links.",
      href: "/support",
      ctaAr: "افتح قنوات التواصل",
      ctaEn: "Open contact options",
      tagsAr: ["تواصل", "دعم", "سياسات"],
      tagsEn: ["Contact", "Support", "Policies"]
    }
  },
];
