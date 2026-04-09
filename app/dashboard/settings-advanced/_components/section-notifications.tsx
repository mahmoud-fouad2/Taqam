"use client";

import type { Dispatch, SetStateAction } from 'react';
import { Bell } from 'lucide-react';

import type { SystemSettings } from '@/lib/types/settings';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function NotificationsSection({
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
          <Bell className="h-5 w-5" />{t.notifications.settings}</CardTitle>
        <CardDescription>{t.generalSettings.pConfigureNotificationChannels}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {[
          { key: 'emailEnabled', label: t.generalSettings.pEmail, icon: '📧' },
          { key: 'smsEnabled', label: t.generalSettings.pSms, icon: '📱' },
          { key: 'pushEnabled', label: t.generalSettings.pPushNotifications, icon: '🔔' },
        ].map((channel) => (
          <div key={channel.key} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{channel.icon}</span>
              <Label>{channel.label}</Label>
            </div>
            <Switch
              checked={
                settings.notifications[
                  channel.key as keyof typeof settings.notifications
                ] as boolean
              }
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, [channel.key]: checked },
                })
              }
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
