import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BriefcaseBusiness, Building2, Sparkles } from "lucide-react";

import { PublicJobFilters } from "@/components/recruitment/public-job-filters";
import { PublicJobCard } from "@/components/recruitment/public-job-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getAppLocale } from "@/lib/i18n/locale";
import { getSiteUrl } from "@/lib/marketing/site";
import { getPublicJobTypeLabel, normalizePublicJobType } from "@/lib/recruitment/public-meta";
import { getPublicCareersTenantBySlug, listPublicJobFilters, listPublicJobPostings } from "@/lib/recruitment/public";

import { FadeIn } from "@/components/ui/fade-in";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getPublicCareersTenantBySlug(slug);
  const base = getSiteUrl();

  if (!tenant) {
    return {
      title: "Company Careers | Taqam",
      description: "Company-specific careers portal on Taqam.",
    };
  }

  const companyName = tenant.nameAr || tenant.name;
  const url = `${base}/t/${tenant.slug}/careers`;
  const title = `${companyName} | Careers | Taqam`;
  const description = `Open roles and direct applications for ${companyName} on Taqam.`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Taqam",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function TenantCareersPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";
  const sp = searchParams ? await searchParams : undefined;
  const query = typeof sp?.q === "string" ? sp.q.trim() : "";
  const location = typeof sp?.location === "string" ? sp.location.trim() : "";
  const departmentId = typeof sp?.department === "string" ? sp.department.trim() : "";
  const jobType = normalizePublicJobType(typeof sp?.jobType === "string" ? sp.jobType : undefined) ?? "";

  const tenant = await getPublicCareersTenantBySlug(slug);
  if (!tenant) {
    notFound();
  }

  const [jobs, filters] = await Promise.all([
    listPublicJobPostings({
      tenantSlug: slug,
      query: query || undefined,
      location: location || undefined,
      departmentId: departmentId || undefined,
      jobType: jobType || undefined,
      limit: 60,
    }),
    listPublicJobFilters({ tenantSlug: slug }),
  ]);
  const companyName = tenant.nameAr || tenant.name;
  const nf = new Intl.NumberFormat(isAr ? "ar-SA" : "en-US");
  const initial = companyName.trim().charAt(0).toUpperCase();
  const selectedDepartment = filters.departments.find((department) => department.id === departmentId);
  const hasFilters = Boolean(query || location || departmentId || jobType);

  return (
    <FadeIn direction="up">
      <main className="bg-background pb-20">
        <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/10 via-background to-background py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_58%)]" />
        </div>

        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border bg-card text-3xl font-black text-primary shadow-sm">
              {initial}
            </div>
            <Badge className="mb-5 gap-2 rounded-full px-4 py-1.5 text-xs" variant="secondary">
              <Building2 className="h-3.5 w-3.5" />
              {isAr ? "بوابة التوظيف الخاصة بالشركة" : "Company-specific careers portal"}
            </Badge>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{companyName}</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              {isAr
                ? "كل الوظائف المفتوحة الخاصة بهذه الشركة، مع تقديم مباشر يصل إلى لوحة المتقدمين داخل حسابها على طاقم."
                : "All open roles for this company, with direct applications that land in the tenant's applicants dashboard on Taqam."}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Card className="border-border/70 bg-card/70">
                <CardContent className="p-5">
                  <div className="text-3xl font-black text-primary">{nf.format(jobs.length)}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{isAr ? "إعلانًا مفتوحًا" : "Open roles"}</p>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-card/70">
                <CardContent className="p-5">
                  <div className="text-3xl font-black text-primary">{nf.format(jobs.reduce((sum, job) => sum + job.positions, 0))}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{isAr ? "مقاعد وظيفية" : "Advertised positions"}</p>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-card/70">
                <CardContent className="p-5">
                  <div className="text-3xl font-black text-primary">{nf.format(jobs.reduce((sum, job) => sum + job.applicantsCount, 0))}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{isAr ? "طلبات مستلمة" : "Applications received"}</p>
                </CardContent>
              </Card>
            </div>

            <PublicJobFilters
              basePath={`${p}/t/${slug}/careers`}
              key={`tenant-careers-filters:${slug}:${query}:${location}:${departmentId}:${jobType}`}
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
              searchPlaceholder={isAr ? "ابحث داخل وظائف الشركة" : "Search this company's roles"}
            />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">{isAr ? "الوظائف المفتوحة" : "Open roles"}</h2>
            <p className="mt-1 text-muted-foreground">
              {hasFilters
                ? isAr
                  ? `نتائج الفلاتر الحالية داخل ${companyName}.`
                  : `Filtered results inside ${companyName}.`
                : query
                ? isAr
                  ? `نتائج البحث داخل ${companyName}: ${query}`
                  : `Search results inside ${companyName}: ${query}`
                : isAr
                  ? "هذه الصفحة يمكن مشاركتها مباشرة مع المرشحين كـ career portal مستقل لهذه الشركة."
                  : "This page can be shared directly with candidates as this company's dedicated careers portal."}
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
              <Link href={`${p}/careers`}>{isAr ? "كل وظائف طاقم" : "All Taqam jobs"}</Link>
            </Button>
          </div>
        </div>

        {jobs.length === 0 ? (
          <Empty className="border py-16">
            <EmptyMedia variant="icon">
              <BriefcaseBusiness />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>{isAr ? "لا توجد وظائف مفتوحة حاليًا" : "No open roles right now"}</EmptyTitle>
              <EmptyDescription>
                {isAr
                  ? "يمكن لهذه الصفحة أن تبقى كرابط التوظيف الرسمي للشركة، وستظهر الوظائف هنا تلقائيًا عند نشرها من لوحة التحكم."
                  : "This page can remain the official careers link for the company, and roles will appear automatically once published from the dashboard."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {jobs.map((job) => (
              <PublicJobCard key={job.id} job={job} locale={locale} showTenant={false} />
            ))}
          </div>
        )}
      </section>

      <section className="border-t bg-muted/20 py-16">
        <div className="container mx-auto grid gap-6 px-4 md:grid-cols-2">
          <Card className="border-border/70 bg-card/80">
            <CardContent className="space-y-3 p-6">
              <Sparkles className="h-8 w-8 text-primary" />
              <h3 className="text-lg font-semibold">{isAr ? "مرتبطة مباشرة بقاعدة البيانات" : "Directly tied to the database"}</h3>
              <p className="text-sm leading-7 text-muted-foreground">
                {isAr
                  ? "أي وظيفة منشورة من لوحة الشركة تظهر هنا تلقائيًا، وأي طلب تقديم يصل مباشرة إلى شاشة المتقدمين الخاصة بالشركة."
                  : "Any role published from the tenant dashboard appears here automatically, and each application lands directly in the company's applicants screen."}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="space-y-3 p-6">
              <Building2 className="h-8 w-8 text-primary" />
              <h3 className="text-lg font-semibold">{isAr ? "رابط رسمي قابل للمشاركة" : "An official shareable hiring link"}</h3>
              <p className="text-sm leading-7 text-muted-foreground">
                {isAr
                  ? "يمكن استخدام هذا المسار كرابط التوظيف الرسمي في الموقع، لينكدإن، أو الحملات الإعلانية الخاصة بهذه الشركة."
                  : "This route can be used as the official hiring link on the company website, LinkedIn, or paid campaigns for this tenant."}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
    </FadeIn>
  );
}