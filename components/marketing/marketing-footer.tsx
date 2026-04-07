import Link from "next/link";
import Image from "next/image";

import { LogoMark } from "@/components/logo-mark";
import { getAppLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/messages";

function GooglePlayIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className="h-10 w-10 shrink-0"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M11 10.5C11 8.887 12.837 7.967 14.128 8.93L37.877 26.651L26.853 37.676L11 10.5Z" fill="#00C2FF" />
      <path d="M11 10.5L26.853 37.676L11.042 53.487C9.781 52.68 9 51.291 9 49.793V14.12C9 12.782 9.623 11.523 10.686 10.714L11 10.5Z" fill="#00D084" />
      <path d="M26.853 37.676L37.877 26.651L49.397 35.246C51.121 36.533 50.965 39.153 49.103 40.228L34.113 48.886C31.908 50.16 29.088 49.531 27.623 47.447L26.853 37.676Z" fill="#FFD43B" />
      <path d="M37.877 26.651L14.128 8.93C15.23 8.109 16.69 7.994 17.909 8.633L49.092 24.987C50.932 25.952 51.103 28.507 49.407 29.72L37.877 26.651Z" fill="#FF5A5F" />
    </svg>
  );
}

export async function MarketingFooter() {
  const year = new Date().getFullYear();
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";
  const legalLinks = [
    { href: `${p}/privacy`, label: t(locale, "footer.privacy") },
    { href: `${p}/terms`, label: t(locale, "footer.terms") },
  ];
  const summary = isAr
    ? "يشغّل شؤون الموظفين والرواتب والحضور للشركات السعودية من مساحة واحدة واضحة وسريعة."
    : "A clear workspace for HR operations, payroll, and attendance built for Saudi businesses.";
  const highlights = isAr
    ? ["الموظفون", "الرواتب", "الحضور"]
    : ["People", "Payroll", "Attendance"];
  const rights = isAr ? "طاقم. جميع الحقوق محفوظة." : "Taqam. All rights reserved.";
  const supportLine = t(locale, "footer.developedBy");
  const downloadHref = "/downloads/taqam-android.apk";

  return (
    <footer className="border-t bg-background/95">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-muted/20 px-4 py-4 shadow-sm sm:px-5 sm:py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3 sm:gap-4">
              <Link href={p || "/"} className="inline-flex shrink-0 transition hover:opacity-90">
                <LogoMark frameClassName="size-12 rounded-2xl p-0 dark:ring-white/10" imageClassName="h-7" />
              </Link>

              <div className="space-y-2 text-start">
                <p className="text-sm font-semibold text-foreground sm:text-base">
                  {isAr ? "طاقم" : "Taqam"}
                </p>
                <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                  {summary}
                </p>
                <div className="flex flex-wrap gap-2">
                  {highlights.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <a
                  href={downloadHref}
                  download="taqam-android.apk"
                  className="group mt-3 inline-flex w-full max-w-sm items-center gap-3 rounded-2xl border border-emerald-500/20 bg-background px-3 py-3 shadow-sm transition hover:border-emerald-500/40 hover:bg-emerald-500/5"
                  aria-label={isAr ? "تحميل تطبيق طاقم للأندرويد" : "Download the Taqam Android app"}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/15">
                    <GooglePlayIcon />
                  </div>
                  <div className="min-w-0 text-start">
                    <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                      Google Play
                    </p>
                    <p className="truncate text-sm font-semibold text-foreground sm:text-base">
                      {isAr ? "تحميل تطبيق طاقم مباشرة" : "Download Taqam directly"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isAr ? "APK داخلي من نفس الموقع" : "Internal APK download from this site"}
                    </p>
                  </div>
                </a>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground md:max-w-xs md:justify-end">
              {legalLinks.map((link) => (
                <Link key={link.href} href={link.href} className="transition hover:text-foreground">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>© {year} {rights}</span>
            <Link
              href="https://ma-fo.info"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-80"
            >
              <Image
                src="https://ma-fo.info/favicon.ico"
                alt="ma-fo.info"
                width={14}
                height={14}
                className="rounded-sm"
                unoptimized
              />
              <span>{supportLine}</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
