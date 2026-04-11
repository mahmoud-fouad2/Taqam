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
            ? "بوابة موحدة تربط بين مركز المساعدة العام، التذاكر، وروابط العمل داخل لوحة الشركة أو السوبر أدمن."
            : "A unified hub linking the public help center, support tickets, and the right workspace routes for tenant or super-admin users."}
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
              {locale === "ar" ? "طلب عرض تجريبي" : "Request a demo"}
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
                ? "لو المشكلة تشغيلية داخل الحساب، ارفع تذكرة من لوحة الدعم لتبقى الحالة مرتبطة بالشركة والمستخدم المتأثر."
                : "If the issue is operational inside the account, open a ticket so the case stays linked to the affected company and user."}
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
          <CardTitle>{locale === "ar" ? "مسارات العمل الصحيحة" : "Correct work paths"}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="grid gap-2 md:grid-cols-2">
            <Link className="text-primary hover:underline" href={`${p}/dashboard/help-center`}>
              {locale === "ar" ? "مساعدة داخلية للداشبورد" : "In-app help center"}
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
          <CardTitle>
            {locale === "ar" ? "تمييز مهم بين الأسطح" : "Important surface distinction"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-3 text-sm">
          <div>
            <p className="text-foreground font-medium">
              {locale === "ar"
                ? "ما الفرق بين الموظفين والمستخدمين؟"
                : "What's the difference between Employees and Users?"}
            </p>
            <p>
              {locale === "ar"
                ? "الموظف = ملف موارد بشرية داخل الشركة. المستخدم = حساب تسجيل دخول وصلاحيات. ممكن يكون عندك موظف بدون حساب دخول، أو مستخدم بدون ملف موظف (مثل السوبر أدمن)."
                : "Employee is an HR record inside a tenant. User is a login account with permissions. You can have employees without logins, and users without employee records (e.g. Super Admin)."}
            </p>
          </div>
          <div>
            <p className="text-foreground font-medium">
              {locale === "ar"
                ? "متى أستخدم السوبر أدمن ومتى أستخدم لوحة الشركة؟"
                : "When do I use super-admin vs tenant dashboard?"}
            </p>
            <p>
              {locale === "ar"
                ? "السوبر أدمن لإدارة المنصة والشركات والباقات. لوحة الشركة لإدارة الموظفين والحضور والرواتب داخل شركة محددة."
                : "Use super-admin for platform, tenant, and plan management. Use a tenant dashboard for employees, attendance, payroll, and company-specific operations."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
