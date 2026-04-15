import { getAppLocale } from "@/lib/i18n/locale";
import { getText } from "@/lib/i18n/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function HelpCenterPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  const p = locale === "en" ? "/en" : "";
  const session = await getServerSession(authOptions);
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.common.helpCenter}</h1>
        <p className="text-muted-foreground">
          {locale === "ar"
            ? "هنا ستجد أدلة الاستخدام، روابط الدعم، والمسارات السريعة للأقسام الأكثر استخدامًا داخل النظام."
            : "Find guidance, support routes, and quick links to the most-used areas across the platform."}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{locale === "ar" ? "الموارد العامة" : "Public resources"}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-2 text-sm">
            <Link className="text-primary block hover:underline" href={`${p}/help-center`}>
              {locale === "ar" ? "مركز المساعدة العام" : "Public help center"}
            </Link>
            <Link className="text-primary block hover:underline" href={`${p}/pricing`}>
              {locale === "ar" ? "الأسعار والباقات" : "Pricing and plans"}
            </Link>
            <Link className="text-primary block hover:underline" href={`${p}/request-demo`}>
              {locale === "ar" ? "تواصل معنا" : "Talk to us"}
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{locale === "ar" ? "لوحة الشركة" : "Tenant workspace"}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-2 text-sm">
            <Link className="text-primary block hover:underline" href={`${p}/dashboard/employees`}>
              {locale === "ar" ? "إدارة الموظفين" : "Employees"}
            </Link>
            <Link className="text-primary block hover:underline" href={`${p}/dashboard/attendance`}>
              {locale === "ar" ? "الحضور والانصراف" : "Attendance"}
            </Link>
            <Link className="text-primary block hover:underline" href={`${p}/dashboard/payroll`}>
              {locale === "ar" ? "الرواتب" : "Payroll"}
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{locale === "ar" ? t.helpCenter.support : "Support and tickets"}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-3 text-sm">
            <p>
              {locale === "ar"
                ? "إذا واجهتك مشكلة تشغيلية داخل الحساب، افتح تذكرة دعم ليتم تتبع الحالة والرد عليها بشكل منظم."
                : "If you hit an operational issue inside the account, open a support ticket so the case can be tracked and answered clearly."}
            </p>
            <Button asChild size="sm">
              <Link href={`${p}/dashboard/support`}>
                {locale === "ar" ? "فتح / متابعة التذاكر" : "Open / track tickets"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "ابدأ من المسار المناسب" : "Start from the right route"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="grid gap-2 md:grid-cols-2">
            <Link className="text-primary hover:underline" href={`${p}/dashboard/help-center`}>
              {locale === "ar" ? "شرح الأدوات داخل الداشبورد" : "In-app help"}
            </Link>
            <Link className="text-primary hover:underline" href={`${p}/faq`}>
              {locale === "ar" ? "الأسئلة الشائعة العامة" : "Public FAQ"}
            </Link>
            <Link className="text-primary hover:underline" href={`${p}/dashboard/leave-requests`}>
              {locale === "ar" ? "طلبات الإجازات" : "Leave requests"}
            </Link>
            <Link className="text-primary hover:underline" href={`${p}/docs`}>
              {locale === "ar" ? "التوثيق (Docs)" : "Documentation"}
            </Link>
            {isSuperAdmin ? (
              <>
                <Link
                  className="text-primary hover:underline"
                  href={`${p}/dashboard/super-admin/tenants`}>
                  {locale === "ar" ? "لوحة السوبر أدمن: الشركات" : "Super Admin: Tenants"}
                </Link>
                <Link
                  className="text-primary hover:underline"
                  href={`${p}/dashboard/super-admin/pricing`}>
                  {locale === "ar" ? "لوحة السوبر أدمن: الأسعار والباقات" : "Super Admin: Pricing"}
                </Link>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{locale === "ar" ? "قبل فتح تذكرة" : "Before opening a ticket"}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-3 text-sm">
          <div>
            <p className="text-foreground font-medium">
              {locale === "ar"
                ? "ابدأ بالمعلومة أو الخطوة الأقرب لسؤالك"
                : "Start with the closest route to your question"}
            </p>
            <p>
              {locale === "ar"
                ? "إذا كان المطلوب شرحًا أو سياسة استخدام، راجع مركز المساعدة أو التوثيق أولًا. وإذا كانت المشكلة داخل بيانات شركتك أو الصلاحيات أو العمليات اليومية، افتح تذكرة من لوحة الدعم."
                : "If you need guidance or policy clarification, start with the help center or docs. If the issue is inside your company data, permissions, or day-to-day operations, open a support ticket from the dashboard."}
            </p>
          </div>
          <div>
            <p className="text-foreground font-medium">
              {locale === "ar"
                ? "متى أستخدم لوحة الشركة ومتى أرجع لإدارة المنصة؟"
                : "When should I use the company workspace vs platform admin?"}
            </p>
            <p>
              {locale === "ar"
                ? "لوحة الشركة مخصصة لتشغيل الموظفين والحضور والرواتب والطلبات داخل شركة محددة. أما إدارة المنصة فهي للشركات والباقات والإعدادات العامة على مستوى الـ SaaS كله."
                : "Use the company workspace for employees, attendance, payroll, and requests within one tenant. Use platform admin for tenants, plans, and SaaS-wide controls."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
