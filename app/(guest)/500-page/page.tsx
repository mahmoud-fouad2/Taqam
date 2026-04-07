import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/fade-in";
import { generateMeta } from "@/lib/utils";
import { getAppLocale } from "@/lib/i18n/locale";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "500",
    description: "Unexpected server error.",
  });
}

export default async function Error404() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";

  return (
    <FadeIn direction="up">
      <div className="grid h-screen items-center bg-background pb-8 lg:grid-cols-2 lg:pb-0">
      <div className="text-center">
        <p className="text-base font-semibold text-muted-foreground">500</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl lg:text-7xl">
          {isAr ? "خطأ في الخادم" : "Server error"}
        </h1>
        <p className="mt-6 text-base leading-7 text-muted-foreground">
          {isAr
            ? "حدثت مشكلة غير متوقعة أثناء تحميل الصفحة. جرّب مرة أخرى أو راجع مركز المساعدة."
            : "There seems to be a temporary problem between the server and the website."}
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-2">
          <Button asChild size="lg">
            <Link href={p || "/"}>{isAr ? "العودة للرئيسية" : "Go back home"}</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href={`${p}/help-center`}>{isAr ? "مركز المساعدة" : "Help center"}</Link>
          </Button>
        </div>
      </div>

      <div className="col-span-1 hidden lg:block">
        <Image src="/images/500.svg" alt="Login visual" width={720} height={520} className="object-contain" />
      </div>
      </div>
    </FadeIn>
  );
}
