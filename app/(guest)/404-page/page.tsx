import { NotFoundShell } from "@/components/marketing/not-found-shell";
import { FadeIn } from "@/components/ui/fade-in";
import { generateMeta } from "@/lib/utils";
import { getAppLocale } from "@/lib/i18n/locale";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "404",
    description: "Page not found."
  });
}

export default async function Error404() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";

  return (
    <FadeIn direction="up">
      <NotFoundShell
        code="404"
        description={
          isAr
            ? "الصفحة التي طلبتها غير متاحة. استخدم الروابط التالية للوصول إلى القسم المناسب."
            : "The page you requested is unavailable. Use the links below to reach the appropriate section."
        }
        eyebrow={isAr ? "صفحة غير موجودة" : "Page not found"}
        primaryAction={{ href: p || "/", label: isAr ? "العودة للرئيسية" : "Go back home" }}
        quickLinks={[
          {
            href: `${p}/careers`,
            title: isAr ? "بوابة الوظائف" : "Careers portal",
            description: isAr
              ? "الوصول السريع إلى كل الوظائف المفتوحة والتقديم عليها."
              : "Jump into live roles and apply directly."
          },
          {
            href: `${p}/help-center`,
            title: isAr ? "مركز المساعدة" : "Help center",
            description: isAr
              ? "أدلة الاستخدام والإعداد والرد على الأسئلة الشائعة."
              : "Usage, setup, and FAQ guidance in one place."
          }
        ]}
        secondaryAction={{
          href: `${p}/help-center`,
          label: isAr ? "مركز المساعدة" : "Help center",
          variant: "outline"
        }}
        title={isAr ? "تعذر العثور على الصفحة المطلوبة" : "We couldn't find the requested page"}
      />
    </FadeIn>
  );
}
