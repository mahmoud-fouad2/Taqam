import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpLeft,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  MapPin,
  Users2
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { buildTenantPath } from "@/lib/tenant";
import {
  getPublicExperienceLevelLabel,
  getPublicJobTypeLabel
} from "@/lib/recruitment/public-meta";
import type { PublicJobPosting } from "@/lib/recruitment/public";

function formatSalary(locale: "ar" | "en", job: PublicJobPosting) {
  if (job.salaryMin == null && job.salaryMax == null) {
    return locale === "ar" ? "يحدد لاحقًا" : "Shared later";
  }

  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    maximumFractionDigits: 0
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
    day: "numeric"
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
  const companyInitial = companyName.trim().charAt(0).toUpperCase() || "?";

  return (
    <Card className="group border-border/70 bg-card/80 overflow-hidden shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
      <CardHeader className="space-y-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            {showTenant ? (
              <div className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
                {job.tenantLogo ? (
                  <Image
                    src={job.tenantLogo}
                    alt=""
                    width={20}
                    height={20}
                    className="h-5 w-5 rounded-full border border-white/70 object-cover shadow-sm"
                    aria-hidden="true"
                  />
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/70 bg-white/70 text-[10px] font-bold shadow-sm">
                    {companyInitial}
                  </span>
                )}
                <span>{companyName}</span>
              </div>
            ) : null}
            <CardTitle className="text-xl leading-snug">
              <Link
                href={`${p}/careers/${job.id}`}
                className="hover:text-primary transition-colors">
                {job.titleAr || job.title}
              </Link>
            </CardTitle>
          </div>

          <div className="bg-background/80 text-muted-foreground rounded-2xl border px-3 py-2 text-xs font-semibold">
            {formatDate(locale, job.postedAt)}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{getPublicJobTypeLabel(locale, job.jobType)}</Badge>
          <Badge variant="outline">
            {getPublicExperienceLevelLabel(locale, job.experienceLevel)}
          </Badge>
          {job.departmentName || job.departmentNameAr ? (
            <Badge variant="outline">{job.departmentNameAr || job.departmentName}</Badge>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="text-muted-foreground space-y-4 text-sm">
        <p className="line-clamp-3 leading-7">{job.description}</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="bg-background/70 flex items-center gap-2 rounded-2xl border px-3 py-2">
            <MapPin className="text-primary h-4 w-4" />
            <span>
              {job.location || (locale === "ar" ? "مرن / يحدد لاحقًا" : "Flexible / later")}
            </span>
          </div>
          <div className="bg-background/70 flex items-center gap-2 rounded-2xl border px-3 py-2">
            <BriefcaseBusiness className="text-primary h-4 w-4" />
            <span>{formatSalary(locale, job)}</span>
          </div>
          <div className="bg-background/70 flex items-center gap-2 rounded-2xl border px-3 py-2">
            <Users2 className="text-primary h-4 w-4" />
            <span>
              {locale === "ar" ? `${job.positions} فرصة متاحة` : `${job.positions} open slot(s)`}
            </span>
          </div>
          <div className="bg-background/70 flex items-center gap-2 rounded-2xl border px-3 py-2">
            <CalendarClock className="text-primary h-4 w-4" />
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

      <CardFooter className="bg-muted/20 flex flex-col gap-3 border-t sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground text-xs">
          {locale === "ar"
            ? `${job.applicantsCount} طلبات مسجلة حتى الآن`
            : `${job.applicantsCount} application(s) received so far`}
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button asChild variant="outline" size="sm">
            <Link href={buildTenantPath(job.tenantSlug, "/careers", locale)}>
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
