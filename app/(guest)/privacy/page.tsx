import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import { FadeIn } from "@/components/ui/fade-in";
import { MarketingPageCta } from "@/components/marketing/page-cta";
import { MarketingPageHero } from "@/components/marketing/page-hero";
import { marketingMetadata } from "@/lib/marketing/seo";
import { getAppLocale } from "@/lib/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    titleAr: "سياسة الخصوصية | طاقم",
    titleEn: "Privacy Policy | Taqam",
    descriptionAr: "تعرّف على كيفية جمع منصة طاقم للبيانات وحمايتها والغرض من استخدامها.",
    descriptionEn: "Understand how Taqam collects, protects, and uses your data.",
    path: "/privacy",
  });
}

export default async function PrivacyPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";

  const lastUpdated = isAr ? "1 أبريل 2025" : "April 1, 2025";
  const contactEmail = "privacy@taqam.net";

  return (
    <FadeIn direction="up">
      <main className="bg-background">
      <MarketingPageHero
        icon={ShieldCheck}
        badge={isAr ? "البيانات، الاستخدام، والحقوق" : "Data, usage, and rights"}
        title={isAr ? "سياسة الخصوصية" : "Privacy Policy"}
        description={
          isAr
            ? "توضّح هذه السياسة كيفية جمع منصة طاقم للبيانات الشخصية وبيانات الشركات، وطريقة استخدامها وحمايتها، وحقوقك كمستخدم."
            : "This policy explains how Taqam collects personal and company data, how it is used and protected, and your rights as a user."
        }
        actions={[
          { href: `${p}/support`, label: isAr ? "التواصل مع الدعم" : "Contact support", variant: "outline" },
          { href: `${p}/request-demo`, label: isAr ? "اطلب عرضًا" : "Request a demo", variant: "brand" },
        ]}
        stats={[
          { value: lastUpdated, label: isAr ? "آخر تحديث" : "Last updated" },
          { value: "10", label: isAr ? "محاور رئيسية" : "Core sections" },
          { value: contactEmail, label: isAr ? "قناة الخصوصية" : "Privacy contact" },
        ]}
      />

      <div className="container mx-auto max-w-5xl px-4 py-12">
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{isAr ? "آخر تحديث" : "Last updated"}</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{lastUpdated}</p>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{isAr ? "الاحتفاظ بالبيانات" : "Retention"}</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{isAr ? "حتى 90 يومًا بعد الإلغاء" : "Up to 90 days after cancellation"}</p>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{isAr ? "قناة التواصل" : "Contact channel"}</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{contactEmail}</p>
          </div>
        </div>

        <div className="space-y-6 text-sm leading-7 text-muted-foreground [&>section]:rounded-3xl [&>section]:border [&>section]:bg-card [&>section]:p-6 [&>section]:shadow-sm">

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {isAr ? "1. المعلومات التي نجمعها" : "1. Information we collect"}
            </h2>
            <p>
              {isAr
                ? "تجمع منصة طاقم أنواعًا مختلفة من البيانات لتقديم خدماتها وتحسينها:"
                : "Taqam collects different types of data to provide and improve its services:"}
            </p>
            <ul className="ms-4 list-disc space-y-1.5">
              <li>
                {isAr
                  ? "بيانات الحساب: الاسم، البريد الإلكتروني، اسم الشركة، وبيانات الاشتراك."
                  : "Account data: name, email address, company name, and subscription details."}
              </li>
              <li>
                {isAr
                  ? "بيانات الموظفين: تُدخلها الشركة وتبقى كاملة في بيئتها الخاصة المعزولة."
                  : "Employee data: entered by the company and stored entirely within its isolated environment."}
              </li>
              <li>
                {isAr
                  ? "بيانات الاستخدام: الصفحات التي تزورها، الوقت المستغرق، والإجراءات التي تنفّذها داخل المنصة."
                  : "Usage data: pages visited, time spent, and actions performed inside the platform."}
              </li>
              <li>
                {isAr
                  ? "البيانات التقنية: نوع المتصفح، نظام التشغيل، عنوان الـ IP، والسجلات التقنية اللازمة لاستقرار الخدمة."
                  : "Technical data: browser type, operating system, IP address, and technical logs needed for service stability."}
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {isAr ? "2. كيف نستخدم البيانات" : "2. How we use your data"}
            </h2>
            <ul className="ms-4 list-disc space-y-1.5">
              <li>{isAr ? "تقديم خدمات المنصة وضمان استمراريتها وأمانها." : "Providing platform services and ensuring their continuity and security."}</li>
              <li>{isAr ? "معالجة الرواتب والحضور والإجازات وفق ما تضبطه الشركة." : "Processing payroll, attendance, and leave according to company-defined settings."}</li>
              <li>{isAr ? "التواصل بشأن التحديثات والتنبيهات والتحسينات والدعم الفني." : "Communicating about updates, alerts, improvements, and technical support."}</li>
              <li>{isAr ? "تحليل أنماط الاستخدام لتحسين تجربة المستخدم وتطوير الميزات." : "Analyzing usage patterns to improve user experience and develop features."}</li>
              <li>{isAr ? "الامتثال للمتطلبات القانونية والتنظيمية المعمول بها في المملكة العربية السعودية." : "Complying with applicable legal and regulatory requirements in Saudi Arabia."}</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {isAr ? "3. مشاركة البيانات" : "3. Data sharing"}
            </h2>
            <p>{isAr ? "لا نبيع بياناتك ولا نشاركها لأغراض تجارية. قد نشارك بيانات محدودة في الحالات التالية فقط:" : "We do not sell your data or share it for commercial purposes. We may share limited data only in the following cases:"}</p>
            <ul className="ms-4 list-disc space-y-1.5">
              <li>{isAr ? "مزودو الخدمات الموثوقون (الاستضافة، قواعد البيانات، معالجة المدفوعات) لتشغيل المنصة فقط." : "Trusted service providers (hosting, databases, payment processing) solely to operate the platform."}</li>
              <li>{isAr ? "الجهات الحكومية أو التنظيمية عند وجود التزام قانوني صريح بذلك." : "Government or regulatory bodies when a clear legal obligation exists."}</li>
              <li>{isAr ? "في حالة الاندماج أو الاستحواذ، مع إشعار مسبق للمستخدمين المتأثرين." : "In a merger or acquisition, with prior notice to affected users."}</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {isAr ? "4. أمان البيانات" : "4. Data security"}
            </h2>
            <p>
              {isAr
                ? "نطبّق إجراءات أمنية متعددة الطبقات لحماية بياناتك: تشفير البيانات أثناء النقل (TLS) وفي حالة التخزين، وعزل كامل بين بيانات كل شركة (multi-tenant isolation)، وسجلات تدقيق للعمليات الحساسة، ومراجعات أمنية دورية. رغم ذلك، لا يوجد نظام آمن بنسبة 100%، ونحثّك على الحفاظ على سرية بيانات دخولك."
                : "We implement multi-layer security measures: encryption in transit (TLS) and at rest, complete isolation between each company's data (multi-tenant isolation), audit logs for sensitive operations, and regular security reviews. That said, no system is 100% secure, and we urge you to keep your credentials confidential."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {isAr ? "5. الاحتفاظ بالبيانات" : "5. Data retention"}
            </h2>
            <p>
              {isAr
                ? "نحتفظ بالبيانات طوال فترة الاشتراك النشط. بعد إلغاء الاشتراك، تُحذف البيانات خلال فترة معقولة لا تتجاوز 90 يومًا، ما لم يوجد التزام قانوني بالاحتفاظ بها لفترة أطول."
                : "We retain data for the duration of the active subscription. After cancellation, data is deleted within a reasonable period not exceeding 90 days, unless a legal obligation requires longer retention."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {isAr ? "6. ملفات تعريف الارتباط (Cookies)" : "6. Cookies"}
            </h2>
            <p>
              {isAr
                ? "نستخدم ملفات تعريف الارتباط للأغراض الضرورية فقط: الحفاظ على جلسة تسجيل الدخول، وتذكّر تفضيل اللغة، وقياس الأداء العام للمنصة. لا نستخدم ملفات تعريف ارتباط الإعلانات أو التتبع الشخصي."
                : "We use cookies for necessary purposes only: maintaining login sessions, remembering language preferences, and measuring general platform performance. We do not use advertising cookies or personal tracking cookies."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {isAr ? "7. حقوقك" : "7. Your rights"}
            </h2>
            <p>{isAr ? "لديك الحق في:" : "You have the right to:"}</p>
            <ul className="ms-4 list-disc space-y-1.5">
              <li>{isAr ? "الوصول إلى بياناتك الشخصية المخزّنة لدينا." : "Access your personal data stored with us."}</li>
              <li>{isAr ? "تصحيح أي بيانات غير دقيقة." : "Correct any inaccurate data."}</li>
              <li>{isAr ? "طلب حذف بياناتك وفق الضوابط التشغيلية والقانونية المعمول بها." : "Request deletion of your data subject to applicable operational and legal constraints."}</li>
              <li>{isAr ? "الاعتراض على معالجة معينة أو تقييدها في الحالات المسموح بها." : "Object to or restrict certain processing where permitted."}</li>
            </ul>
            <p>{isAr ? "لممارسة أي من هذه الحقوق، تواصل معنا عبر:" : "To exercise any of these rights, contact us at:"}</p>
            <a href="mailto:privacy@taqam.net" className="font-medium text-primary hover:underline">privacy@taqam.net</a>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {isAr ? "8. الروابط الخارجية" : "8. External links"}
            </h2>
            <p>
              {isAr
                ? "قد تحتوي المنصة على روابط لمواقع طرف ثالث. لا نتحمل مسؤولية ممارسات الخصوصية الخاصة بتلك المواقع، وننصحك بمراجعة سياسات خصوصيتها."
                : "The platform may contain links to third-party websites. We are not responsible for their privacy practices and recommend reviewing their privacy policies."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {isAr ? "9. تعديلات السياسة" : "9. Policy updates"}
            </h2>
            <p>
              {isAr
                ? "قد نحدّث هذه السياسة من وقت لآخر. في حالة وجود تعديلات جوهرية، سنُبلّغك عبر البريد الإلكتروني أو إشعار داخل المنصة قبل تطبيق التعديلات."
                : "We may update this policy from time to time. For material changes, we will notify you by email or via an in-platform notice before the changes take effect."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {isAr ? "10. التواصل" : "10. Contact"}
            </h2>
            <p>
              {isAr
                ? "لأي استفسار يتعلق بهذه السياسة أو بكيفية تعاملنا مع بياناتك، لا تتردد في التواصل معنا:"
                : "For any questions about this policy or how we handle your data, please reach out:"}
            </p>
            <div className="space-y-1">
              <p><span className="text-foreground">{isAr ? "البريد الإلكتروني:" : "Email:"}</span>{" "}<a href="mailto:privacy@taqam.net" className="text-primary hover:underline">privacy@taqam.net</a></p>
              <p><span className="text-foreground">{isAr ? "الموقع:" : "Website:"}</span>{" "}<a href="https://taqam.net" className="text-primary hover:underline">taqam.net</a></p>
            </div>
          </section>

        </div>
      </div>

      <MarketingPageCta
        title={isAr ? "تحتاج توضيحًا بخصوص البيانات أو الوصول؟" : "Need clarification on data or access?"}
        description={
          isAr
            ? "إذا كان لديك سؤال عملي عن الخصوصية أو طلب متعلق بالوصول والتصحيح والحذف، تواصل معنا مباشرة وسنوجّهك للمسار الصحيح."
            : "If you have a practical question about privacy or need help with access, correction, or deletion requests, contact us directly and we will guide you to the right path."
        }
        primaryAction={{ href: `${p}/support`, label: isAr ? "افتح طلب دعم" : "Open a support request" }}
        secondaryAction={{ href: `${p}/help-center`, label: isAr ? "مركز المساعدة" : "Help Center" }}
      />
    </main>
    </FadeIn>
  );
}