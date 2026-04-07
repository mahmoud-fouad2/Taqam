import type { Metadata } from "next";
import { FileText } from "lucide-react";

import { FadeIn } from "@/components/ui/fade-in";
import { MarketingPageCta } from "@/components/marketing/page-cta";
import { MarketingPageHero } from "@/components/marketing/page-hero";
import { marketingMetadata } from "@/lib/marketing/seo";
import { getAppLocale } from "@/lib/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    titleAr: "الشروط والأحكام | طاقم",
    titleEn: "Terms & Conditions | Taqam",
    descriptionAr: "الشروط والأحكام الكاملة لاستخدام منصة طاقم لإدارة الموارد البشرية.",
    descriptionEn: "Full terms and conditions for using Taqam HR platform.",
    path: "/terms",
  });
}

export default async function TermsPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";
  const lastUpdated = isAr ? "1 أبريل 2025" : "April 1, 2025";
  const legalEmail = "legal@taqam.net";

  return (
    <FadeIn direction="up">
      <main className="bg-background">
      <MarketingPageHero
        icon={FileText}
        badge={isAr ? "الاستخدام، الاشتراك، والمسؤولية" : "Use, subscription, and liability"}
        title={isAr ? "الشروط والأحكام" : "Terms & Conditions"}
        description={
          isAr
            ? "يُرجى قراءة هذه الشروط بعناية قبل استخدام منصة طاقم. استخدامك للمنصة يعني موافقتك التامة على هذه الشروط."
            : "Please read these terms carefully before using Taqam. Using the platform constitutes your full acceptance of these terms."
        }
        actions={[
          { href: `${p}/pricing`, label: isAr ? "راجع الأسعار" : "Review pricing", variant: "outline" },
          { href: `${p}/support`, label: isAr ? "التواصل معنا" : "Contact us", variant: "brand" },
        ]}
        stats={[
          { value: lastUpdated, label: isAr ? "آخر تحديث" : "Last updated" },
          { value: "99.5%", label: isAr ? "هدف التوفر الشهري" : "Monthly uptime target" },
          { value: legalEmail, label: isAr ? "قناة الشؤون القانونية" : "Legal contact" },
        ]}
      />

      <div className="container mx-auto max-w-5xl px-4 py-12">
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{isAr ? "آخر تحديث" : "Last updated"}</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{lastUpdated}</p>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{isAr ? "هدف التوفر" : "Availability target"}</p>
            <p className="mt-2 text-sm font-semibold text-foreground">99.5% {isAr ? "شهريًا" : "monthly"}</p>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{isAr ? "قناة التواصل" : "Contact channel"}</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{legalEmail}</p>
          </div>
        </div>

        <div className="space-y-6 text-sm leading-7 text-muted-foreground [&>section]:rounded-3xl [&>section]:border [&>section]:bg-card [&>section]:p-6 [&>section]:shadow-sm">

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {isAr ? "1. نطاق الخدمة" : "1. Scope of service"}
            </h2>
            <p>
              {isAr
                ? "تُقدّم منصة طاقم خدمة SaaS (برنامج كخدمة) لإدارة الموارد البشرية والرواتب والحضور للشركات العاملة في المملكة العربية السعودية. تشمل الخدمة: إدارة ملفات الموظفين، تتبع الحضور، معالجة الرواتب، إدارة الإجازات، التقارير، والتكاملات مع الأنظمة الحكومية."
                : "Taqam provides a SaaS (Software as a Service) solution for HR, payroll, and attendance management for companies operating in Saudi Arabia. Services include: employee records, attendance tracking, payroll processing, leave management, reporting, and integrations with government systems."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {isAr ? "2. المتطلبات والأهلية" : "2. Eligibility requirements"}
            </h2>
            <ul className="ms-4 list-disc space-y-1.5">
              <li>{isAr ? "يجب أن تكون شركة أو كيانًا قانونيًا مسجّلًا." : "You must be a registered company or legal entity."}</li>
              <li>{isAr ? "يجب أن يكون مسؤول الحساب بالغًا وموظفًا مخوّلًا للتعاقد باسم الشركة." : "The account administrator must be an adult and an authorized representative of the company."}</li>
              <li>{isAr ? "يجب تقديم معلومات صحيحة ودقيقة عند إنشاء الحساب والحفاظ على تحديثها." : "Accurate and complete information must be provided at account creation and kept current."}</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {isAr ? "3. الاستخدام المقبول" : "3. Acceptable use"}
            </h2>
            <p>{isAr ? "يُحظر استخدام المنصة لـ:" : "You may not use the platform to:"}</p>
            <ul className="ms-4 list-disc space-y-1.5">
              <li>{isAr ? "انتهاك القوانين أو الأنظمة السارية في المملكة العربية السعودية أو أي دولة أخرى قابلة التطبيق." : "Violate applicable laws in Saudi Arabia or any other applicable jurisdiction."}</li>
              <li>{isAr ? "محاولة الوصول غير المصرح به إلى الأنظمة أو بيانات المستخدمين الآخرين." : "Attempt unauthorized access to systems or other users' data."}</li>
              <li>{isAr ? "نشر أو إرسال محتوى ضار أو مضلل أو احتيالي." : "Distribute harmful, misleading, or fraudulent content."}</li>
              <li>{isAr ? "تحديل أو عكس هندسة أي جزء من كود المنصة أو بنيتها التحتية." : "Modify or reverse-engineer any part of the platform's code or infrastructure."}</li>
              <li>{isAr ? "الاستخدام التجاري لإعادة بيع الخدمة دون إذن كتابي مسبق." : "Commercial resale of the service without prior written permission."}</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {isAr ? "4. الحسابات والمسؤولية" : "4. Accounts & responsibility"}
            </h2>
            <p>
              {isAr
                ? "أنت مسؤول عن جميع الأنشطة التي تتم من خلال حسابك. يجب إخطارنا فورًا عند اكتشاف أي وصول غير مصرح به. لن نكون مسؤولين عن الخسائر الناتجة عن إخفاق في حماية بيانات الدخول."
                : "You are responsible for all activities occurring under your account. Notify us immediately upon discovering unauthorized access. We will not be liable for losses resulting from failure to protect login credentials."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {isAr ? "5. الاشتراك والدفع" : "5. Subscription & payment"}
            </h2>
            <ul className="ms-4 list-disc space-y-1.5">
              <li>{isAr ? "تُحتسب الرسوم بناءً على الباقة المختارة وعدد الموظفين وفق ما هو موضح في صفحة الأسعار." : "Fees are calculated based on the selected plan and number of employees as shown on the pricing page."}</li>
              <li>{isAr ? "الرسوم غير قابلة للاسترداد بعد انتهاء فترة الإلغاء المسموح بها إلا في حالات الخدمة المعطّلة الموثّقة." : "Fees are non-refundable after the permitted cancellation window, except in documented service outage cases."}</li>
              <li>{isAr ? "في حالة عدم السداد، يحق لنا تعليق الحساب بعد إشعار مسبق." : "In case of non-payment, we may suspend the account after prior notice."}</li>
              <li>{isAr ? "تخضع الأسعار للمراجعة السنوية، وسيتم إخطارك قبل 30 يومًا من أي تغيير." : "Prices are subject to annual review; you will be notified 30 days before any change."}</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {isAr ? "6. توفر الخدمة وضمان الجودة" : "6. Service availability & SLA"}
            </h2>
            <p>
              {isAr
                ? "نسعى لتحقيق نسبة توفّر لا تقل عن 99.5% شهريًا. أوقات التوقف المجدول للصيانة تُعلَن مسبقًا. لا نضمن التوفر الكامل في حالات القوة القاهرة أو الظروف الخارجة عن سيطرتنا مثل أعطال مزودي الاستضافة."
                : "We aim for at least 99.5% monthly uptime. Scheduled maintenance is announced in advance. We cannot guarantee full availability in cases of force majeure or circumstances outside our control such as hosting provider outages."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {isAr ? "7. الملكية الفكرية" : "7. Intellectual property"}
            </h2>
            <p>
              {isAr
                ? "جميع حقوق الملكية الفكرية للمنصة — بما فيها الكود والواجهة والعلامة التجارية — محفوظة تعود لطاقم. الاشتراك يمنحك حقّ استخدام منتهٍ وغير حصري وغير قابل للتحويل. لا يمنحك أي ملكية في المنصة أو مكوناتها."
                : "All intellectual property rights in the platform — including code, interface, and brand — belong to Taqam. Subscription grants you a limited, non-exclusive, non-transferable right to use. It does not grant any ownership in the platform or its components."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {isAr ? "8. الإنهاء" : "8. Termination"}
            </h2>
            <p>
              {isAr
                ? "يمكنك إنهاء اشتراكك في أي وقت من إعدادات الحساب. يحق لنا تعليق أو إنهاء حسابك فورًا في حالة انتهاك هذه الشروط، أو عدم السداد المتكرر، أو في حالات الاحتيال أو الاستخدام الضار المثبت. عند الإنهاء، يمكنك تصدير بياناتك خلال 30 يومًا قبل حذفها نهائيًا."
                : "You may terminate your subscription at any time from account settings. We may suspend or terminate your account immediately upon breach of these terms, repeated non-payment, or proven fraud or harmful use. Upon termination, you may export your data within 30 days before permanent deletion."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {isAr ? "9. حدود المسؤولية" : "9. Limitation of liability"}
            </h2>
            <p>
              {isAr
                ? "لن تكون طاقم أو مزودو خدماتها مسؤولين عن الأضرار غير المباشرة أو العرضية أو الخاصة أو التبعية أو الجزائية الناشئة عن استخدام المنصة أو عدم القدرة على استخدامها، حتى لو أُبلغنا باحتمال حدوث هذه الأضرار. في جميع الأحوال، تقتصر مسؤوليتنا على ما دفعته فعليًا خلال الاثني عشر شهرًا الماضية."
                : "Taqam and its service providers will not be liable for indirect, incidental, special, consequential, or punitive damages arising from use or inability to use the platform, even if notified of their possibility. In any event, our liability is limited to what you have actually paid in the past twelve months."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {isAr ? "10. القانون الحاكم وتسوية النزاعات" : "10. Governing law & dispute resolution"}
            </h2>
            <p>
              {isAr
                ? "تخضع هذه الشروط لقوانين المملكة العربية السعودية. في حالة نشوء نزاع، يسعى الطرفان للحلّ الودّي خلال 30 يومًا. إذا لم يُحسم النزاع وديًا، تختص المحاكم السعودية المختصة بالنظر فيه."
                : "These terms are governed by the laws of Saudi Arabia. In case of a dispute, both parties will seek an amicable resolution within 30 days. If not resolved amicably, the competent Saudi courts shall have jurisdiction."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {isAr ? "11. تعديلات الشروط" : "11. Amendments"}
            </h2>
            <p>
              {isAr
                ? "نحتفظ بالحق في تعديل هذه الشروط. سيتم إخطارك بأي تعديلات جوهرية بالبريد الإلكتروني أو عبر المنصة قبل 14 يومًا من تطبيقها. استمرار استخدامك للمنصة بعد تطبيق التعديلات يعني قبولها."
                : "We reserve the right to amend these terms. You will be notified of material amendments by email or in-platform notice at least 14 days before they take effect. Continued use after the effective date constitutes acceptance."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {isAr ? "12. التواصل" : "12. Contact"}
            </h2>
            <p>{isAr ? "لأي استفسار بشأن هذه الشروط:" : "For any questions about these terms:"}</p>
            <div className="space-y-1">
              <p><span className="text-foreground">{isAr ? "البريد الإلكتروني:" : "Email:"}</span>{" "}<a href="mailto:legal@taqam.net" className="text-primary hover:underline">legal@taqam.net</a></p>
              <p><span className="text-foreground">{isAr ? "الموقع:" : "Website:"}</span>{" "}<a href="https://taqam.net" className="text-primary hover:underline">taqam.net</a></p>
            </div>
          </section>

        </div>
      </div>

      <MarketingPageCta
        title={isAr ? "هل تحتاج تفسيرًا لبند تعاقدي أو تشغيلي؟" : "Need clarification on a contractual or operational clause?"}
        description={
          isAr
            ? "إذا كان لديك سؤال حول الاستخدام المسموح، الدفع، الإنهاء، أو تصدير البيانات، تواصل معنا وسنوضح البند المناسب حسب حالتك."
            : "If you have a question about acceptable use, billing, termination, or data export, contact us and we will clarify the relevant clause for your case."
        }
        primaryAction={{ href: `${p}/support`, label: isAr ? "تواصل معنا" : "Contact us" }}
        secondaryAction={{ href: `${p}/pricing`, label: isAr ? "الأسعار والباقات" : "Pricing & plans" }}
      />
    </main>
    </FadeIn>
  );
}