import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  MapPin,
  ShieldCheck,
  Users2
} from "lucide-react";

import { JsonLd } from "@/components/marketing/json-ld";
import { PublicApplicationForm } from "@/components/recruitment/public-application-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppLocale } from "@/lib/i18n/locale";
import { jobPostingSchema, pageSchema } from "@/lib/marketing/schema";
import { buildMarketingLanguageAlternates } from "@/lib/marketing/seo";
import { getSiteUrl } from "@/lib/marketing/site";
import { buildTenantCanonicalUrl, buildTenantPath } from "@/lib/tenant";
import {
  getPublicExperienceLevelLabel,
  getPublicJobTypeLabel
} from "@/lib/recruitment/public-meta";
import { getPublicJobPostingById } from "@/lib/recruitment/public";

import { FadeIn } from "@/components/ui/fade-in";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatSalary(
  locale: "ar" | "en",
  min: number | null,
  max: number | null,
  currency: string | null
) {
  if (min == null && max == null) {
    return locale === "ar" ? "حسب الخبرة" : "Based on experience";
  }

  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    maximumFractionDigits: 0
  });
  const curr = currency || (locale === "ar" ? "ر.س" : "SAR");

  if (min != null && max != null) return `${nf.format(min)} - ${nf.format(max)} ${curr}`;
  if (min != null)
    return locale === "ar" ? `من ${nf.format(min)} ${curr}` : `From ${nf.format(min)} ${curr}`;
  return locale === "ar"
    ? `حتى ${nf.format(max as number)} ${curr}`
    : `Up to ${nf.format(max as number)} ${curr}`;
}

function formatDate(locale: "ar" | "en", iso: string | null) {
  if (!iso) return locale === "ar" ? "مفتوحة الآن" : "Open now";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(iso));
}

