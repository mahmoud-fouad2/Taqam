import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Bot } from "lucide-react";
import { requireTenantAccess } from "@/lib/auth";
import { getAutomationDashboard } from "@/lib/automation";
import { AutomationManager } from "./automation-manager";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "الأتمتة | الإعدادات",
    description: "إدارة الـ workflows والتنبيهات التلقائية داخل الشركة"
  });
}

export default async function AutomationSettingsPage() {
  const user = await requireTenantAccess();

  if (!user.tenantId || !["TENANT_ADMIN", "HR_MANAGER"].includes(user.role)) {
    redirect("/dashboard/settings");
  }

  const data = await getAutomationDashboard(user.tenantId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10">
          <Bot className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">الأتمتة</h1>
          <p className="text-muted-foreground text-sm">
            إدارة الـ workflows المبنية على الأحداث مع سجل التشغيل وإعادة المحاولة.
          </p>
        </div>
      </div>

      <AutomationManager initialData={data} />
    </div>
  );
}
