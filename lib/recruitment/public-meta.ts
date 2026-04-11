export const PUBLIC_JOB_TYPE_OPTIONS = [
  { value: "full-time", dbValue: "FULL_TIME", ar: "دوام كامل", en: "Full-time" },
  { value: "part-time", dbValue: "PART_TIME", ar: "دوام جزئي", en: "Part-time" },
  { value: "contract", dbValue: "CONTRACT", ar: "عقد", en: "Contract" },
  { value: "internship", dbValue: "INTERNSHIP", ar: "تدريب", en: "Internship" },
  { value: "temporary", dbValue: "TEMPORARY", ar: "مؤقت", en: "Temporary" }
] as const;

export const PUBLIC_EXPERIENCE_LEVEL_OPTIONS = [
  { value: "entry", dbValue: "ENTRY", ar: "مبتدئ", en: "Entry" },
  { value: "junior", dbValue: "JUNIOR", ar: "Junior", en: "Junior" },
  { value: "mid", dbValue: "MID", ar: "متوسط", en: "Mid-level" },
  { value: "senior", dbValue: "SENIOR", ar: "خبير", en: "Senior" },
  { value: "lead", dbValue: "LEAD", ar: "قائد فريق", en: "Lead" },
  { value: "executive", dbValue: "EXECUTIVE", ar: "تنفيذي", en: "Executive" }
] as const;

export type PublicLocale = "ar" | "en";
export type PublicJobTypeValue = (typeof PUBLIC_JOB_TYPE_OPTIONS)[number]["value"];
export type PublicExperienceLevelValue = (typeof PUBLIC_EXPERIENCE_LEVEL_OPTIONS)[number]["value"];

export function normalizePublicJobType(
  value: string | null | undefined
): PublicJobTypeValue | undefined {
  const normalized = value?.trim().toLowerCase();
  return PUBLIC_JOB_TYPE_OPTIONS.find((option) => option.value === normalized)?.value;
}

export function mapPublicJobTypeToDb(value: string | null | undefined) {
  const normalized = normalizePublicJobType(value);
  return PUBLIC_JOB_TYPE_OPTIONS.find((option) => option.value === normalized)?.dbValue;
}

export function mapDbJobTypeToPublic(value: string | null | undefined): string {
  return (
    PUBLIC_JOB_TYPE_OPTIONS.find((option) => option.dbValue === value)?.value ??
    value?.toLowerCase().replace(/_/g, "-") ??
    ""
  );
}

export function getPublicJobTypeLabel(locale: PublicLocale, value: string) {
  const normalized = normalizePublicJobType(value);
  return PUBLIC_JOB_TYPE_OPTIONS.find((option) => option.value === normalized)?.[locale] ?? value;
}

export function mapDbExperienceLevelToPublic(value: string | null | undefined): string {
  return (
    PUBLIC_EXPERIENCE_LEVEL_OPTIONS.find((option) => option.dbValue === value)?.value ??
    value?.toLowerCase() ??
    ""
  );
}

export function getPublicExperienceLevelLabel(locale: PublicLocale, value: string) {
  const normalized = value?.trim().toLowerCase();
  return (
    PUBLIC_EXPERIENCE_LEVEL_OPTIONS.find((option) => option.value === normalized)?.[locale] ?? value
  );
}
