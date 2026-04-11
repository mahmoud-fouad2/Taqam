import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import { Ban, CheckCircle2, Clock3, FileText, Mail, Scale, Shield, Users } from "lucide-react";

import { MarketingPageCta } from "@/components/marketing/page-cta";
import { MarketingPageHero } from "@/components/marketing/page-hero";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/fade-in";
import { getAppLocale } from "@/lib/i18n/locale";
import { marketingMetadata } from "@/lib/marketing/seo";

type TermsSection = {
  id: string;
  icon: LucideIcon;
  iconClassName: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  bulletsAr: string[];
  bulletsEn: string[];
  noteAr?: string;
  noteEn?: string;
};

const termsSections: TermsSection[] = [
  {
    id: "service-scope",
    icon: FileText,
    iconClassName: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    titleAr: "نطاق الخدمة",
    titleEn: "Scope of Service",
    summaryAr:
      "طاقم منصة تشغيل سحابية لإدارة الموارد البشرية والعمليات المرتبطة بها، ويختلف نطاق التفعيل بحسب الخطة أو الاتفاق التجاري المعتمد.",
    summaryEn:
      "Taqam is a cloud operating platform for HR and related workflows, and the active scope depends on the subscribed plan or commercial agreement.",
    bulletsAr: [
      "تشمل الخدمة الواجهات والتقارير والتكاملات والمزايا التي تم تفعيلها للحساب فعليًا.",
      "قد تُطرح مزايا جديدة أو تُحدّث المسارات الحالية بهدف تحسين الأداء أو الأمان أو سهولة الاستخدام.",
      "بعض الوظائف قد تعتمد على بيانات صحيحة من العميل أو على أطراف ثالثة أو خدمات حكومية خارج سيطرتنا المباشرة."
    ],
    bulletsEn: [
      "The service includes the interfaces, reports, integrations, and features actually enabled for the account.",
      "New features or workflow updates may be introduced to improve performance, security, or usability.",
      "Some functionality depends on accurate customer data or on third-party and government services outside our direct control."
    ]
  },
  {
    id: "account-responsibility",
    icon: Users,
    iconClassName: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    titleAr: "مسؤوليات العميل والحساب",
    titleEn: "Customer and Account Responsibilities",
    summaryAr:
      "العميل مسؤول عن صحة البيانات المدخلة، وإدارة المستخدمين المصرح لهم، والمحافظة على سرية بيانات الدخول داخل شركته.",
    summaryEn:
      "The customer is responsible for data accuracy, management of authorized users, and protecting credentials within the organization.",
    bulletsAr: [
      "تحديد من يملك حق الوصول، ومراجعة الصلاحيات، وإلغاء أي مستخدم لم يعد مخولًا بالدخول.",
      "عدم مشاركة كلمات المرور أو الرموز أو الوصول الإداري مع أشخاص غير مصرح لهم.",
      "مراجعة المخرجات التشغيلية قبل اعتمادها النهائي، خصوصًا ما يتعلق بالرواتب والملفات الرسمية والتقارير."
    ],
    bulletsEn: [
      "Define who has access, review permissions, and revoke access for anyone no longer authorized.",
      "Do not share passwords, tokens, or administrative access with unauthorized individuals.",
      "Review operational outputs before final approval, especially payroll, official files, and reports."
    ]
  },
  {
    id: "acceptable-use",
    icon: Ban,
    iconClassName: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    titleAr: "الاستخدام المقبول والمحظورات",
    titleEn: "Acceptable Use and Prohibited Conduct",
    summaryAr:
      "يُحظر استخدام المنصة بما يخالف الأنظمة أو يعرّض الخدمة أو بقية العملاء للخطر أو يحاول تجاوز حدود الوصول الممنوحة.",
    summaryEn:
      "You may not use the platform in ways that violate law, endanger the service or other customers, or attempt to bypass granted access boundaries.",
    bulletsAr: [
      "منع رفع بيانات مضللة عمدًا أو استخدام الخدمة في أي نشاط احتيالي أو غير نظامي.",
      "منع محاولة فحص الثغرات أو عكس هندسة المنصة أو تعطيلها أو التحايل على آليات الحماية.",
      "منع إساءة استخدام التكاملات أو واجهات API أو الموارد المشتركة بشكل يضر بالاستقرار أو الأداء."
    ],
    bulletsEn: [
      "Do not upload deliberately misleading data or use the service for fraud or unlawful activity.",
      "Do not probe for vulnerabilities, reverse engineer the platform, disrupt it, or bypass protection mechanisms.",
      "Do not abuse integrations, APIs, or shared resources in a way that harms stability or performance."
    ],
    noteAr:
      "يجوز تعليق الحساب مؤقتًا أو تقييد بعض الوظائف عند وجود شبهة إساءة استخدام أو خطر أمني واضح لحين اكتمال التحقق.",
    noteEn:
      "Accounts or features may be temporarily restricted if there is suspected misuse or a clear security risk while review is in progress."
  },
  {
    id: "billing-subscription",
    icon: CheckCircle2,
    iconClassName: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    titleAr: "الاشتراكات والفوترة",
    titleEn: "Subscriptions and Billing",
    summaryAr:
      "تخضع الرسوم، دورات التجديد، وحدود الاستخدام إلى الباقة المتفق عليها أو العرض التجاري أو العقد المبرم مع العميل.",
    summaryEn:
      "Fees, renewal cycles, and usage limits are governed by the agreed plan, commercial offer, or executed contract with the customer.",
    bulletsAr: [
      "قد تختلف الأسعار والمزايا وحدود المستخدمين أو الوحدات بين الباقات أو الاتفاقات الخاصة.",
      "قد يؤدي عدم السداد أو انتهاء الاشتراك إلى إيقاف بعض الوظائف أو الوصول حتى تتم المعالجة أو التجديد.",
      "الخدمات الإضافية أو التخصيصات أو التكاملات الخاصة قد تُسعّر وتُدار خارج الباقة الأساسية."
    ],
    bulletsEn: [
      "Pricing, features, and user or module limits may differ between plans and custom agreements.",
      "Non-payment or subscription expiry may lead to suspension of certain features or access until resolved or renewed.",
      "Add-ons, customizations, and private integrations may be priced and managed outside the base plan."
    ]
  },
  {
    id: "availability-support",
    icon: Clock3,
    iconClassName: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
    titleAr: "التوافر والدعم",
    titleEn: "Availability and Support",
    summaryAr:
      "نعمل على تشغيل الخدمة بمستوى مهني معقول، لكن قد تحدث صيانة دورية أو توقفات طارئة أو تباطؤات خارجة عن السيطرة المباشرة.",
    summaryEn:
      "We operate the service with commercially reasonable care, but maintenance windows, incidents, or external slowdowns may still occur.",
    bulletsAr: [
      "قد نجري تحديثات مجدولة أو تغييرات أمنية أو تحسينات بنيوية تتطلب نافذة صيانة محدودة.",
      "الدعم يُقدَّم عبر القنوات الرسمية المعتمدة وبحسب نوع الطلب وأولويته وساعات التغطية.",
      "لا تمثل الخدمة تعهدًا بعدم الانقطاع مطلقًا، خصوصًا في حالات البنية التحتية الخارجية أو القوى القاهرة."
    ],
    bulletsEn: [
      "We may perform scheduled updates, security changes, or structural improvements that require limited maintenance windows.",
      "Support is provided through official channels based on request type, priority, and coverage hours.",
      "The service is not a guarantee of zero interruption, especially in external infrastructure or force majeure scenarios."
    ]
  },
  {
    id: "ownership-termination",
    icon: Shield,
    iconClassName: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    titleAr: "الملكية، الإنهاء، والتزامات ما بعد الإلغاء",
    titleEn: "Ownership, Termination, and Post-Cancellation Duties",
    summaryAr:
      "العميل يظل مالكًا لبياناته التشغيلية، بينما تبقى حقوق المنصة والبرمجيات والتصميمات والمواد الأصلية محفوظة لطاقم أو لمرخّصيها.",
    summaryEn:
      "Customers retain ownership of their operational data, while platform software, design, and original materials remain owned by Taqam or its licensors.",
    bulletsAr: [
      "يجوز للعميل طلب تصدير بياناته وفق الإمكانات المتاحة قبل الإنهاء النهائي أو خلال نافذة الاحتفاظ التشغيلية.",
      "يجوز إنهاء أو تعليق الوصول عند خرق مادي للشروط أو عند وجود مخاطر أمنية أو نظامية مؤثرة.",
      "بعد الإلغاء، تُدار البيانات وفق سياسة الخصوصية وفترات الاحتفاظ المعتمدة قبل الحذف أو إزالة الهوية."
    ],
    bulletsEn: [
      "Customers may request export of their data through available tools before final termination or during the retention window.",
      "Access may be suspended or terminated for material breaches or significant legal or security risks.",
      "After cancellation, data is handled under the privacy policy and approved retention windows before deletion or de-identification."
    ]
  },
  {
    id: "governing-law",
    icon: Scale,
    iconClassName: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
    titleAr: "القانون الحاكم والتواصل",
    titleEn: "Governing Law and Contact",
    summaryAr:
      "تُفسر هذه الشروط وفق الأنظمة المعمول بها في المملكة العربية السعودية، ويُفضل معالجة أي خلاف تشغيلي أو تجاري أولًا عبر القنوات الرسمية المباشرة.",
    summaryEn:
      "These terms are governed by the laws of the Kingdom of Saudi Arabia, and operational or commercial disputes should first be addressed through direct official channels.",
    bulletsAr: [
      "نوصي برفع أي ملاحظات تعاقدية أو تشغيلية أو قانونية عبر الدعم أو من خلال قناة التواصل المعتمدة في العقد.",
      "في حال تعذر المعالجة الودية، يبقى الاختصاص للجهات المختصة وفق النظام والعقد الساري بين الطرفين.",
      "للاستفسارات العامة: support@taqam.net."
    ],
    bulletsEn: [
      "Contractual, operational, or legal concerns should be raised through support or the agreed communication channel in the contract.",
      "If a dispute cannot be resolved amicably, jurisdiction remains with the competent authorities under applicable law and contract.",
      "For general questions: support@taqam.net."
    ]
  }
];

