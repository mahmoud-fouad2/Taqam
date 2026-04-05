import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BriefcaseBusiness, Building2, CalendarClock, MapPin, ShieldCheck, Users2 } from "lucide-react";

import { PublicApplicationForm } from "@/components/recruitment/public-application-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppLocale } from "@/lib/i18n/locale";
import { getSiteUrl } from "@/lib/marketing/site";
import { getPublicExperienceLevelLabel, getPublicJobTypeLabel } from "@/lib/recruitment/public-meta";
import { getPublicJobPostingById } from "@/lib/recruitment/public";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatSalary(locale: "ar" | "en", min: number | null, max: number | null, currency: string | null) {
  if (min == null && max == null) {
    return locale === "ar" ? "حسب الخبرة" : "Based on experience";
  }

  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", { maximumFractionDigits: 0 });
  const curr = currency || (locale === "ar" ? "ر.س" : "SAR");

  if (min != null && max != null) return `${nf.format(min)} - ${nf.format(max)} ${curr}`;
  if (min != null) return locale === "ar" ? `من ${nf.format(min)} ${curr}` : `From ${nf.format(min)} ${curr}`;
  return locale === "ar" ? `حتى ${nf.format(max as number)} ${curr}` : `Up to ${nf.format(max as number)} ${curr}`;
}

function formatDate(locale: "ar" | "en", iso: string | null) {
  if (!iso) return locale === "ar" ? "مفتوحة الآن" : "Open now";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const job = await getPublicJobPostingById(id);
  const base = getSiteUrl();

  if (!job) {
    return {
      title: "Career Opportunity | Taqam",
      description: "Public job opportunity on Taqam.",
    };
  }

  const title = `${job.titleAr || job.title} | ${(job.tenantNameAr || job.tenantName)} | Taqam`;
  const description = job.description.slice(0, 160);
  const url = `${base}/careers/${job.id}`;

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
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CareerJobDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";

  const job = await getPublicJobPostingById(id);
  if (!job) {
    notFound();
  }

  const companyName = job.tenantNameAr || job.tenantName;

  return (
    <main className="bg-background pb-20">
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/10 via-background to-background py-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-1/4 top-8 h-60 w-60 rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Link href={`${p}/careers`} className="hover:text-foreground">{isAr ? "بوابة الوظائف" : "Careers"}</Link>
              <span>/</span>
              <Link href={`${p}/t/${job.tenantSlug}/careers`} className="hover:text-foreground">{companyName}</Link>
            </div>

            <Badge variant="secondary" className="mb-4 gap-2 rounded-full px-4 py-1.5">
              <Building2 className="h-3.5 w-3.5" />
              {companyName}
            </Badge>

            <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">{job.titleAr || job.title}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">{job.description}</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-border/70 bg-card/80">
                <CardContent className="flex items-center gap-3 p-4 text-sm">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>{job.location || (isAr ? "يحدد لاحقًا" : "Shared later")}</span>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-card/80">
                <CardContent className="flex items-center gap-3 p-4 text-sm">
                  <BriefcaseBusiness className="h-5 w-5 text-primary" />
                  <span>{getPublicJobTypeLabel(locale, job.jobType)} · {getPublicExperienceLevelLabel(locale, job.experienceLevel)}</span>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-card/80">
                <CardContent className="flex items-center gap-3 p-4 text-sm">
                  <Users2 className="h-5 w-5 text-primary" />
                  <span>{isAr ? `${job.positions} مقعد متاح` : `${job.positions} open slot(s)`}</span>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-card/80">
                <CardContent className="flex items-center gap-3 p-4 text-sm">
                  <CalendarClock className="h-5 w-5 text-primary" />
                  <span>{job.expiresAt ? formatDate(locale, job.expiresAt) : (isAr ? "التقديم مفتوح" : "Open application")}</span>
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
            <CardContent className="space-y-4 leading-8 text-muted-foreground">
              <p>{job.description}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{isAr ? "الراتب" : "Compensation"}</p>
                  <p className="mt-2 text-base font-semibold text-foreground">{formatSalary(locale, job.salaryMin, job.salaryMax, job.salaryCurrency)}</p>
                </div>
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{isAr ? "تاريخ النشر" : "Published"}</p>
                  <p className="mt-2 text-base font-semibold text-foreground">{formatDate(locale, job.postedAt)}</p>
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
                <ul className="space-y-3 text-sm leading-7 text-muted-foreground">
                  {job.responsibilities.map((item) => (
                    <li key={item} className="rounded-2xl border bg-muted/20 px-4 py-3">{item}</li>
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
                <ul className="space-y-3 text-sm leading-7 text-muted-foreground">
                  {job.requirements.map((item) => (
                    <li key={item} className="rounded-2xl border bg-muted/20 px-4 py-3">{item}</li>
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
                <ul className="space-y-3 text-sm leading-7 text-muted-foreground">
                  {job.benefits.map((item) => (
                    <li key={item} className="rounded-2xl border bg-muted/20 px-4 py-3">{item}</li>
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
              <CardTitle>{isAr ? "حول بوابة الشركة" : "About the company portal"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                {isAr
                  ? `يمكنك أيضًا تصفح كل الوظائف الأخرى الخاصة بـ ${companyName} من بوابتهم المخصصة.`
                  : `You can also browse all other roles published by ${companyName} from their dedicated portal.`}
              </p>
              <div className="flex flex-col gap-3">
                <Button asChild variant="outline">
                  <Link href={`${p}/t/${job.tenantSlug}/careers`}>{isAr ? "وظائف هذه الشركة" : "This company's careers"}</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href={`${p}/careers`}>{isAr ? "العودة لكل الوظائف" : "Back to all careers"}</Link>
                </Button>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-4">
                <div className="mb-2 flex items-center gap-2 text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="font-medium">{isAr ? "كيف تتم معالجة طلبك؟" : "How your application is handled"}</span>
                </div>
                <p>
                  {isAr
                    ? "يصل الطلب مباشرة إلى قاعدة بيانات الشركة ولوحة المتقدمين الخاصة بها، ولا يطلع عليه سوى فريق التوظيف داخل الجهة المعنية."
                    : "Your application goes directly into the company's database and applicants dashboard, visible only to the relevant recruitment team."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}