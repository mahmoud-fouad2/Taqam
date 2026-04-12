import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  Clock3,
  Database,
  Eye,
  FileLock2,
  Mail,
  Share2,
  ShieldCheck,
  UserCheck
} from "lucide-react";

import { MarketingPageCta } from "@/components/marketing/page-cta";
import { MarketingPageHero } from "@/components/marketing/page-hero";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/fade-in";
import { getAppLocale } from "@/lib/i18n/locale";
import { marketingMetadata } from "@/lib/marketing/seo";

type PrivacySection = {
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

const privacySections: PrivacySection[] = [
  {
    id: "data-scope",
    icon: Database,
    iconClassName: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    titleAr: "البيانات التي نعالجها",
    titleEn: "Data We Process",
    summaryAr:
      "نحن نعالج فقط البيانات اللازمة لتشغيل الحسابات، إدارة فرق العمل، وتقديم الدعم الفني بشكل موثوق.",
    summaryEn:
      "We only process the data needed to operate accounts, manage workspaces, and deliver reliable support.",
    bulletsAr: [
      "بيانات الحساب مثل الاسم، البريد الإلكتروني، الجوال، والدور الوظيفي داخل المنصة.",
      "بيانات الشركة التي يضيفها العميل مثل الموظفين، الإدارات، الرواتب، والحضور بحسب الباقة المفعلة.",
      "بيانات الاستخدام التقنية مثل عنوان IP، نوع الجهاز، والمتصفح وسجلات النشاط المرتبطة بالأمان والاستقرار.",
      "بيانات المراسلات والدعم عندما يرسل العميل استفسارًا أو بلاغًا أو يطلب تفعيل خدمة إضافية."
    ],
    bulletsEn: [
      "Account data such as name, email, phone number, and in-product role.",
      "Company-managed data like employees, departments, payroll, and attendance based on the active plan.",
      "Technical usage data such as IP address, device/browser type, and activity logs tied to security and stability.",
      "Support correspondence when a customer submits a question, incident, or activation request."
    ]
  },
  {
    id: "processing-purpose",
    icon: Eye,
    iconClassName: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    titleAr: "أغراض المعالجة والاستخدام",
    titleEn: "Why We Use Your Data",
    summaryAr:
      "تُستخدم البيانات لتشغيل الخدمة كما طلبها العميل، وليس لأي بيع أو استغلال إعلاني أو مشاركة عشوائية.",
    summaryEn:
      "Data is used to deliver the service requested by the customer, not for resale, ad targeting, or arbitrary sharing.",
    bulletsAr: [
      "تسجيل الدخول، إدارة الصلاحيات، وتشغيل مسارات الموارد البشرية والرواتب والحضور والتقارير.",
      "تحسين الأداء، تحليل الأعطال، ومنع إساءة الاستخدام أو المحاولات غير المصرح بها.",
      "إرسال الإشعارات التشغيلية والتنبيهات المهمة المتعلقة بالحساب، الأمان، أو توافر الخدمة.",
      "الالتزام بالمتطلبات النظامية أو التعاقدية عندما يكون ذلك مطلوبًا بشكل واضح ومحدد."
    ],
    bulletsEn: [
      "Authentication, permissioning, and operation of HR, payroll, attendance, and reporting workflows.",
      "Performance improvement, issue diagnosis, and prevention of abuse or unauthorized attempts.",
      "Operational notifications and important alerts about the account, security, or service availability.",
      "Compliance with legal or contractual obligations when clearly required."
    ]
  },
  {
    id: "security-controls",
    icon: FileLock2,
    iconClassName: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
    titleAr: "إجراءات الحماية والأمان",
    titleEn: "Security Controls",
    summaryAr:
      "نطبق ضوابط تقنية وتشغيلية متعددة الطبقات لحماية بيانات كل عميل وعزلها عن بقية البيئات داخل المنصة.",
    summaryEn:
      "We apply layered technical and operational controls to protect customer data and isolate it from other platform tenants.",
    bulletsAr: [
      "تشفير الاتصال عبر HTTPS/TLS، واستخدام ممارسات تخزين آمنة للبيانات الحساسة وبيانات الجلسات.",
      "عزل بيانات كل شركة داخل نموذج متعدد المستأجرين مع فحوص صلاحيات على مستوى المستخدم والجهة.",
      "تسجيل العمليات الحساسة ومراجعتها عند الحاجة الأمنية أو التشغيلية.",
      "نسخ احتياطية وإجراءات استعادة تساعد على استمرارية الخدمة وتقليل فقدان البيانات عند الحوادث."
    ],
    bulletsEn: [
      "HTTPS/TLS encryption in transit and secure storage practices for sensitive data and session artifacts.",
      "Tenant isolation with permission checks at the user and organization levels.",
      "Logging and review of sensitive actions when needed for security or operations.",
      "Backups and recovery procedures that support continuity and reduce data-loss risk during incidents."
    ],
    noteAr:
      "لا يوجد نظام أمني مضمون بنسبة 100%، لكننا نعمل على تقليل المخاطر بشكل مستمر وتحديث الضوابط عند الحاجة.",
    noteEn:
      "No system is guaranteed to be 100% secure, but we continuously reduce risk and update controls when needed."
  },
  {
    id: "sharing-disclosure",
    icon: Share2,
    iconClassName: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    titleAr: "المشاركة والإفصاح",
    titleEn: "Sharing and Disclosure",
    summaryAr:
      "لا نبيع بيانات العملاء، ولا نشاركها إلا في حدود تشغيل الخدمة أو الامتثال النظامي أو بناءً على توجيه العميل.",
    summaryEn:
      "We do not sell customer data and only disclose it when needed to operate the service, meet legal obligations, or act on customer instruction.",
    bulletsAr: [
      "قد نستخدم مزودي خدمات موثوقين للبنية التحتية، الرسائل، أو التخزين بما يخدم تشغيل المنصة فقط.",
      "قد يتم الإفصاح عند وجود طلب قانوني نافذ أو متطلب تنظيمي واضح من جهة مختصة.",
      "يمكن للعميل تصدير بياناته أو ربطها بتكاملات يعتمدها بنفسه وفق إعدادات الخدمة المفعلة."
    ],
    bulletsEn: [
      "We may rely on trusted infrastructure, messaging, or storage vendors solely to operate the platform.",
      "We may disclose data when required by a valid legal request or a clear regulatory obligation.",
      "Customers may export their own data or connect approved integrations through enabled service settings."
    ]
  },
  {
    id: "retention",
    icon: Clock3,
    iconClassName: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    titleAr: "مدة الاحتفاظ والحذف",
    titleEn: "Retention and Deletion",
    summaryAr:
      "نحتفظ بالبيانات طوال مدة الاشتراك النشط، ثم نتعامل معها وفق فترة احتفاظ معقولة مرتبطة بالدعم والالتزامات النظامية.",
    summaryEn:
      "We retain data during the active subscription period, then handle it through a reasonable retention window tied to support and legal obligations.",
    bulletsAr: [
      "تبقى بيانات التشغيل والحساب متاحة طوال فترة الاشتراك واستخدام الخدمة من قبل العميل.",
      "عند الإلغاء أو الإيقاف النهائي، يمكن الاحتفاظ بالبيانات لفترة محدودة لأغراض التصدير، الدعم، أو الالتزامات النظامية.",
      "بعد انتهاء فترة الاحتفاظ المعتمدة، تُحذف البيانات أو تُزال هويتها بحسب نوعها ومتطلبات النظام."
    ],
    bulletsEn: [
      "Operational and account data remains available throughout the active subscription period.",
      "After cancellation or final termination, data may be kept for a limited time for export, support, or legal obligations.",
      "After the retention window ends, data is deleted or de-identified depending on its type and compliance needs."
    ],
    noteAr:
      "الفترة التشغيلية المرجعية للحذف بعد الإلغاء لا تتجاوز عادة 90 يومًا ما لم يوجد التزام قانوني مختلف.",
    noteEn:
      "The standard post-cancellation deletion window is generally no longer than 90 days unless a different legal obligation applies."
  },
  {
    id: "rights-contact",
    icon: UserCheck,
    iconClassName: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    titleAr: "حقوق العميل والتواصل",
    titleEn: "Customer Rights and Contact",
    summaryAr:
      "يستطيع العميل طلب الوصول إلى بياناته أو تصحيحها أو طلب تصديرها أو مناقشة أي استفسار يتعلق بالخصوصية عبر قنواتنا الرسمية.",
    summaryEn:
      "Customers can request access, correction, export, or discuss any privacy concern through our official channels.",
    bulletsAr: [
      "طلب نسخة أو تصدير من البيانات التي يديرها الحساب وفق الإمكانات المتاحة في الباقة أو عبر الدعم.",
      "طلب تصحيح البيانات غير الدقيقة أو تحديثها عندما تكون تحت إدارة المنصة أو ضمن سجلات الحساب.",
      "التواصل بشأن أي استفسار خصوصية أو بلاغ أمني عبر privacy@taqam.net أو support@taqam.net."
    ],
    bulletsEn: [
      "Request a copy or export of account-managed data through plan capabilities or support.",
      "Request correction or updates for inaccurate data when it is maintained by the platform or account records.",
      "Contact us about any privacy question or security concern via privacy@taqam.net or support@taqam.net."
    ]
  }
];

const privacyHighlights = [
  {
    labelAr: "قناة الخصوصية",
    labelEn: "Privacy channel",
    value: "privacy@taqam.net"
  },
  {
    labelAr: "الحذف المرجعي",
    labelEn: "Reference deletion window",
    valueAr: "حتى 90 يومًا بعد الإلغاء",
    valueEn: "Up to 90 days after cancellation"
  },
  {
    labelAr: "العزل",
    labelEn: "Isolation",
    valueAr: "لكل شركة بيئتها وصلاحياتها",
    valueEn: "Each tenant has its own scoped workspace"
  }
];

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    titleAr: "سياسة الخصوصية | طاقم",
    titleEn: "Privacy Policy | Taqam",
    descriptionAr:
      "كيف تجمع طاقم بيانات الحسابات والشركات، وكيف تستخدمها وتحميها وتتعامل مع طلبات الخصوصية.",
    descriptionEn:
      "How Taqam collects account and company data, how it uses and protects it, and how privacy requests are handled.",
    path: "/privacy"
  });
}

