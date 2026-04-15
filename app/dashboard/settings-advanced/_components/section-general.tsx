"use client";

import Image from "next/image";
import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Building2, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { SystemSettings } from "@/lib/types/settings";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function GeneralSettingsSection({
  settings,
  setSettings
}: {
  settings: SystemSettings;
  setSettings: Dispatch<SetStateAction<SystemSettings>>;
}) {
  const locale = useClientLocale();
  const t = getText(locale);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleLogoUpload: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsLogoUploading(true);
    try {
      const res = await fetch("/api/settings/company-logo", {
        method: "POST",
        body: formData
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.data?.url) {
        throw new Error(
          json?.error ||
            (locale === "ar" ? "تعذر رفع شعار الشركة." : "Failed to upload company logo.")
        );
      }

      setSettings({
        ...settings,
        general: {
          ...settings.general,
          companyLogo: json.data.url
        }
      });

      toast.success(locale === "ar" ? "تم تحديث شعار الشركة." : "Company logo updated.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : locale === "ar"
            ? "حدث خطأ أثناء رفع الشعار."
            : "An error occurred while uploading the logo."
      );
    } finally {
      setIsLogoUploading(false);
      if (event.target) event.target.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {t.generalSettings.title}
        </CardTitle>
        <CardDescription>{t.generalSettings.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="border-border/60 bg-muted/20 rounded-2xl border p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-background flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border shadow-sm">
                {settings.general.companyLogo ? (
                  <Image
                    src={settings.general.companyLogo}
                    alt={settings.general.companyName}
                    width={80}
                    height={80}
                    unoptimized
                    loader={({ src }) => src}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Building2 className="text-muted-foreground h-8 w-8" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {locale === "ar" ? "شعار الشركة" : "Company logo"}
                </p>
                <p className="text-muted-foreground mt-1 text-sm leading-6">
                  {locale === "ar"
                    ? "يظهر هذا الشعار في واجهات الشركة العامة مثل صفحة الوظائف، ويمكن تحديثه هنا مباشرة."
                    : "This logo appears on public company surfaces such as the careers page and can be updated here directly."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLogoUploading}>
                {isLogoUploading ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="me-2 h-4 w-4" />
                )}
                {locale === "ar" ? "رفع شعار" : "Upload logo"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                aria-label={locale === "ar" ? "اختر شعار الشركة" : "Choose company logo"}
                onChange={handleLogoUpload}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t.organization.companyName}</Label>
            <Input
              value={settings.general.companyName}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, companyName: e.target.value }
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>{t.organization.companyNameEn}</Label>
            <Input
              value={settings.general.companyNameEn || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, companyNameEn: e.target.value }
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>{t.tenant.timezone}</Label>
            <Select
              value={settings.general.timezone}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, timezone: value }
                })
              }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Riyadh">{t.generalSettings.riyadh}</SelectItem>
                <SelectItem value="Asia/Dubai">{t.generalSettings.dubai}</SelectItem>
                <SelectItem value="Asia/Kuwait">{t.generalSettings.kuwait}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t.salaryStructures.currency}</Label>
            <Select
              value={settings.general.currency}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, currency: value }
                })
              }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SAR">{t.pricingPlans.sar}</SelectItem>
                <SelectItem value="AED">{t.generalSettings.aed}</SelectItem>
                <SelectItem value="KWD">{t.generalSettings.kwd}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t.generalSettings.dateFormat}</Label>
            <Select
              value={settings.general.dateFormat}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, dateFormat: value }
                })
              }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t.generalSettings.timeFormat}</Label>
            <Select
              value={settings.general.timeFormat}
              onValueChange={(value: "12h" | "24h") =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, timeFormat: value }
                })
              }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">{t.generalSettings.twelveHour}</SelectItem>
                <SelectItem value="24h">{t.generalSettings.twentyFourHour}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
