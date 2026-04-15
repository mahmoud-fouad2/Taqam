import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BriefcaseBusiness, Building2, Sparkles } from "lucide-react";

import { PublicJobFilters } from "@/components/recruitment/public-job-filters";
import { PublicJobCard } from "@/components/recruitment/public-job-card";
import { JsonLd } from "@/components/marketing/json-ld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/fade-in";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty";
import { getAppLocale } from "@/lib/i18n/locale";
import { marketingMetadata } from "@/lib/marketing/seo";
import { getCommercialClaimsBySurface } from "@/lib/marketing/commercial-registry";
import { getSiteUrl } from "@/lib/marketing/site";
import { itemListSchema, pageSchema } from "@/lib/marketing/schema";
import { getPlatformSiteContent } from "@/lib/marketing/site-content";
import { getPublicJobTypeLabel, normalizePublicJobType } from "@/lib/recruitment/public-meta";
import { listPublicJobFilters, listPublicJobPostings } from "@/lib/recruitment/public";
import { buildTenantPath } from "@/lib/tenant";
import { resolveActiveTenantRecord } from "@/lib/tenant-directory";

type DifferentiatorCard = {
  slot: string;
  icon: typeof Building2;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
};

const careersDifferentiatorClaims = getCommercialClaimsBySurface("careers.differentiator");
const careersDifferentiatorBySlot = new Map(
  careersDifferentiatorClaims.map((claim) => [claim.slot, claim] as const)
);

const differentiatorCards: DifferentiatorCard[] = [
  {
    slot: "company-portal",
    icon: Building2,
    titleAr: "بوابة خاصة بكل شركة",
    titleEn: "Dedicated portal per company",
    descAr: "لكل شركة صفحة توظيف مستقلة يمكن مشاركتها مباشرة مع المرشحين على رابط خاص بها.",
    descEn:
      "Each company gets a dedicated careers portal that can be shared directly with candidates."
  },
  {
    slot: "jobs-hub",
    icon: BriefcaseBusiness,
    titleAr: "مجمّع وظائف المنصة",
    titleEn: "Platform-wide jobs hub",
    descAr:
      "المرشح يرى كل الوظائف المفتوحة على مستوى المنصة ويصل منها مباشرة إلى صفحة كل وظيفة أو كل شركة.",
    descEn:
      "Candidates can browse all active openings across the platform and jump into either a job page or a company portal."
  },
  {
    slot: "integrated-applications",
    icon: Sparkles,
    titleAr: "تقديم مباشر ومتكامل",
    titleEn: "Direct integrated applications",
    descAr:
      "أي طلب تقديم يصل مباشرة إلى فريق التوظيف داخل الشركة المعنية ويمكن متابعته من لوحة التوظيف.",
    descEn:
      "Each application reaches the hiring company directly and can be followed up from the recruitment dashboard."
  }
].map((card) => {
  const claim = careersDifferentiatorBySlot.get(card.slot);

  if (!claim) {
    return card;
  }

  return {
    ...card,
    titleAr: claim.title.ar,
    titleEn: claim.title.en,
    descAr: claim.description.ar,
    descEn: claim.description.en
  };
});

export async function generateMetadata(): Promise<Metadata> {
  const siteContent = await getPlatformSiteContent();

  return marketingMetadata({
    path: "/careers",
    titleAr: `${siteContent.careers.title.ar} | ${siteContent.siteNameAr}`,
    titleEn: `${siteContent.careers.title.en} | ${siteContent.siteNameEn}`,
    descriptionAr: siteContent.careers.description.ar,
    descriptionEn: siteContent.careers.description.en
  });
}

