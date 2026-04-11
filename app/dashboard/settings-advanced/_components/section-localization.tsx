"use client";

import type { Dispatch, SetStateAction } from "react";
import { Globe } from "lucide-react";

import type { SystemSettings } from "@/lib/types/settings";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export function LocalizationSection({
  settings,
  setSettings
}: {
  settings: SystemSettings;
  setSettings: Dispatch<SetStateAction<SystemSettings>>;
}) {
  const locale = useClientLocale();
  const t = getText(locale);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {t.generalSettings.pLanguageFormatting}
        </CardTitle>
        <CardDescription>{t.generalSettings.pLanguageAndCalendarSettings}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t.common.options}</Label>
            <Select
              value={settings.localization.defaultLanguage}
              onValueChange={(value: "ar" | "en") =>
                setSettings({
                  ...settings,
                  localization: { ...settings.localization, defaultLanguage: value }
                })
              }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">{t.common.arabic}</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t.generalSettings.pCalendarType}</Label>
            <Select
              value={settings.localization.calendarType}
              onValueChange={(value: "gregorian" | "hijri" | "both") =>
                setSettings({
                  ...settings,
                  localization: { ...settings.localization, calendarType: value }
                })
              }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gregorian">{t.generalSettings.pGregorian}</SelectItem>
                <SelectItem value="hijri">{t.generalSettings.pHijri}</SelectItem>
                <SelectItem value="both">{t.generalSettings.pBoth}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
