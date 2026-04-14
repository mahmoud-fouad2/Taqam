import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BriefcaseBusiness, Building2, Sparkles } from "lucide-react";

import { JsonLd } from "@/components/marketing/json-ld";
import { PublicJobFilters } from "@/components/recruitment/public-job-filters";
import { PublicJobCard } from "@/components/recruitment/public-job-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty";
import { getAppLocale } from "@/lib/i18n/locale";
import { getSiteUrl } from "@/lib/marketing/site";
import { getPublicJobTypeLabel, normalizePublicJobType } from "@/lib/recruitment/public-meta";
import {
  getPublicCareersTenantBySlug,
  listPublicJobFilters,
  listPublicJobPostings
} from "@/lib/recruitment/public";
import { itemListSchema, pageSchema } from "@/lib/marketing/schema";
import { buildTenantCanonicalUrl, buildTenantPath } from "@/lib/tenant";

import { FadeIn } from "@/components/ui/fade-in";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const tenant = await getPublicCareersTenantBySlug(slug);
  const base = getSiteUrl();

  if (!tenant) {
    return {
      title: isAr ? "وظائف الشركة | طاقم" : "Company Careers | Taqam",
      description: isAr
        ? "بوابة وظائف خاصة بالشركة على طاقم."
        : "Company-specific careers portal on Taqam.",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  const companyName = isAr ? (tenant.nameAr || tenant.name) : tenant.name;
  const arUrl = buildTenantCanonicalUrl(tenant, "/careers", {
    locale: "ar",
    baseDomain: base.replace(/^https?:\/\//, "")
  });
  const enUrl = buildTenantCanonicalUrl(tenant, "/careers", {
    locale: "en",
    baseDomain: base.replace(/^https?:\/\//, "")
  });
  const url = isAr ? arUrl : enUrl;
  const title = isAr
    ? `${companyName} | وظائف الشركة | طاقم`
    : `${companyName} | Company Careers | Taqam`;
  const description = isAr
    ? `استعرض الوظائف المفتوحة لدى ${companyName} وقدّم مباشرة عبر بوابة التوظيف الخاصة بهم على طاقم.`
    : `Browse open roles at ${companyName} and apply directly through their dedicated Taqam careers portal.`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "ar-SA": arUrl,
        "en-US": enUrl,
        "x-default": arUrl
      }
    },
    keywords: Array.from(
      new Set([
        companyName,
        isAr ? "وظائف الشركة" : "company careers",
        isAr ? "التوظيف" : "recruitment",
        "Taqam"
      ])
    ),
    openGraph: {
      title,
      description,
      url,
      siteName: "Taqam",
      locale: isAr ? "ar_SA" : "en_US",
      alternateLocale: isAr ? ["en_US"] : ["ar_SA"],
      images: [
        {
          url: `${base}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${base}/twitter-image`]
    }
  };
}

export default async function TenantCareersPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const sp = searchParams ? await searchParams : undefined;
  const query = typeof sp?.q === "string" ? sp.q.trim() : "";
  const location = typeof sp?.location === "string" ? sp.location.trim() : "";
  const departmentId = typeof sp?.department === "string" ? sp.department.trim() : "";
  const jobType =
    normalizePublicJobType(typeof sp?.jobType === "string" ? sp.jobType : undefined) ?? "";

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
      limit: 60
    }),
    listPublicJobFilters({ tenantSlug: slug })
  ]);
  const companyName = tenant.nameAr || tenant.name;
  const nf = new Intl.NumberFormat(isAr ? "ar-SA" : "en-US");
  const initial = companyName.trim().charAt(0).toUpperCase();
  const selectedDepartment = filters.departments.find(
    (department) => department.id === departmentId
  );
  const hasFilters = Boolean(query || location || departmentId || jobType);
  const pageUrl = buildTenantCanonicalUrl(tenant, "/careers", {
    locale,
    baseDomain: getSiteUrl().replace(/^https?:\/\//, "")
  });
  const pageDescription = isAr
    ? `استعرض الوظائف المفتوحة لدى ${companyName} وقدّم مباشرة عبر بوابة التوظيف الخاصة بهم على طاقم.`
    : `Browse open roles at ${companyName} and apply directly through their dedicated Taqam careers portal.`;

  return (
    <FadeIn direction="up">
      <main className="bg-background pb-20">
        <JsonLd
          data={[
            pageSchema({
              url: pageUrl,
              locale,
              title: isAr ? `${companyName} | وظائف الشركة` : `${companyName} | Company Careers`,
              description: pageDescription,
              type: "CollectionPage",
              about: companyName
            }),
            itemListSchema({
              url: pageUrl,
              locale,
              name: isAr ? `وظائف ${companyName}` : `${companyName} open roles`,
              description: pageDescription,
              items: jobs.slice(0, 10).map((job) => ({
                name: isAr ? (job.titleAr || job.title) : job.title,
                url: `${getSiteUrl()}${buildTenantPath(slug, `/careers/${job.id}`, locale)}`,
                description: job.location || (isAr ? "السعودية" : "Saudi Arabia")
              }))
            })
          ]}
        />
        <section className="from-primary/10 via-background to-background relative overflow-hidden border-b bg-gradient-to-b py-16 sm:py-20">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="bg-primary/10 absolute top-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_58%)]" />
          </div>

          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mx-auto mb-5 flex items-center justify-center">
                <div className="bg-card text-primary flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border text-3xl font-black shadow-sm">
                  {tenant.logo ? (
                    <Image
                      src={tenant.logo}
                      alt={companyName}
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initial
                  )}
                </div>
              </div>
              <Badge className="mb-5 gap-2 rounded-full px-4 py-1.5 text-xs" variant="secondary">
                <Building2 className="h-3.5 w-3.5" />
                {isAr ? "وظائف هذه الشركة" : "Jobs at this company"}
              </Badge>
              <h1 className="flex items-center justify-center gap-3 text-4xl font-black tracking-tight sm:text-5xl">
                <span>{companyName}</span>
                {tenant.logo ? (
                  <Image
                    src={tenant.logo}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-2xl border object-cover shadow-sm"
                    aria-hidden="true"
                  />
                ) : null}
              </h1>
              <p className="text-muted-foreground mx-auto mt-5 max-w-2xl text-lg leading-8">
                {isAr
                  ? "كل الوظائف المفتوحة لدى هذه الشركة مع تقديم مباشر يصل إلى فريق التوظيف لديها."
                  : "Browse this company's open roles and apply directly to its recruitment team."}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <Card className="border-border/70 bg-card/70">
                  <CardContent className="p-5">
                    <div className="text-primary text-3xl font-black">{nf.format(jobs.length)}</div>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {isAr ? "إعلانًا مفتوحًا" : "Open roles"}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/70 bg-card/70">
                  <CardContent className="p-5">
                    <div className="text-primary text-3xl font-black">
                      {nf.format(jobs.reduce((sum, job) => sum + job.positions, 0))}
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {isAr ? "مقاعد وظيفية" : "Advertised positions"}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/70 bg-card/70">
                  <CardContent className="p-5">
                    <div className="text-primary text-3xl font-black">
                      {nf.format(jobs.reduce((sum, job) => sum + job.applicantsCount, 0))}
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {isAr ? "طلبات مستلمة" : "Applications received"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <PublicJobFilters
                basePath={buildTenantPath(slug, "/careers", locale)}
                key={`tenant-careers-filters:${slug}:${query}:${location}:${departmentId}:${jobType}`}
                departments={filters.departments.map((department) => ({
                  value: department.id,
                  label: department.nameAr || department.name
                }))}
                initialDepartmentId={departmentId}
                initialJobType={jobType}
                initialLocation={location}
                initialQuery={query}
                jobTypes={filters.jobTypes.map((value) => ({
                  value,
                  label: getPublicJobTypeLabel(locale, value)
                }))}
                locale={locale}
                locations={filters.locations.map((value) => ({ value, label: value }))}
                searchPlaceholder={isAr ? "ابحث في وظائف الشركة" : "Search company jobs"}
              />
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-14">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">{isAr ? "الوظائف المفتوحة" : "Open roles"}</h2>
              <p className="text-muted-foreground mt-1">
                {hasFilters
                  ? isAr
                    ? `نتائج الفلاتر الحالية داخل ${companyName}.`
                    : `Filtered results inside ${companyName}.`
                  : query
                    ? isAr
                      ? `نتائج البحث داخل ${companyName}: ${query}`
                      : `Search results inside ${companyName}: ${query}`
                    : isAr
                      ? "هذه صفحة وظائف الشركة. يمكنك مشاركتها مع المرشحين عبر نفس الرابط."
                      : "This is the company's careers page. You can share it with candidates using this link."}
              </p>
              {hasFilters ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {query ? (
                    <Badge variant="outline">{isAr ? `بحث: ${query}` : `Query: ${query}`}</Badge>
                  ) : null}
                  {location ? (
                    <Badge variant="outline">
                      {isAr ? `الموقع: ${location}` : `Location: ${location}`}
                    </Badge>
                  ) : null}
                  {selectedDepartment ? (
                    <Badge variant="outline">
                      {isAr
                        ? `القسم: ${selectedDepartment.nameAr || selectedDepartment.name}`
                        : `Department: ${selectedDepartment.name}`}
                    </Badge>
                  ) : null}
                  {jobType ? (
                    <Badge variant="outline">
                      {isAr
                        ? `النوع: ${getPublicJobTypeLabel(locale, jobType)}`
                        : `Job type: ${getPublicJobTypeLabel(locale, jobType)}`}
                    </Badge>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={locale === "en" ? "/en/careers" : "/careers"}>
                  {isAr ? "كل وظائف طاقم" : "All Taqam jobs"}
                </Link>
              </Button>
            </div>
          </div>

          {jobs.length === 0 ? (
            <Empty className="border py-16">
              <EmptyMedia variant="icon">
                <BriefcaseBusiness />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>
                  {isAr ? "لا توجد وظائف مفتوحة حاليًا" : "No open roles right now"}
                </EmptyTitle>
                <EmptyDescription>
                  {isAr
                    ? "لا توجد وظائف منشورة حالياً. عند نشر وظائف جديدة ستظهر هنا تلقائياً."
                    : "No roles are published right now. New postings will appear here automatically once published."}
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

        <section className="bg-muted/20 border-t py-16">
          <div className="container mx-auto grid gap-6 px-4 md:grid-cols-2">
            <Card className="border-border/70 bg-card/80">
              <CardContent className="space-y-3 p-6">
                <Sparkles className="text-primary h-8 w-8" />
                <h3 className="text-lg font-semibold">
                  {isAr ? "تقديم مباشر" : "Direct applications"}
                </h3>
                <p className="text-muted-foreground text-sm leading-7">
                  {isAr
                    ? "أي طلب تقديم يُسجل لدى الشركة صاحبة الإعلان ويمكن متابعته من لوحة التوظيف."
                    : "Each application is recorded for the hiring company and can be followed up from the recruitment dashboard."}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-card/80">
              <CardContent className="space-y-3 p-6">
                <Building2 className="text-primary h-8 w-8" />
                <h3 className="text-lg font-semibold">
                  {isAr ? "رابط واحد للوظائف" : "One link for careers"}
                </h3>
                <p className="text-muted-foreground text-sm leading-7">
                  {isAr
                    ? "يمكن مشاركة هذا الرابط ليطلع المرشحون على الوظائف الحالية لدى الشركة."
                    : "Share this link so candidates can view the company's current openings."}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </FadeIn>
  );
}