const termsHighlights = [
  {
    labelAr: "آخر تحديث",
    labelEn: "Last updated",
    valueAr: "7 أبريل 2026",
    valueEn: "April 7, 2026"
  },
  {
    labelAr: "نطاق التطبيق",
    labelEn: "Applies to",
    valueAr: "الحسابات والخطط والخدمات المفعلة",
    valueEn: "Enabled accounts, plans, and services"
  },
  {
    labelAr: "التواصل",
    labelEn: "Contact",
    value: "support@taqam.net"
  }
];

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    titleAr: "الشروط والأحكام | طاقم",
    titleEn: "Terms & Conditions | Taqam",
    descriptionAr:
      "الشروط المنظمة لاستخدام منصة طاقم، بما يشمل نطاق الخدمة، مسؤوليات العميل، والاشتراكات والالتزامات التشغيلية.",
    descriptionEn:
      "The terms governing use of Taqam, including service scope, customer responsibilities, subscriptions, and operational commitments.",
    path: "/terms"
  });
}

export default async function TermsPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";
  const dir = isAr ? "rtl" : "ltr";

  return (
    <main className="bg-background" dir={dir}>
      <FadeIn>
        <MarketingPageHero
          icon={FileText}
          tone="indigo"
          badge={isAr ? "استخدام منظم وواضح" : "Clear and structured use"}
          title={isAr ? "الشروط والأحكام" : "Terms & Conditions"}
          description={
            isAr
              ? "توضح هذه الصفحة الإطار العام لاستخدام منصة طاقم، بما في ذلك نطاق الخدمة، التزامات العميل، وحدود الاستخدام المقبول."
              : "This page sets the general framework for using Taqam, including service scope, customer obligations, and acceptable use boundaries."
          }
          actions={[
            { href: `${p}/support`, label: isAr ? "تواصل معنا" : "Contact us", variant: "outline" },
            {
              href: `${p}/request-demo`,
              label: isAr ? "اطلب عرضًا" : "Request a demo",
              variant: "brand"
            }
          ]}
          stats={[
            { value: `${termsSections.length}`, label: isAr ? "محاور تعاقدية" : "Contract topics" },
            {
              value: isAr ? "تشغيل SaaS" : "SaaS operations",
              label: isAr ? "طبيعة الخدمة" : "Service model"
            },
            { value: "support@taqam.net", label: isAr ? "قناة التواصل" : "Contact channel" }
          ]}
        />
      </FadeIn>

      <section className="container mx-auto px-4 py-14">
        <div className="grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
          <FadeIn direction="up">
            <div className="space-y-4 lg:sticky lg:top-24">
              <div className="border-border/50 bg-card/80 rounded-[2rem] border p-6 shadow-sm backdrop-blur-sm">
                <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
                  {isAr ? "ملخص تنفيذي" : "Quick summary"}
                </p>
                <div className="mt-4 space-y-3">
                  {termsHighlights.map((item) => (
                    <div
                      key={item.labelEn}
                      className="border-border/50 bg-background/70 rounded-2xl border px-4 py-3">
                      <p className="text-muted-foreground text-xs font-medium">
                        {isAr ? item.labelAr : item.labelEn}
                      </p>
                      <p className="text-foreground mt-1 text-sm font-semibold">
                        {isAr ? (item.valueAr ?? item.value) : (item.valueEn ?? item.value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <nav className="border-border/50 bg-card/80 rounded-[2rem] border p-6 shadow-sm backdrop-blur-sm">
                <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
                  {isAr ? "التنقل داخل الصفحة" : "On this page"}
                </p>
                <div className="mt-4 space-y-2">
                  {termsSections.map((section, index) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="text-muted-foreground hover:bg-muted/40 hover:text-foreground flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition">
                      <span className="bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                        {index + 1}
                      </span>
                      <span>{isAr ? section.titleAr : section.titleEn}</span>
                    </a>
                  ))}
                </div>
              </nav>
            </div>
          </FadeIn>

          <StaggerContainer className="space-y-6">
            {termsSections.map((section, index) => {
              const Icon = section.icon;
              return (
                <StaggerItem key={section.id}>
                  <section
                    id={section.id}
                    className="border-border/50 bg-card/80 scroll-mt-24 rounded-[2rem] border p-6 shadow-sm backdrop-blur-sm sm:p-8">
                    <div className="flex flex-wrap items-center gap-4">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${section.iconClassName}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
                          {isAr ? `البند ${index + 1}` : `Clause ${index + 1}`}
                        </p>
                        <h2 className="text-foreground mt-1 text-2xl font-extrabold tracking-tight">
                          {isAr ? section.titleAr : section.titleEn}
                        </h2>
                      </div>
                    </div>

                    <p className="text-muted-foreground mt-5 text-sm leading-7 sm:text-[15px]">
                      {isAr ? section.summaryAr : section.summaryEn}
                    </p>

                    <ul className="mt-6 space-y-3">
                      {(isAr ? section.bulletsAr : section.bulletsEn).map((bullet) => (
                        <li
                          key={bullet}
                          className="border-border/40 bg-background/60 text-foreground/90 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm leading-7">
                          <span className="bg-primary/60 mt-1 h-2.5 w-2.5 shrink-0 rounded-full" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>

                    {section.noteAr || section.noteEn ? (
                      <div className="border-primary/15 bg-primary/5 text-foreground/85 mt-5 rounded-2xl border px-4 py-3 text-sm leading-7">
                        {isAr ? section.noteAr : section.noteEn}
                      </div>
                    ) : null}
                  </section>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      <FadeIn>
        <MarketingPageCta
          icon={Mail}
          badge={isAr ? "استفسارات تعاقدية وتشغيلية" : "Contract and operations questions"}
          title={
            isAr
              ? "هل تحتاج توضيحًا قبل الاشتراك أو التفعيل؟"
              : "Need clarification before activation?"
          }
          description={
            isAr
              ? "إذا كنت تراجع البنود أو تحتاج توضيحًا يتعلق بالخطة أو المسؤوليات أو التفعيل، تواصل معنا وسنساعدك بالمعلومة الصحيحة."
              : "If you are reviewing the terms or need clarification about plans, responsibilities, or activation, contact us and we will help."
          }
          primaryAction={{
            href: `${p}/support`,
            label: isAr ? "راسل الدعم" : "Contact support",
            variant: "brand"
          }}
          secondaryAction={{
            href: `${p}/pricing`,
            label: isAr ? "راجع الباقات" : "Review pricing",
            variant: "outline"
          }}
        />
      </FadeIn>
    </main>
  );
}
