"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function EmployeesStats({
  totalEmployees,
  activeCount,
  onboardingCount,
  departmentsCount,
}: {
  totalEmployees: number;
  activeCount: number;
  onboardingCount: number;
  departmentsCount: number;
}) {
  const locale = useClientLocale();
  const t = getText(locale);
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t.departments.totalEmployees}</CardDescription>
          <CardTitle className="text-3xl">{totalEmployees}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t.employees.pActive}</CardDescription>
          <CardTitle className="text-3xl text-green-600">{activeCount}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t.employees.pPendingHire}</CardDescription>
          <CardTitle className="text-3xl text-blue-600">{onboardingCount}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t.common.departments}</CardDescription>
          <CardTitle className="text-3xl">{departmentsCount}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