export default async function CareersPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const siteContent = await getPlatformSiteContent();
  const p = locale === "en" ? "/en" : "";
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const hostTenant = await resolveActiveTenantRecord({ host });

  if (hostTenant) {
    redirect(buildTenantPath(hostTenant.slug, "/careers", locale));
  }

  const sp = searchParams ? await searchParams : undefined;
  const query = typeof sp?.q === "string" ? sp.q.trim() : "";
  const location = typeof sp?.location === "string" ? sp.location.trim() : "";
  const departmentId = typeof sp?.department === "string" ? sp.department.trim() : "";
  const jobType =
    normalizePublicJobType(typeof sp?.jobType === "string" ? sp.jobType : undefined) ?? "";
  const [jobs, filters] = await Promise.all([
    listPublicJobPostings({
      query: query || undefined,
      location: location || undefined,
      departmentId: departmentId || undefined,
      jobType: jobType || undefined,
      limit: 60
    }),
    listPublicJobFilters()
  ]);
  const tenantCount = new Set(jobs.map((job) => job.tenantSlug)).size;
  const base = getSiteUrl();
  const pageUrl = `${base}${p}/careers`;
  const nf = new Intl.NumberFormat(isAr ? "ar-SA" : "en-US");
  const selectedDepartment = filters.departments.find(
    (department) => department.id === departmentId
  );
  const hasFilters = Boolean(query || location || departmentId || jobType);
  const pageDescription = isAr
    ? siteContent.careers.description.ar
    : siteContent.careers.description.en;

  return (
    <main className="bg-background pb-20">
      <JsonLd
        data={[
          pageSchema({
            url: pageUrl,
            locale,
            title: isAr ? siteContent.careers.title.ar : siteContent.careers.title.en,
            description: pageDescription,
            type: "CollectionPage",
            about: isAr ? "وظائف الشركات على طاقم" : "Jobs across companies on Taqam"
          }),
          itemListSchema({
            url: pageUrl,
            locale,
            name: isAr ? "الوظائف المفتوحة" : "Open roles",
            description: pageDescription,
            items: jobs.slice(0, 10).map((job) => ({
              name: isAr ? job.titleAr || job.title : job.title,
              url: `${base}${p}/careers/${job.id}`,
              description: isAr ? job.tenantNameAr || job.tenantName : job.tenantName
            }))
          })
        ]}
      />
      <StaggerContainer>
        <section className="relative overflow-hidden border-b pt-20 pb-20 sm:pt-28">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,rgba(99,102,241,0.14),transparent_65%)] dark:bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,rgba(99,102,241,0.22),transparent_65%)]" />
            <div className="absolute start-0 top-20 h-64 w-64 rounded-full bg-indigo-500/[0.06] blur-[100px]" />
            <div className="absolute end-0 top-32 h-56 w-56 rounded-full bg-sky-500/[0.06] blur-[80px]" />
          </div>

          <div className="container mx-auto px-4">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:pb-8">
              <StaggerItem direction="right" className="text-center lg:text-start">
                <span className="mb-5 flex justify-center lg:justify-start">
                  <span className="border-primary/20 bg-primary/[0.07] text-primary inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold">
                    <Sparkles className="h-3.5 w-3.5" />
                    {isAr ? siteContent.careers.badge.ar : siteContent.careers.badge.en}
                  </span>
                </span>

                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                  {isAr ? siteContent.careers.title.ar : siteContent.careers.title.en}
                </h1>
                <p className="text-muted-foreground mx-auto mt-5 max-w-2xl text-lg leading-8 lg:mx-0">
                  {isAr ? siteContent.careers.description.ar : siteContent.careers.description.en}
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                    <CardContent className="p-5">
                      <div className="text-primary text-3xl font-extrabold">
                        {nf.format(jobs.length)}
                      </div>
                      <p className="text-muted-foreground/80 mt-1 text-xs">
                        {isAr ? "وظيفة مفتوحة الآن" : "Active openings"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                    <CardContent className="p-5">
                      <div className="text-primary text-3xl font-extrabold">
                        {nf.format(tenantCount)}
                      </div>
                      <p className="text-muted-foreground/80 mt-1 text-xs">
                        {isAr ? "شركة توظف" : "Hiring companies"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                    <CardContent className="p-5">
                      <div className="text-primary text-3xl font-extrabold">
                        {nf.format(jobs.reduce((sum, job) => sum + job.positions, 0))}
                      </div>
                      <p className="text-muted-foreground/80 mt-1 text-xs">
                        {isAr ? "مقاعد معلنة" : "Positions"}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </StaggerItem>

              {/* Visual */}
              <StaggerItem
                direction="left"
                className="relative mx-auto hidden w-full max-w-md lg:block">
                {/* Decorative shapes */}
                <div className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-gradient-to-tr from-amber-200 to-rose-200 blur-2xl dark:from-amber-900/40 dark:to-rose-900/40" />
                <div className="pointer-events-none absolute -end-10 bottom-10 -z-10 h-32 w-32 rounded-full bg-blue-400/20 blur-3xl" />

                <div className="bg-card/60 relative overflow-hidden rounded-[2.5rem] rounded-tr-[6rem] rounded-bl-[6rem] border-[4px] border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md dark:border-white/10 dark:bg-slate-950/60 dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                  <div className="relative aspect-[4/5] w-full">
                    <Image
                      src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80"
                      alt={isAr ? "التوظيف والمستقبل" : "Careers and future"}
                      fill
                      sizes="420px"
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent" />
                  </div>
                </div>

                {/* Floating badge */}
                <div className="bg-card/60 absolute -end-6 bottom-16 rounded-2xl border border-white/60 p-3.5 shadow-xl backdrop-blur-lg dark:border-white/10 dark:bg-slate-950/60 dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 text-white shadow-inner">
                      <BriefcaseBusiness className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-foreground text-sm font-bold">
                        {isAr ? "فرص جديدة" : "New opportunities"}
                      </p>
                      <p className="text-muted-foreground text-xs font-medium">
                        {isAr ? "استعرض وظائف الشركات" : "Browse hiring companies"}
                      </p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            </div>

            <StaggerItem direction="up" className="mx-auto max-w-4xl pt-8">
              <PublicJobFilters
                basePath={`${p}/careers`}
                key={`careers-filters:${query}:${location}:${departmentId}:${jobType}`}
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
                searchPlaceholder={
                  isAr
                    ? "ابحث بالمسمى الوظيفي، المدينة أو اسم الشركة"
                    : "Search by role, city, or company"
                }
              />
            </StaggerItem>
          </div>
        </section>

        <section className="container mx-auto px-4 py-14">
          <FadeIn direction="up">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {isAr ? "الفرص المتاحة الآن" : "Open roles right now"}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {hasFilters
                    ? isAr
                      ? "نتائج الفلاتر الحالية على الوظائف النشطة المنشورة من الشركات على طاقم."
                      : "Filtered results across active roles published by companies on Taqam."
                    : query
                      ? isAr
                        ? `نتائج البحث عن: ${query}`
                        : `Search results for: ${query}`
                      : isAr
                        ? "وظائف منشورة من الشركات على طاقم."
                        : "Roles published by companies using Taqam."}
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
                  <Link href={`${p}/request-demo`}>
                    {isAr ? "أضف شركتك إلى طاقم" : "Bring your company to Taqam"}
                  </Link>
                </Button>
              </div>
            </div>
          </FadeIn>

          {jobs.length === 0 ? (
            <FadeIn direction="up">
              <Empty className="border py-16">
                <EmptyMedia variant="icon">
                  <BriefcaseBusiness />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>
                    {isAr ? "لا توجد وظائف مطابقة الآن" : "No matching roles right now"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {isAr
                      ? "جرّب تعديل كلمات البحث أو راقب البوابة لاحقًا مع إضافة وظائف جديدة من الشركات المشتركة."
                      : "Try another search or check back soon as more companies publish new openings."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </FadeIn>
          ) : (
            <StaggerContainer className="grid gap-5 lg:grid-cols-2">
              {jobs.map((job) => (
                <StaggerItem direction="up" key={job.id}>
                  <PublicJobCard job={job} locale={locale} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </section>

        <section className="relative border-t py-24">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(248,250,252,0.3),rgba(255,255,255,1)_50%)] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.2),rgba(2,6,23,0.5)_50%)]" />
          <FadeIn direction="up" className="container mx-auto grid gap-6 px-4 md:grid-cols-3">
            {differentiatorCards.map((card) => (
              <Card
                key={card.slot}
                className="border-border/50 bg-card/80 rounded-[2rem] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="space-y-3 p-7">
                  <div className="bg-primary/[0.07] flex h-12 w-12 items-center justify-center rounded-2xl">
                    <card.icon className="text-primary h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{isAr ? card.titleAr : card.titleEn}</h3>
                  <p className="text-muted-foreground text-sm leading-7">
                    {isAr ? card.descAr : card.descEn}
                  </p>
                </CardContent>
              </Card>
            ))}
          </FadeIn>
        </section>
      </StaggerContainer>
    </main>
  );
}