function toSchemaEmploymentType(value: string): string | undefined {
  switch (value) {
    case "full-time":
      return "FULL_TIME";
    case "part-time":
      return "PART_TIME";
    case "contract":
      return "CONTRACTOR";
    case "internship":
      return "INTERN";
    case "temporary":
      return "TEMPORARY";
    default:
      return undefined;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const job = await getPublicJobPostingById(id);
  const base = getSiteUrl();

  if (!job) {
    return {
      title: isAr ? "فرصة وظيفية | طاقم" : "Career Opportunity | Taqam",
      description: isAr ? "فرصة وظيفية عامة على طاقم." : "Public job opportunity on Taqam.",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  const jobTitle = isAr ? job.titleAr || job.title : job.title;
  const companyName = isAr ? job.tenantNameAr || job.tenantName : job.tenantName;
  const jobTypeLabel = getPublicJobTypeLabel(locale, job.jobType);
  const locationLabel = job.location || (isAr ? "السعودية" : "Saudi Arabia");
  const { arUrl, enUrl, languages } = buildMarketingLanguageAlternates(`/careers/${job.id}`, base);
  const url = isAr ? arUrl : enUrl;
  const title = isAr
    ? `${jobTitle} | وظائف ${companyName} | طاقم`
    : `${jobTitle} | ${companyName} Careers | Taqam`;
  const description = isAr
    ? `تقدم على وظيفة ${jobTitle} في ${companyName} عبر بوابة طاقم للتوظيف. نوع الوظيفة: ${jobTypeLabel}. الموقع: ${locationLabel}.`
    : `Apply for ${jobTitle} at ${companyName} through Taqam's careers portal. Role type: ${jobTypeLabel}. Location: ${locationLabel}.`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages
    },
    keywords: Array.from(
      new Set([
        jobTitle,
        companyName,
        jobTypeLabel,
        isAr ? "وظائف" : "jobs",
        isAr ? "بوابة التوظيف" : "careers portal",
        "Taqam"
      ])
    ),
    openGraph: {
      title,
      description,
      url,
      siteName: "Taqam",
      type: "article",
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

export default async function CareerJobDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";
  const base = getSiteUrl();

  const job = await getPublicJobPostingById(id);
  if (!job) {
    notFound();
  }

  const companyName = job.tenantNameAr || job.tenantName;
  const { arUrl, enUrl } = buildMarketingLanguageAlternates(`/careers/${job.id}`, base);
  const pageUrl = locale === "ar" ? arUrl : enUrl;
  const pageTitle = isAr ? job.titleAr || job.title : job.title;
  const pageDescription = isAr
    ? `تقدم على وظيفة ${pageTitle} في ${companyName} عبر طاقم. نوع الوظيفة ${getPublicJobTypeLabel(locale, job.jobType)}.`
    : `Apply for ${pageTitle} at ${companyName} through Taqam. Role type: ${getPublicJobTypeLabel(locale, job.jobType)}.`;
  const tenantCareersUrl = buildTenantCanonicalUrl(
    { slug: job.tenantSlug, domain: job.tenantDomain },
    "/careers",
    {
      locale,
      baseDomain: base.replace(/^https?:\/\//, "")
    }
  );

  return (
    <FadeIn direction="up">
      <main className="bg-background pb-20">
        <JsonLd
          data={[
            pageSchema({
              url: pageUrl,
              locale,
              title: pageTitle,
              description: pageDescription,
              about: companyName
            }),
            jobPostingSchema({
              url: pageUrl,
              locale,
              title: pageTitle,
              description: job.description,
              employmentType: toSchemaEmploymentType(job.jobType),
              datePosted: job.postedAt,
              validThrough: job.expiresAt,
              hiringOrganizationName: companyName,
              hiringOrganizationUrl: tenantCareersUrl,
              hiringOrganizationLogo: job.tenantLogo,
              jobLocation: job.location,
              salaryMin: job.salaryMin,
              salaryMax: job.salaryMax,
              salaryCurrency: job.salaryCurrency
            })
          ]}
        />
        <section className="from-primary/10 via-background to-background relative overflow-hidden border-b bg-gradient-to-b py-16">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="bg-primary/10 absolute top-0 left-1/4 h-72 w-72 rounded-full blur-3xl" />
            <div className="absolute top-8 right-1/4 h-60 w-60 rounded-full bg-blue-500/10 blur-3xl" />
          </div>

          <div className="container mx-auto px-4">
            <div className="max-w-4xl">
              <div className="text-muted-foreground mb-4 flex flex-wrap items-center gap-2 text-sm">
                <Link href={`${p}/careers`} className="hover:text-foreground">
                  {isAr ? "بوابة الوظائف" : "Careers"}
                </Link>
                <span>/</span>
                <Link
                  href={buildTenantPath(job.tenantSlug, "/careers", locale)}
                  className="hover:text-foreground">
                  {companyName}
                </Link>
              </div>

              <Badge variant="secondary" className="mb-4 gap-2 rounded-full px-4 py-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {companyName}
              </Badge>

              <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
                {job.titleAr || job.title}
              </h1>
              <p className="text-muted-foreground mt-4 max-w-3xl text-lg leading-8">
                {job.description}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-border/70 bg-card/80">
                  <CardContent className="flex items-center gap-3 p-4 text-sm">
                    <MapPin className="text-primary h-5 w-5" />
                    <span>{job.location || (isAr ? "يحدد لاحقًا" : "Shared later")}</span>
                  </CardContent>
                </Card>
                <Card className="border-border/70 bg-card/80">
                  <CardContent className="flex items-center gap-3 p-4 text-sm">
                    <BriefcaseBusiness className="text-primary h-5 w-5" />
                    <span>
                      {getPublicJobTypeLabel(locale, job.jobType)} ·{" "}
                      {getPublicExperienceLevelLabel(locale, job.experienceLevel)}
                    </span>
                  </CardContent>
                </Card>
                <Card className="border-border/70 bg-card/80">
                  <CardContent className="flex items-center gap-3 p-4 text-sm">
                    <Users2 className="text-primary h-5 w-5" />
                    <span>
                      {isAr ? `${job.positions} مقعد متاح` : `${job.positions} open slot(s)`}
                    </span>
                  </CardContent>
                </Card>
                <Card className="border-border/70 bg-card/80">
                  <CardContent className="flex items-center gap-3 p-4 text-sm">
                    <CalendarClock className="text-primary h-5 w-5" />
                    <span>
                      {job.expiresAt
                        ? formatDate(locale, job.expiresAt)
                        : isAr
                          ? "التقديم مفتوح"
                          : "Open application"}
                    </span>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto grid gap-8 px-4 py-14 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{isAr ? "ملخص الدور" : "Role summary"}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4 leading-8">
                <p>{job.description}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="bg-muted/20 rounded-2xl border p-4">
                    <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
                      {isAr ? "الراتب" : "Compensation"}
                    </p>
                    <p className="text-foreground mt-2 text-base font-semibold">
                      {formatSalary(locale, job.salaryMin, job.salaryMax, job.salaryCurrency)}
                    </p>
                  </div>
                  <div className="bg-muted/20 rounded-2xl border p-4">
                    <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
                      {isAr ? "تاريخ النشر" : "Published"}
                    </p>
                    <p className="text-foreground mt-2 text-base font-semibold">
                      {formatDate(locale, job.postedAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {job.responsibilities.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>{isAr ? "المسؤوليات" : "Responsibilities"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-muted-foreground space-y-3 text-sm leading-7">
                    {job.responsibilities.map((item) => (
                      <li key={item} className="bg-muted/20 rounded-2xl border px-4 py-3">
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            {job.requirements.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>{isAr ? "المتطلبات" : "Requirements"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-muted-foreground space-y-3 text-sm leading-7">
                    {job.requirements.map((item) => (
                      <li key={item} className="bg-muted/20 rounded-2xl border px-4 py-3">
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            {job.benefits.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>{isAr ? "المزايا" : "Benefits"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-muted-foreground space-y-3 text-sm leading-7">
                    {job.benefits.map((item) => (
                      <li key={item} className="bg-muted/20 rounded-2xl border px-4 py-3">
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="space-y-6">
            <PublicApplicationForm
              companyName={companyName}
              jobPostingId={job.id}
              jobTitle={job.titleAr || job.title}
              locale={locale}
              tenantSlug={job.tenantSlug}
            />

            <Card>
              <CardHeader>
                <CardTitle>
                  {isAr ? "عن الشركة والتقديم" : "About the company and application"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4 text-sm leading-7">
                <p>
                  {isAr
                    ? `يمكنك أيضًا تصفح بقية الوظائف المفتوحة لدى ${companyName} من صفحة الوظائف الخاصة بهم.`
                    : `You can also browse the rest of ${companyName}'s open roles from its jobs page.`}
                </p>
                <div className="flex flex-col gap-3">
                  <Button asChild variant="outline">
                    <Link href={buildTenantPath(job.tenantSlug, "/careers", locale)}>
                      {isAr ? "كل وظائف هذه الشركة" : "More jobs at this company"}
                    </Link>
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href={`${p}/careers`}>
                      {isAr ? "العودة لكل الوظائف" : "Back to all careers"}
                    </Link>
                  </Button>
                </div>
                <div className="bg-muted/20 rounded-2xl border p-4">
                  <div className="text-foreground mb-2 flex items-center gap-2">
                    <ShieldCheck className="text-primary h-4 w-4" />
                    <span className="font-medium">
                      {isAr ? "كيف تتم معالجة طلبك؟" : "How your application is handled"}
                    </span>
                  </div>
                  <p>
                    {isAr
                      ? "يصل طلبك مباشرة إلى فريق التوظيف داخل الشركة المعنية، ولا يطلع عليه سوى الأشخاص المخوّلين بالتوظيف."
                      : "Your application goes directly to the hiring team at the company and is only visible to authorized recruitment staff."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </FadeIn>
  );
}
