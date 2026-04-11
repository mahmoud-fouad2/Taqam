/**
 * Tenants List Page
 * شاشة قائمة الشركات
 */

import { Suspense } from "react";
import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TenantsTable } from "./tenants-table";
import { getText } from "@/lib/i18n/text";
import { getAppLocale } from "@/lib/i18n/locale";

export default async function TenantsPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Building2 className="h-6 w-6" />
            {t.tenants.pManageCompanies}
          </h1>
          <p className="text-muted-foreground">{t.tenants.pViewAndManageAllRegisteredComp}</p>
        </div>
        <Link href="/dashboard/super-admin/tenants/new">
          <Button>
            <Plus className="me-2 h-4 w-4" />
            {t.common.add}
          </Button>
        </Link>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Suspense fallback={<div className="p-8 text-center">{t.common.loading}</div>}>
            <TenantsTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
