import Link from "next/link";
import Image from "next/image";

import { LogoMark } from "@/components/logo-mark";
import { getAppLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/messages";

function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className={className ?? "h-10 w-10 shrink-0"}
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11 10.5C11 8.887 12.837 7.967 14.128 8.93L37.877 26.651L26.853 37.676L11 10.5Z"
        fill="#00C2FF"
      />
      <path
        d="M11 10.5L26.853 37.676L11.042 53.487C9.781 52.68 9 51.291 9 49.793V14.12C9 12.782 9.623 11.523 10.686 10.714L11 10.5Z"
        fill="#00D084"
      />
      <path
        d="M26.853 37.676L37.877 26.651L49.397 35.246C51.121 36.533 50.965 39.153 49.103 40.228L34.113 48.886C31.908 50.16 29.088 49.531 27.623 47.447L26.853 37.676Z"
        fill="#FFD43B"
      />
      <path
        d="M37.877 26.651L14.128 8.93C15.23 8.109 16.69 7.994 17.909 8.633L49.092 24.987C50.932 25.952 51.103 28.507 49.407 29.72L37.877 26.651Z"
        fill="#FF5A5F"
      />
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
    { href: `${p}/terms`, label: t(locale, "footer.terms") }
  ];
  const summary = isAr
    ? "يشغّل شؤون الموظفين والرواتب والحضور للشركات السعودية من مساحة واحدة واضحة وسريعة."
    : "A clear workspace for HR operations, payroll, and attendance built for Saudi businesses.";
  const highlights = isAr ? ["الموظفون", "الرواتب", "الحضور"] : ["People", "Payroll", "Attendance"];
  const rights = isAr ? "طاقم. جميع الحقوق محفوظة." : "Taqam. All rights reserved.";
  const downloadHref = "/downloads/taqam-android.apk";

  return (
    <footer className="bg-background/95 border-t">
      <div className="mx-auto w-full max-w-[96rem] px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="border-border/40 bg-card/60 hover:border-border/80 flex flex-col gap-3 rounded-[2.25rem] border px-6 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-500 hover:shadow-xl sm:px-8 sm:py-[1.125rem] lg:px-10 xl:px-12">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3.5 sm:gap-4">
              <Link href={p || "/"} className="inline-flex shrink-0 transition hover:opacity-80">
                <LogoMark
                  frameClassName="size-11 rounded-[1.125rem] p-0 dark:ring-white/10"
                  imageClassName="h-[26px]"
                />
              </Link>

              <div className="space-y-1.5 text-start">
                <p className="text-foreground text-sm font-semibold sm:text-base">
                  {isAr ? "طاقم" : "Taqam"}
                </p>
                <p className="text-muted-foreground max-w-2xl text-sm leading-6">{summary}</p>
                <div className="flex flex-wrap gap-1.5">
                  {highlights.map((item) => (
                    <span
                      key={item}
                      className="border-border/60 bg-background/80 text-muted-foreground inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 lg:min-w-[16rem] lg:items-end">
              <nav className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm lg:justify-end">
                {legalLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="hover:text-foreground transition">
                    {link.label}
                  </Link>
                ))}
              </nav>

              <a
                href={downloadHref}
                download="taqam-android.apk"
                className="group border-border/60 bg-background/90 hover:border-primary/30 hover:bg-primary/5 inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 shadow-sm transition lg:self-end"
                aria-label={isAr ? "تحميل تطبيق طاقم للأندرويد" : "Download the Taqam Android app"}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 dark:bg-white/10">
                  <GooglePlayIcon className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0 text-start">
                  <p className="text-muted-foreground text-[10px] font-medium tracking-[0.18em] uppercase">
                    Android v2
                  </p>
                  <p className="text-foreground truncate text-xs font-semibold">
                    {isAr ? "تحميل التطبيق" : "Download app"}
                  </p>
                </div>
              </a>
            </div>
          </div>

          <div className="border-border/60 text-muted-foreground flex flex-col gap-2 border-t pt-2 text-xs sm:flex-row sm:items-center sm:justify-between">
            <span>
              © {year} {rights}
            </span>
            <Link
              href="https://ma-fo.info"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-80">
              <Image
                src="https://ma-fo.info/logo2.png"
                alt="Ma-Fo"
                width={22}
                height={22}
                className="h-[22px] w-auto object-contain"
                unoptimized
              />
              <span>Development By Ma-Fo</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
