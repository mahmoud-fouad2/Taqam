"use client";

import type { Dispatch, SetStateAction } from 'react';
import { Building2 } from 'lucide-react';

import type { SystemSettings } from '@/lib/types/settings';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function GeneralSettingsSection({
  settings,
  setSettings,
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
          <Building2 className="h-5 w-5" />
          {t.generalSettings.title}
        </CardTitle>
        <CardDescription>{t.generalSettings.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t.organization.companyName}</Label>
            <Input
              value={settings.general.companyName}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, companyName: e.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>{t.organization.companyNameEn}</Label>
            <Input
              value={settings.general.companyNameEn || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, companyNameEn: e.target.value },
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
                  general: { ...settings.general, timezone: value },
                })
              }
            >
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
                  general: { ...settings.general, currency: value },
                })
              }
            >
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
                  general: { ...settings.general, dateFormat: value },
                })
              }
            >
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
              onValueChange={(value: '12h' | '24h') =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, timeFormat: value },
                })
              }
            >
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
