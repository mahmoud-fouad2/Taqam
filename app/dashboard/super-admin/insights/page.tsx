import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Building2, CircleAlert, CircleCheckBig, CreditCard, ShieldCheck, Users } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAppLocale } from "@/lib/i18n/locale";

export default async function SuperAdminInsightsPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const [tenants, users, openTickets, activeTenants, enterpriseTenants] = await Promise.all([
    prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        plan: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            employees: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    }),
    prisma.user.count(),
    prisma.supportTicket.count({
      where: {
        status: {
          in: ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"]
        }
      }
    }),
    prisma.tenant.count({
      where: {
        status: "ACTIVE"
      }
    }),
    prisma.tenant.count({
      where: {
        plan: "ENTERPRISE"
      }
    })
  ]);

  const pendingTenants = tenants.filter((tenant) => tenant.status === "PENDING").length;
  const suspendedTenants = tenants.filter((tenant) => tenant.status === "SUSPENDED").length;
  const basicTenants = tenants.filter((tenant) => tenant.plan === "BASIC").length;
  const professionalTenants = tenants.filter((tenant) => tenant.plan === "PROFESSIONAL").length;
  const totalEmployees = tenants.reduce((sum, tenant) => sum + tenant._count.employees, 0);
  const formatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    dateStyle: "medium"
  });

  const metrics = [
    {
      title: isAr ? "إجمالي الشركات" : "Total tenants",
      value: tenants.length,
      description: isAr ? "كل العملاء النشطين وقيد الإعداد" : "All active and onboarding customers",
      icon: Building2
    },
    {
      title: isAr ? "الشركات النشطة" : "Active tenants",
      value: activeTenants,
      description: isAr ? "القواعد العاملة حاليًا على المنصة" : "Accounts currently operating on the platform",
      icon: CircleCheckBig
    },
    {
      title: isAr ? "إجمالي المستخدمين" : "Platform users",
      value: users,
      description: isAr ? "كل مسؤولي وموظفي العملاء" : "All customer admins and employee users",
      icon: Users
    },
    {
      title: isAr ? "تذاكر الدعم المفتوحة" : "Open support tickets",
      value: openTickets,
      description: isAr ? "تحتاج متابعة مركزية" : "Need centralized follow-up",
      icon: CircleAlert
    }
  ];

  const distribution = [
    { label: isAr ? "أساسي" : "Basic", value: basicTenants },
    { label: isAr ? "احترافي" : "Professional", value: professionalTenants },
    { label: isAr ? "مؤسسي" : "Enterprise", value: enterpriseTenants },
    { label: isAr ? "معلّق" : "Suspended", value: suspendedTenants }
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isAr ? "رؤية تشغيلية على مستوى المنصة" : "Platform-wide operational insight"}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-6">
          {isAr
            ? "هذه اللوحة تمنح السوبر أدمن متابعة موحدة للصحة التشغيلية، تنوع الباقات، أحجام العملاء، والضغط الحالي على الدعم."
            : "This page gives super admins a unified view of operational health, plan mix, tenant scale, and current support pressure."}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.title} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">{metric.title}</p>
                <Icon className="text-primary size-5" />
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight">{metric.value.toLocaleString()}</p>
              <p className="text-muted-foreground mt-2 text-sm leading-6">{metric.description}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="text-primary size-5" />
            <h2 className="font-semibold">{isAr ? "توزيع الباقات والحالات" : "Plan and status distribution"}</h2>
          </div>
          <div className="space-y-4">
            {distribution.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
                <div className="bg-muted h-2 rounded-full">
                  <div
                    className={`bg-primary h-2 rounded-full ${progressWidthClass(
                      tenants.length === 0 ? 0 : (item.value / tenants.length) * 100
                    )}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="text-primary size-5" />
            <h2 className="font-semibold">{isAr ? "ملخص الجاهزية التشغيلية" : "Operational readiness summary"}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <InsightStat label={isAr ? "شركات بانتظار التفعيل" : "Pending activation"} value={pendingTenants} />
            <InsightStat label={isAr ? "إجمالي الموظفين المسجلين" : "Tracked employees"} value={totalEmployees} />
            <InsightStat label={isAr ? "عملاء Enterprise" : "Enterprise customers"} value={enterpriseTenants} />
            <InsightStat label={isAr ? "ضغط الدعم الحالي" : "Current support load"} value={openTickets} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="font-semibold">{isAr ? "أحدث الشركات المنضمة" : "Newest tenant accounts"}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-3 py-3 font-medium">{isAr ? "الشركة" : "Tenant"}</th>
                <th className="px-3 py-3 font-medium">{isAr ? "الحالة" : "Status"}</th>
                <th className="px-3 py-3 font-medium">{isAr ? "الباقة" : "Plan"}</th>
                <th className="px-3 py-3 font-medium">{isAr ? "المستخدمون" : "Users"}</th>
                <th className="px-3 py-3 font-medium">{isAr ? "الموظفون" : "Employees"}</th>
                <th className="px-3 py-3 font-medium">{isAr ? "تاريخ الإنشاء" : "Created"}</th>
              </tr>
            </thead>
            <tbody>
              {tenants.slice(0, 8).map((tenant) => (
                <tr key={tenant.id} className="border-b last:border-b-0">
                  <td className="px-3 py-3">
                    <div className="font-medium">{tenant.name}</div>
                    <div className="text-xs text-muted-foreground">/{tenant.slug}</div>
                  </td>
                  <td className="px-3 py-3">{tenant.status}</td>
                  <td className="px-3 py-3">{tenant.plan}</td>
                  <td className="px-3 py-3">{tenant._count.users}</td>
                  <td className="px-3 py-3">{tenant._count.employees}</td>
                  <td className="px-3 py-3 text-muted-foreground">{formatter.format(tenant.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function InsightStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-muted/20 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value.toLocaleString()}</p>
    </div>
  );
}

function progressWidthClass(percent: number) {
  if (percent <= 0) return "w-0";
  if (percent <= 8) return "w-1/12";
  if (percent <= 16) return "w-1/6";
  if (percent <= 25) return "w-1/4";
  if (percent <= 33) return "w-1/3";
  if (percent <= 42) return "w-5/12";
  if (percent <= 50) return "w-1/2";
  if (percent <= 58) return "w-7/12";
  if (percent <= 66) return "w-2/3";
  if (percent <= 75) return "w-3/4";
  if (percent <= 83) return "w-5/6";
  if (percent <= 91) return "w-11/12";
  return "w-full";
}