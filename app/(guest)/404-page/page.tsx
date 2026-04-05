import { NotFoundShell } from "@/components/marketing/not-found-shell";
import { generateMeta } from "@/lib/utils";
import { getAppLocale } from "@/lib/i18n/locale";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "404",
    description: "Page not found.",
  });
}

export default async function Error404() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";

  return (
    <NotFoundShell
      code="404"
      description={
        isAr
          ? "هذه نسخة الهبوط العامة من صفحة 404. استخدمها عندما تريد تحويل المرشح أو الزائر إلى المسارات الصحيحة بدل فقده داخل رابط مكسور."
          : "This is the public landing version of the 404 experience, designed to redirect a visitor into the right paths instead of leaving them on a dead URL."
      }
      eyebrow={isAr ? "صفحة غير موجودة" : "Page not found"}
      primaryAction={{ href: p || "/", label: isAr ? "العودة للرئيسية" : "Go back home" }}
      quickLinks={[
        {
          href: `${p}/careers`,
          title: isAr ? "بوابة الوظائف" : "Careers portal",
          description: isAr ? "الوصول السريع إلى كل الوظائف المفتوحة والتقديم عليها." : "Jump into live roles and apply directly.",
        },
        {
          href: `${p}/help-center`,
          title: isAr ? "مركز المساعدة" : "Help center",
          description: isAr ? "أدلة الاستخدام والإعداد والرد على الأسئلة الشائعة." : "Usage, setup, and FAQ guidance in one place.",
        },
      ]}
      secondaryAction={{ href: `${p}/help-center`, label: isAr ? "مركز المساعدة" : "Help center", variant: "outline" }}
      title={isAr ? "تعذر العثور على الصفحة المطلوبة" : "We couldn't find the requested page"}
    />
  );
}
