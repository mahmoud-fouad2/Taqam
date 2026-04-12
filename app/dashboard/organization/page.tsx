import type { Metadata } from "next";
import { generateMeta } from "@/lib/utils";
import { OrganizationManager } from "./organization-manager-new";
import { getText } from "@/lib/i18n/text";
import { getAppLocale } from "@/lib/i18n/locale";
import { requireTenantRole } from "@/lib/auth";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAppLocale();
  const t = getText(locale);
  return generateMeta({
    title: `${t.organization.pOrganizationStructure} - Organization`,
    description: `${t.organization.pManageCompanyAndBranchData} - Core HR Phase 3`
  });
}

export default async function OrganizationPage() {
  await requireTenantRole(["TENANT_ADMIN", "HR_MANAGER", "MANAGER"]);
  const locale = await getAppLocale();
  const t = getText(locale);
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {t.organization.pOrganizationStructure}
        </h1>
      </div>
      <OrganizationManager />
    </>
  );
}
