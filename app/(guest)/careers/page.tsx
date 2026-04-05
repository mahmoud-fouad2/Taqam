import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, Building2, Sparkles } from "lucide-react";

import { PublicJobFilters } from "@/components/recruitment/public-job-filters";
import { PublicJobCard } from "@/components/recruitment/public-job-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getAppLocale } from "@/lib/i18n/locale";
import { marketingMetadata } from "@/lib/marketing/seo";
import { getPublicJobTypeLabel, normalizePublicJobType } from "@/lib/recruitment/public-meta";
import { listPublicJobFilters, listPublicJobPostings } from "@/lib/recruitment/public";

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    path: "/careers",
    titleAr: "بوابة الوظائف | طاقم",
    titleEn: "Careers Portal | Taqam",
    descriptionAr: "بوابة توظيف مجمعة تعرض الوظائف المفتوحة لدى الشركات العاملة على طاقم مع تقديم مباشر من نفس المكان.",
    descriptionEn: "An aggregate careers portal listing active roles across companies running on Taqam, with direct applications in one place.",
  });
}

export default async function CareersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";
  const sp = searchParams ? await searchParams : undefined;
  const query = typeof sp?.q === "string" ? sp.q.trim() : "";
  const location = typeof sp?.location === "string" ? sp.location.trim() : "";
  const departmentId = typeof sp?.department === "string" ? sp.department.trim() : "";
  const jobType = normalizePublicJobType(typeof sp?.jobType === "string" ? sp.jobType : undefined) ?? "";
  const [jobs, filters] = await Promise.all([
    listPublicJobPostings({
      query: query || undefined,
      location: location || undefined,
      departmentId: departmentId || undefined,
      jobType: jobType || undefined,
      limit: 60,
    }),
    listPublicJobFilters(),
  ]);
  const tenantCount = new Set(jobs.map((job) => job.tenantSlug)).size;
  const nf = new Intl.NumberFormat(isAr ? "ar-SA" : "en-US");
  const selectedDepartment = filters.departments.find((department) => department.id === departmentId);
  const hasFilters = Boolean(query || location || departmentId || jobType);

  return (
    <main className="bg-background pb-20">
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/10 via-background to-background py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_60%)]" />
          <div className="absolute -left-10 top-24 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="absolute -right-10 top-12 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        </div>

        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-5 gap-2 rounded-full px-4 py-1.5 text-xs" variant="secondary">
              <Sparkles className="h-3.5 w-3.5" />
              {isAr ? "بوابة وظائف مجمعة لكل الشركات على طاقم" : "Unified careers portal across Taqam companies"}
            </Badge>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              {isAr ? "اكتشف فرصك التالية من بوابة توظيف واحدة" : "Discover your next move from one careers portal"}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              {isAr
                ? "كل الوظائف المفتوحة لدى الشركات العاملة على طاقم في مكان واحد، مع صفحات مستقلة لكل شركة وتقديم مباشر من نفس البوابة."
                : "Browse active roles across companies running on Taqam, with dedicated portals for each company and direct applications from the same hub."}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Card className="border-border/70 bg-card/70">
                <CardContent className="p-5">
                  <div className="text-3xl font-black text-primary">{nf.format(jobs.length)}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{isAr ? "وظيفة مفتوحة الآن" : "Active job openings"}</p>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-card/70">
                <CardContent className="p-5">
                  <div className="text-3xl font-black text-primary">{nf.format(tenantCount)}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{isAr ? "شركة لديها توظيف نشط" : "Hiring companies"}</p>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-card/70">
                <CardContent className="p-5">
                  <div className="text-3xl font-black text-primary">{nf.format(jobs.reduce((sum, job) => sum + job.positions, 0))}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{isAr ? "مقاعد وظيفية معلنة" : "Advertised positions"}</p>
                </CardContent>
              </Card>
            </div>

            <PublicJobFilters
              basePath={`${p}/careers`}
              key={`careers-filters:${query}:${location}:${departmentId}:${jobType}`}
              departments={filters.departments.map((department) => ({
                value: department.id,
                label: department.nameAr || department.name,
              }))}
              initialDepartmentId={departmentId}
              initialJobType={jobType}
              initialLocation={location}
              initialQuery={query}
              jobTypes={filters.jobTypes.map((value) => ({
                value,
                label: getPublicJobTypeLabel(locale, value),
              }))}
              locale={locale}
              locations={filters.locations.map((value) => ({ value, label: value }))}
              searchPlaceholder={isAr ? "ابحث بالمسمى الوظيفي، المدينة أو اسم الشركة" : "Search by role, city, or company"}
            />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">{isAr ? "الفرص المتاحة الآن" : "Open roles right now"}</h2>
            <p className="mt-1 text-muted-foreground">
              {hasFilters
                ? isAr
                  ? "نتائج الفلاتر الحالية على الوظائف النشطة المنشورة من الشركات على طاقم."
                  : "Filtered results across active roles published by companies on Taqam."
                : query
                ? isAr
                  ? `نتائج البحث عن: ${query}`
                  : `Search results for: ${query}`
                : isAr
                  ? "وظائف حقيقية مأخوذة مباشرة من لوحات الشركات داخل طاقم."
                  : "Real roles pulled directly from company dashboards inside Taqam."}
            </p>
            {hasFilters ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {query ? <Badge variant="outline">{isAr ? `بحث: ${query}` : `Query: ${query}`}</Badge> : null}
                {location ? <Badge variant="outline">{isAr ? `الموقع: ${location}` : `Location: ${location}`}</Badge> : null}
                {selectedDepartment ? (
                  <Badge variant="outline">{isAr ? `القسم: ${selectedDepartment.nameAr || selectedDepartment.name}` : `Department: ${selectedDepartment.name}`}</Badge>
                ) : null}
                {jobType ? <Badge variant="outline">{isAr ? `النوع: ${getPublicJobTypeLabel(locale, jobType)}` : `Job type: ${getPublicJobTypeLabel(locale, jobType)}`}</Badge> : null}
              </div>
            ) : null}
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`${p}/request-demo`}>{isAr ? "أضف شركتك إلى طاقم" : "Bring your company to Taqam"}</Link>
            </Button>
          </div>
        </div>

        {jobs.length === 0 ? (
          <Empty className="border py-16">
            <EmptyMedia variant="icon">
              <BriefcaseBusiness />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>{isAr ? "لا توجد وظائف مطابقة الآن" : "No matching roles right now"}</EmptyTitle>
              <EmptyDescription>
                {isAr
                  ? "جرّب تعديل كلمات البحث أو راقب البوابة لاحقًا مع إضافة وظائف جديدة من الشركات المشتركة."
                  : "Try another search or check back soon as more companies publish new openings."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {jobs.map((job) => (
              <PublicJobCard key={job.id} job={job} locale={locale} />
            ))}
          </div>
        )}
      </section>

      <section className="border-t bg-muted/20 py-16">
        <div className="container mx-auto grid gap-6 px-4 md:grid-cols-3">
          <Card className="border-border/70 bg-card/80">
            <CardContent className="space-y-3 p-6">
              <Building2 className="h-8 w-8 text-primary" />
              <h3 className="text-lg font-semibold">{isAr ? "بوابة خاصة بكل شركة" : "Dedicated portal per company"}</h3>
              <p className="text-sm leading-7 text-muted-foreground">
                {isAr
                  ? "لكل شركة صفحة توظيف مستقلة يمكن مشاركتها مباشرة مع المرشحين على رابط خاص بها."
                  : "Each company gets a dedicated careers portal that can be shared directly with candidates."}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="space-y-3 p-6">
              <BriefcaseBusiness className="h-8 w-8 text-primary" />
              <h3 className="text-lg font-semibold">{isAr ? "مجمّع وظائف المنصة" : "Platform-wide jobs hub"}</h3>
              <p className="text-sm leading-7 text-muted-foreground">
                {isAr
                  ? "المرشح يرى كل الوظائف المفتوحة على مستوى المنصة ويصل منها مباشرة إلى صفحة كل وظيفة أو كل شركة."
                  : "Candidates can browse all active openings across the platform and jump into either a job page or a company portal."}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="space-y-3 p-6">
              <Sparkles className="h-8 w-8 text-primary" />
              <h3 className="text-lg font-semibold">{isAr ? "تقديم مباشر ومتكامل" : "Direct integrated applications"}</h3>
              <p className="text-sm leading-7 text-muted-foreground">
                {isAr
                  ? "أي طلب يصل مباشرة إلى قاعدة البيانات وإلى لوحة المتقدمين داخل الشركة المعنية مع إشعارات بريدية عند تفعيل SMTP."
                  : "Every application lands directly in the database and the tenant's applicants dashboard, with optional email alerts when SMTP is enabled."}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}