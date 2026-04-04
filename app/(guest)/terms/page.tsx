import type { Metadata } from "next";

import { marketingMetadata } from "@/lib/marketing/seo";
import { getAppLocale } from "@/lib/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    titleAr: "الشروط والأحكام | طاقم",
    titleEn: "Terms & Conditions | Taqam",
    descriptionAr: "الشروط والأحكام لاستخدام منصة طاقم.",
    descriptionEn: "Terms and conditions for using Taqam.",
    path: "/terms",
  });
}

export default async function TermsPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">{isAr ? "الشروط والأحكام" : "Terms & Conditions"}</h1>
      <p className="mt-3 text-muted-foreground">
        {isAr
          ? "باستخدامك لمنصة طاقم فأنت توافق على هذه الشروط."
          : "By using Taqam, you agree to these terms."}
      </p>

      <div className="mt-10 space-y-8 text-sm leading-7 text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            {isAr ? "1) الاستخدام المقبول" : "1) Acceptable use"}
          </h2>
          <p>
            {isAr
              ? "يجب استخدام المنصة بشكل قانوني وعدم إساءة استخدامها أو محاولة الوصول غير المصرح به."
              : "You must use the platform lawfully and must not attempt unauthorized access or abuse."}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            {isAr ? "2) الحسابات والصلاحيات" : "2) Accounts & access"}
          </h2>
          <p>
            {isAr
              ? "أنت مسؤول عن الحفاظ على سرية بيانات الدخول وعن أي نشاط يتم عبر حسابك."
              : "You are responsible for keeping your credentials secure and for any activity under your account."}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            {isAr ? "3) توفر الخدمة" : "3) Service availability"}
          </h2>
          <p>
            {isAr
              ? "نسعى لتوفير الخدمة باستمرار، وقد تتوقف مؤقتًا للصيانة أو لأسباب خارجة عن إرادتنا."
              : "We aim for continuous availability, but the service may be temporarily interrupted for maintenance or reasons beyond our control."}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            {isAr ? "4) التغييرات" : "4) Changes"}
          </h2>
          <p>
            {isAr
              ? "قد نقوم بتحديث هذه الشروط من وقت لآخر. استمرار الاستخدام يعني قبول النسخة المحدثة."
              : "We may update these terms from time to time. Continued use means you accept the updated version."}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            {isAr ? "5) التواصل" : "5) Contact"}
          </h2>
          <p>
            {isAr
              ? "للاستفسارات حول الشروط، تواصل معنا من خلال صفحة الدعم."
              : "For questions about these terms, contact us through the support page."}
          </p>
        </section>
      </div>
    </main>
  );
}
