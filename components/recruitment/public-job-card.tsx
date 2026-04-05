import Link from "next/link";
import { ArrowUpLeft, BriefcaseBusiness, Building2, CalendarClock, MapPin, Users2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicExperienceLevelLabel, getPublicJobTypeLabel } from "@/lib/recruitment/public-meta";
import type { PublicJobPosting } from "@/lib/recruitment/public";

function formatSalary(locale: "ar" | "en", job: PublicJobPosting) {
  if (job.salaryMin == null && job.salaryMax == null) {
    return locale === "ar" ? "يحدد لاحقًا" : "Shared later";
  }

  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    maximumFractionDigits: 0,
  });

  const currency = job.salaryCurrency || (locale === "ar" ? "ر.س" : "SAR");

  if (job.salaryMin != null && job.salaryMax != null) {
    return `${nf.format(job.salaryMin)} - ${nf.format(job.salaryMax)} ${currency}`;
  }

  if (job.salaryMin != null) {
    return locale === "ar"
      ? `يبدأ من ${nf.format(job.salaryMin)} ${currency}`
      : `From ${nf.format(job.salaryMin)} ${currency}`;
  }

  return locale === "ar"
    ? `حتى ${nf.format(job.salaryMax as number)} ${currency}`
    : `Up to ${nf.format(job.salaryMax as number)} ${currency}`;
}

function formatDate(locale: "ar" | "en", iso: string | null) {
  if (!iso) {
    return locale === "ar" ? "مفتوحة الآن" : "Open now";
  }

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

type Props = {
  job: PublicJobPosting;
  locale: "ar" | "en";
  showTenant?: boolean;
};

export function PublicJobCard({ job, locale, showTenant = true }: Props) {
  const p = locale === "en" ? "/en" : "";
  const companyName = job.tenantNameAr || job.tenantName;

  return (
    <Card className="group overflow-hidden border-border/70 bg-card/80 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
      <CardHeader className="space-y-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            {showTenant ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Building2 className="h-3.5 w-3.5" />
                <span>{companyName}</span>
              </div>
            ) : null}
            <CardTitle className="text-xl leading-snug">
              <Link href={`${p}/careers/${job.id}`} className="transition-colors hover:text-primary">
                {job.titleAr || job.title}
              </Link>
            </CardTitle>
          </div>

          <div className="rounded-2xl border bg-background/80 px-3 py-2 text-xs font-semibold text-muted-foreground">
            {formatDate(locale, job.postedAt)}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{getPublicJobTypeLabel(locale, job.jobType)}</Badge>
          <Badge variant="outline">{getPublicExperienceLevelLabel(locale, job.experienceLevel)}</Badge>
          {job.departmentName || job.departmentNameAr ? (
            <Badge variant="outline">{job.departmentNameAr || job.departmentName}</Badge>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p className="line-clamp-3 leading-7">{job.description}</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-2xl border bg-background/70 px-3 py-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{job.location || (locale === "ar" ? "مرن / يحدد لاحقًا" : "Flexible / later")}</span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border bg-background/70 px-3 py-2">
            <BriefcaseBusiness className="h-4 w-4 text-primary" />
            <span>{formatSalary(locale, job)}</span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border bg-background/70 px-3 py-2">
            <Users2 className="h-4 w-4 text-primary" />
            <span>{locale === "ar" ? `${job.positions} فرصة متاحة` : `${job.positions} open slot(s)`}</span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border bg-background/70 px-3 py-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            <span>
              {job.expiresAt
                ? locale === "ar"
                  ? `آخر موعد ${formatDate(locale, job.expiresAt)}`
                  : `Closes ${formatDate(locale, job.expiresAt)}`
                : locale === "ar"
                  ? "التقديم مفتوح"
                  : "Applications open"}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t bg-muted/20 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground">
          {locale === "ar"
            ? `${job.applicantsCount} طلبات مسجلة حتى الآن`
            : `${job.applicantsCount} application(s) received so far`}
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button asChild variant="outline" size="sm">
            <Link href={`${p}/t/${job.tenantSlug}/careers`}>
              {locale === "ar" ? "بوابة الشركة" : "Company portal"}
            </Link>
          </Button>
          <Button asChild size="sm" variant="brand">
            <Link href={`${p}/careers/${job.id}`}>
              {locale === "ar" ? "عرض التفاصيل والتقديم" : "View details & apply"}
              <ArrowUpLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}