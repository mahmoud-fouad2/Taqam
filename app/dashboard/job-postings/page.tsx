import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getAppLocale } from "@/lib/i18n/locale";
import { buildTenantUrl } from "@/lib/tenant";

import { JobPostingsManager } from "./job-postings-manager";

export default async function JobPostingsPage() {
  const [user, locale] = await Promise.all([getCurrentUser(), getAppLocale()]);
  const tenantSlug = user?.tenant?.slug;
  const p = locale === "en" ? "/en" : "";
  const companyPortalHref = tenantSlug ? buildTenantUrl(tenantSlug, "/careers") : `${p}/careers`;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الوظائف الشاغرة</h1>
          <p className="text-muted-foreground">إدارة إعلانات الوظائف والمناصب المتاحة</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`${p}/careers`}>بوابة الوظائف المجمعة</Link>
          </Button>
          <Button asChild variant="brand">
            <a href={companyPortalHref} rel="noreferrer" target="_blank">بوابة الشركة العامة</a>
          </Button>
        </div>
      </div>
      <JobPostingsManager />
    </div>
  );
}
