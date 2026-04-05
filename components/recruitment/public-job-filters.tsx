"use client";

import { useState, useTransition } from "react";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Option = {
  value: string;
  label: string;
};

type Props = {
  locale: "ar" | "en";
  basePath: string;
  initialQuery?: string;
  initialLocation?: string;
  initialDepartmentId?: string;
  initialJobType?: string;
  locations: Option[];
  departments: Option[];
  jobTypes: Option[];
  searchPlaceholder: string;
};

const selectClassName =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-11 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50";

export function PublicJobFilters({
  locale,
  basePath,
  initialQuery = "",
  initialLocation = "",
  initialDepartmentId = "",
  initialJobType = "",
  locations,
  departments,
  jobTypes,
  searchPlaceholder,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [departmentId, setDepartmentId] = useState(initialDepartmentId);
  const [jobType, setJobType] = useState(initialJobType);

  const hasActiveFilters = Boolean(query.trim() || location || departmentId || jobType);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();

    if (query.trim()) {
      params.set("q", query.trim());
    }

    if (location) {
      params.set("location", location);
    }

    if (departmentId) {
      params.set("department", departmentId);
    }

    if (jobType) {
      params.set("jobType", jobType);
    }

    const nextUrl = params.size > 0 ? `${basePath}?${params.toString()}` : basePath;

    startTransition(() => {
      router.replace(nextUrl);
    });
  };

  const clear = () => {
    setQuery("");
    setLocation("");
    setDepartmentId("");
    setJobType("");

    startTransition(() => {
      router.replace(basePath);
    });
  };

  return (
    <form className="mx-auto mt-8 max-w-5xl rounded-3xl border bg-card/80 p-4 shadow-sm" onSubmit={submit}>
      <div className="grid gap-3 lg:grid-cols-[1.8fr_repeat(3,minmax(0,1fr))]">
        <div className="space-y-2 lg:col-span-1">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {locale === "ar" ? "بحث نصي" : "Keyword search"}
          </p>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-11 ps-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              value={query}
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {locale === "ar" ? "المدينة / الموقع" : "City / location"}
          </p>
          <select
            aria-label={locale === "ar" ? "فلتر المدينة أو الموقع" : "Filter by city or location"}
            className={cn(selectClassName)}
            onChange={(event) => setLocation(event.target.value)}
            title={locale === "ar" ? "فلتر المدينة أو الموقع" : "Filter by city or location"}
            value={location}
          >
            <option value="">{locale === "ar" ? "كل المدن والمواقع" : "All cities and locations"}</option>
            {locations.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {locale === "ar" ? "القسم" : "Department"}
          </p>
          <select
            aria-label={locale === "ar" ? "فلتر القسم" : "Filter by department"}
            className={cn(selectClassName)}
            onChange={(event) => setDepartmentId(event.target.value)}
            title={locale === "ar" ? "فلتر القسم" : "Filter by department"}
            value={departmentId}
          >
            <option value="">{locale === "ar" ? "كل الأقسام" : "All departments"}</option>
            {departments.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {locale === "ar" ? "نوع الوظيفة" : "Job type"}
          </p>
          <select
            aria-label={locale === "ar" ? "فلتر نوع الوظيفة" : "Filter by job type"}
            className={cn(selectClassName)}
            onChange={(event) => setJobType(event.target.value)}
            title={locale === "ar" ? "فلتر نوع الوظيفة" : "Filter by job type"}
            value={jobType}
          >
            <option value="">{locale === "ar" ? "كل الأنواع" : "All job types"}</option>
            {jobTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" />
          <span>
            {locale === "ar"
              ? "فلاتر مباشرة على الوظائف النشطة من قاعدة البيانات"
              : "Live filters applied directly to active jobs in the database"}
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {hasActiveFilters ? (
            <Button disabled={isPending} onClick={clear} type="button" variant="outline">
              <X className="h-4 w-4" />
              {locale === "ar" ? "مسح الفلاتر" : "Clear filters"}
            </Button>
          ) : null}
          <Button disabled={isPending} type="submit" variant="brand">
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {locale === "ar" ? "جاري التحديث..." : "Updating..."}
              </>
            ) : locale === "ar" ? (
              "تطبيق الفلاتر"
            ) : (
              "Apply filters"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}