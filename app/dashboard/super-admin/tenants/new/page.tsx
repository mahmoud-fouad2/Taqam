/**
 * Create Tenant Wizard Page
 * معالج إنشاء شركة جديدة
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { CreateTenantForm } from "./create-tenant-form";
import { getText } from "@/lib/i18n/text";
import { getAppLocale } from "@/lib/i18n/locale";

export default async function CreateTenantPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Building2 className="h-6 w-6" />
          {t.common.add}
        </h1>
        <p className="text-muted-foreground">{t.tenant.pEnterCompanyDataToCreateANewAc}</p>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t.organization.companySection}</CardTitle>
          <CardDescription>{t.tenant.requiredFieldsNote}</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateTenantForm />
        </CardContent>
      </Card>
    </div>
  );
}
