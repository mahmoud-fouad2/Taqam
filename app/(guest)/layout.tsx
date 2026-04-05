import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";

import { JsonLd } from "@/components/marketing/json-ld";
import { getSiteUrl } from "@/lib/marketing/site";
import { organizationSchema, softwareAppSchema, websiteSchema } from "@/lib/marketing/schema";
import { getAppLocale } from "@/lib/i18n/locale";

export default async function GuestLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getAppLocale();
  const base = getSiteUrl();

  const ratingValue = Number(process.env.NEXT_PUBLIC_RATING_VALUE);
  const ratingCount = Number(process.env.NEXT_PUBLIC_RATING_COUNT);
  const hasRating = Number.isFinite(ratingValue) && Number.isFinite(ratingCount) && ratingCount > 0;
  const softwareAppJsonLd = softwareAppSchema({
    url: base,
    pricingUrl: `${base}/pricing`,
    ...(hasRating ? { ratingValue, ratingCount } : {}),
  });

  return (
    <div className="relative min-h-screen">
      <JsonLd data={organizationSchema({ url: base })} />
      <JsonLd data={websiteSchema({ url: base, locale })} />
      <JsonLd data={softwareAppJsonLd} />
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 start-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl premium-float" />
        <div className="absolute top-40 -start-24 h-[420px] w-[420px] rounded-full bg-blue-500/10 blur-3xl premium-float" />
        <div className="absolute -bottom-40 end-[-120px] h-[520px] w-[520px] rounded-full bg-purple-500/10 blur-3xl premium-float" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.08),transparent_35%)]" />
      </div>

      <MarketingHeader />
      {children}
      <MarketingFooter />
    </div>
  );
}
