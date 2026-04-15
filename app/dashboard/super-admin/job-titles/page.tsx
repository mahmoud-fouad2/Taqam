import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMeta } from "@/lib/utils";
import { requirePlatformAdmin } from "@/lib/auth";
import { getAppLocale } from "@/lib/i18n/locale";
import {
  getCuratedJobTitleCatalog,
  type CuratedJobTitleDefinition
} from "@/lib/hr/job-title-catalog";
import { getLevelLabel, getLevelLabelAr } from "@/lib/types/core-hr";

function getLocalizedLevelLabel(level: number, locale: "ar" | "en") {
  return locale === "ar" ? getLevelLabelAr(level) : getLevelLabel(level);
}

function getLocalizedTitle(item: CuratedJobTitleDefinition, locale: "ar" | "en") {
  return locale === "ar" ? item.nameAr : item.name;
}

function getLocalizedSubtitle(item: CuratedJobTitleDefinition, locale: "ar" | "en") {
  return locale === "ar" ? item.name : item.nameAr;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAppLocale();

  return generateMeta({
    title: locale === "ar" ? "مكتبة المسميات الوظيفية" : "Job Title Library",
    description:
      locale === "ar"
        ? "المسميات المركزية التي تُزامَن تلقائيًا إلى الشركات عند إدارة الموظفين."
        : "The central job title library that is synced automatically into tenant workspaces."
  });
}

export default async function SuperAdminJobTitlesPage() {
  await requirePlatformAdmin();

  const locale = await getAppLocale();
  const catalog = getCuratedJobTitleCatalog();
  const managementTitles = catalog.filter((item) => item.level >= 4).length;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          {locale === "ar" ? "مكتبة المسميات الوظيفية" : "Job title library"}
        </h1>
        <p className="text-muted-foreground max-w-3xl text-sm leading-7">
          {locale === "ar"
            ? "هذه هي المسميات القياسية التي تظهر تلقائيًا للشركات عند إضافة الموظفين. تم إغلاق إدارة المسميات من جهة الشركة حتى يبقى الاختيار موحدًا وقابلًا للبحث بدل الاعتماد على مسميات محلية متفرقة."
            : "These are the standard job titles that tenant teams receive automatically when adding employees. Tenant-side job title management is disabled so selection stays searchable and consistent."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {locale === "ar" ? "إجمالي المسميات القياسية" : "Curated titles"}
            </CardDescription>
            <CardTitle className="text-3xl">{catalog.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {locale === "ar" ? "المسميات الإدارية" : "Management titles"}
            </CardDescription>
            <CardTitle className="text-3xl">{managementTitles}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {locale === "ar" ? "آلية التوزيع" : "Provisioning mode"}
            </CardDescription>
            <CardTitle className="text-lg">
              {locale === "ar" ? "تزامن تلقائي للشركات" : "Automatic tenant sync"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{locale === "ar" ? "الكتالوج الحالي" : "Current catalog"}</CardTitle>
          <CardDescription>
            {locale === "ar"
              ? "أي شركة تدخل شاشة إضافة موظف ستحصل على هذا الكتالوج تلقائيًا مع البحث داخل القائمة."
              : "Any tenant opening the employee form receives this catalog automatically with search support."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-2">
            {catalog.map((item) => (
              <div
                key={item.code}
                className="border-border/70 bg-card/60 rounded-2xl border p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{item.code}</Badge>
                  <Badge variant="outline">{getLocalizedLevelLabel(item.level, locale)}</Badge>
                </div>
                <div className="mt-4 space-y-1">
                  <p className="font-semibold">{getLocalizedTitle(item, locale)}</p>
                  <p className="text-muted-foreground text-sm">
                    {getLocalizedSubtitle(item, locale)}
                  </p>
                </div>
                <div className="text-muted-foreground mt-4 flex flex-wrap gap-4 text-xs">
                  <span>
                    {locale === "ar" ? "حد أدنى" : "Min"}:{" "}
                    {item.minSalary?.toLocaleString(locale === "ar" ? "ar-SA" : "en-US") ?? "-"}
                  </span>
                  <span>
                    {locale === "ar" ? "حد أقصى" : "Max"}:{" "}
                    {item.maxSalary?.toLocaleString(locale === "ar" ? "ar-SA" : "en-US") ?? "-"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
