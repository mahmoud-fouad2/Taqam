import { NotFoundShell } from "@/components/marketing/not-found-shell";
import { getAppLocale } from "@/lib/i18n/locale";

export default async function NotFound() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";

  return (
    <NotFoundShell
      code="404"
      compact={false}
      locale={isAr ? "ar" : "en"}
      description={
        isAr
          ? "الرابط الذي فتحته غير موجود الآن أو تم نقله إلى مسار أحدث. استخدم الاختصارات التالية للوصول السريع إلى أهم الأسطح العامة والتشغيلية."
          : "The link you opened does not exist right now or has moved to a newer route. Use the shortcuts below to jump back into the main public and operational surfaces."
      }
      eyebrow={isAr ? "تعذر العثور على الصفحة المطلوبة" : "We couldn't find this page"}
      primaryAction={{ href: `${p}/`, label: isAr ? "العودة للرئيسية" : "Back home" }}
      quickLinks={[
        {
          href: `${p}/careers`,
          title: isAr ? "بوابة الوظائف" : "Careers portal",
          description: isAr ? "اكتشف الوظائف المفتوحة لدى الشركات العاملة على طاقم." : "Browse active openings across companies running on Taqam.",
        },
        {
          href: `${p}/help-center`,
          title: isAr ? "مركز المساعدة" : "Help center",
          description: isAr ? "أدلة الإعداد والاستخدام والتشغيل في مكان واحد." : "Setup, usage, and operational guidance in one place.",
        },
        {
          href: `${p}/dashboard`,
          title: isAr ? "لوحة التحكم" : "Dashboard",
          description: isAr ? "ارجع مباشرة إلى مساحة العمل إذا كنت مسجل الدخول." : "Jump back to the workspace if you are already signed in.",
        },
      ]}
      secondaryAction={{ href: `${p}/support`, label: isAr ? "تواصل مع الدعم" : "Contact support", variant: "outline" }}
      title={isAr ? "هذه الصفحة لم تعد هنا" : "This page is no longer here"}
    />
  );
}
