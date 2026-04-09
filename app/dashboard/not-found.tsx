import Link from "next/link";

import { NotFoundShell } from "@/components/marketing/not-found-shell";
import { Button } from "@/components/ui/button";
import { getAppLocale } from "@/lib/i18n/locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export default async function DashboardNotFound() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";

  return (
    <NotFoundShell
      compact
      locale={isAr ? "ar" : "en"}
      description={
        isAr
          ? "المسار الذي حاولت فتحه داخل الداشبورد غير موجود أو نُقل إلى وحدة أخرى. استخدم الروابط التالية للرجوع بسرعة إلى الأسطح التشغيلية الصحيحة."
          : "The dashboard route you tried to open is missing or has moved to another module. Use these shortcuts to get back to the right operational surfaces."
      }
      eyebrow={isAr ? "خطأ مسار داخل لوحة التحكم" : "Dashboard route not found"}
      primaryAction={{ href: `${p}/dashboard`, label: isAr ? t.common.goToDashboard2 : "Back to dashboard", variant: "brand" }}
      quickLinks={[
        {
          href: `${p}/dashboard/help-center`,
          title: isAr ? "مركز المساعدة الداخلي" : "In-app help center",
          description: isAr ? "اختصارات التشغيل الصحيحة والتمييز بين أسطح المنصة." : "Correct operational paths and distinctions between platform surfaces.",
        },
        {
          href: `${p}/dashboard/support`,
          title: isAr ? t.helpCenter.support : "Support & tickets",
          description: isAr ? "افتح أو تابع الحالات المرتبطة بالشركة أو المستخدمين." : "Open or track cases tied to the tenant or affected users.",
        },
        {
          href: `${p}/dashboard/job-postings`,
          title: isAr ? "التوظيف والكارير بورتال" : "Recruitment & careers",
          description: isAr ? "إدارة الوظائف الشاغرة وروابط البوابة العامة للشركة." : "Manage open roles and the tenant's public careers portal links.",
        },
      ]}
      secondaryAction={{ href: `${p}/dashboard/help-center`, label: isAr ? t.helpCenter.title : "Help center", variant: "outline" }}
      title={isAr ? "هذه الصفحة ليست ضمن المسار الحالي" : "This page is not in the current route tree"}
    />
  );
}
