import { redirect } from "next/navigation";
import { requireTenantAccess } from "@/lib/auth";
import { SsoSettingsClient } from "./sso-settings-client";
import { IconKey } from "@tabler/icons-react";
import { getText } from "@/lib/i18n/text";
import { getAppLocale } from "@/lib/i18n/locale";
import prisma from "@/lib/db";
import { sanitizeTenantSsoSettingsForClient } from "@/lib/security/tenant-sso";

export async function generateMetadata() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return {
    title: t.ssoSettings.pageTitle,
    description: t.ssoSettings.pageDesc
  };
}

export default async function SsoSettingsPage() {
  const user = await requireTenantAccess();
  const locale = await getAppLocale();
  const t = getText(locale);

  // Only TENANT_ADMIN can access SSO settings
  if (user.role !== "TENANT_ADMIN") {
    redirect("/dashboard/settings");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId! },
    select: { settings: true }
  });

  const settings = (tenant?.settings as Record<string, unknown> | null) ?? {};
  const initialConfig = sanitizeTenantSsoSettingsForClient(settings.sso);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10">
          <IconKey className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.ssoSettings.pageTitle}</h1>
          <p className="text-muted-foreground text-sm">{t.ssoSettings.pageDesc}</p>
        </div>
      </div>

      <SsoSettingsClient initialConfig={initialConfig} />
    </div>
  );
}