export default async function PrivacyPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";
  const dir = isAr ? "rtl" : "ltr";
  const lastUpdated = isAr ? "7 أبريل 2026" : "April 7, 2026";

  return (
    <main className="bg-background" dir={dir}>
      <FadeIn>
        <MarketingPageHero
          icon={ShieldCheck}
          badge={isAr ? "الخصوصية والشفافية" : "Privacy and transparency"}
          title={isAr ? "سياسة الخصوصية" : "Privacy Policy"}
          description={
            isAr
              ? "تشرح هذه الصفحة ما الذي نعالجه من بيانات، ولماذا نستخدمه، وكيف نحميه، وما القنوات المتاحة للتواصل معنا بخصوص الخصوصية."
              : "This page explains what data we process, why we use it, how we protect it, and how you can contact us about privacy matters."
          }
          actions={[
            {
              href: `${p}/support`,
              label: isAr ? "التواصل مع الدعم" : "Contact support",
              variant: "outline"
            },
            {
              href: `${p}/request-demo`,
              label: isAr ? "اطلب عرضًا" : "Request a demo",
              variant: "brand"
            }
          ]}
          stats={[]}
        />
      </FadeIn>

      <section className="container mx-auto px-4 py-14">
        <div className="grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
          <FadeIn direction="up">
            <div className="space-y-4 lg:sticky lg:top-24">
              <div className="border-border/50 bg-card/80 rounded-[2rem] border p-6 shadow-sm backdrop-blur-sm">
                <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
                  {isAr ? "لمحة سريعة" : "At a glance"}
                </p>
                <div className="mt-4 space-y-3">
                  {privacyHighlights.map((item) => (
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
                  {privacySections.map((section, index) => (
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
            {privacySections.map((section, index) => {
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
                          {isAr ? `القسم ${index + 1}` : `Section ${index + 1}`}
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
          badge={isAr ? "خصوصية الحساب والبيانات" : "Account and data privacy"}
          title={isAr ? "هل لديك استفسار بخصوص الخصوصية؟" : "Have a privacy question?"}
          description={
            isAr
              ? "إذا كنت تحتاج توضيحًا إضافيًا أو طلبًا متعلقًا بالبيانات، راسلنا وسنوجّه الحالة إلى القناة المناسبة داخل فريق طاقم."
              : "If you need clarification or have a data-related request, contact us and we will route it through the appropriate Taqam channel."
          }
          primaryAction={{
            href: `${p}/support`,
            label: isAr ? "فتح طلب دعم" : "Open a support request",
            variant: "brand"
          }}
          secondaryAction={{
            href: "mailto:privacy@taqam.net",
            label: isAr ? "مراسلة الخصوصية" : "Email privacy",
            variant: "outline"
          }}
        />
      </FadeIn>
    </main>
  );
}
