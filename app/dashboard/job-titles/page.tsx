import type { Metadata } from "next";
import { generateMeta } from "@/lib/utils";
import { JobTitlesManager } from "./job-titles-manager";
import { getText } from "@/lib/i18n/text";
import { getAppLocale } from "@/lib/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAppLocale();
  const t = getText(locale);
  return generateMeta({
    title: t.jobTitles.pageTitle,
    description: t.jobTitles.pageDesc
  });
}

export default async function JobTitlesPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t.jobTitles.title}</h1>
      </div>
      <JobTitlesManager />
    </>
  );
}
