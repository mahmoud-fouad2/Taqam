import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { requireTenantRole } from "@/lib/auth";
import { getAppLocale } from "@/lib/i18n/locale";
import { buildTenantUrl } from "@/lib/tenant";

import { JobPostingsManager } from "./job-postings-manager";
import { getText } from "@/lib/i18n/text";

export default async function JobPostingsPage() {
  const [user, locale] = await Promise.all([
    requireTenantRole(["TENANT_ADMIN", "HR_MANAGER"]),
    getAppLocale()
  ]);
  const t = getText(locale);
  const tenantSlug = user?.tenant?.slug;
  const p = locale === "en" ? "/en" : "";

  if (!tenantSlug) {
    redirect(`${p}/dashboard`);
  }

  const companyPortalHref = tenantSlug ? buildTenantUrl(tenantSlug, "/careers") : `${p}/careers`;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.jobPostings.pageTitle}</h1>
          <p className="text-muted-foreground">{t.jobPostings.pManageJobPostingsAndAvailableP}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`${p}/careers`}>{t.jobPostings.pCombinedJobPortal}</Link>
          </Button>
          <Button asChild variant="brand">
            <a href={companyPortalHref} rel="noreferrer" target="_blank">
              {t.jobPostings.pCompanyPublicPortal}
            </a>
          </Button>
        </div>
      </div>
      <JobPostingsManager />
    </div>
  );
}
