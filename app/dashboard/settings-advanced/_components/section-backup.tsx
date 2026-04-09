"use client";

import type { Dispatch, SetStateAction } from 'react';
import { Database } from 'lucide-react';

import type { SystemSettings } from '@/lib/types/settings';

import { Button } from '@/components/ui/button';
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
import { Switch } from '@/components/ui/switch';
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function BackupSection({
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
          <Database className="h-5 w-5" />
          {t.backup.title}
        </CardTitle>
        <CardDescription>{t.backup.pSettings} {t.backup.title} {t.backup.pAutomatic}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between py-2">
          <div>
            <Label>{t.backup.autoBackup}</Label>
            <p className="text-sm text-muted-foreground">{t.backup.pEnable} {t.backup.title} {t.backup.pPeriodic}</p>
          </div>
          <Switch
            checked={settings.backup.autoBackup}
            onCheckedChange={(checked) =>
              setSettings({
                ...settings,
                backup: { ...settings.backup, autoBackup: checked },
              })
            }
          />
        </div>

        {settings.backup.autoBackup && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t.backup.pFrequency}</Label>
                <Select
                  value={settings.backup.frequency}
                  onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                    setSettings({
                      ...settings,
                      backup: { ...settings.backup, frequency: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{t.backup.daily}</SelectItem>
                    <SelectItem value="weekly">{t.backup.weekly}</SelectItem>
                    <SelectItem value="monthly">{t.backup.monthly}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.backup.retentionDays}</Label>
                <Input
                  type="number"
                  value={settings.backup.retentionDays}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      backup: {
                        ...settings.backup,
                        retentionDays: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label>{t.backup.includeAttachments}</Label>
                <p className="text-sm text-muted-foreground">{t.backup.includeAttachmentsDesc}</p>
              </div>
              <Switch
                checked={settings.backup.includeAttachments}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    backup: { ...settings.backup, includeAttachments: checked },
                  })
                }
              />
            </div>

            <div className="bg-muted rounded-lg p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">{t.backup.lastBackup}</p>
                  <p className="font-medium">
                    {settings.backup.lastBackup
                      ? new Date(settings.backup.lastBackup).toLocaleString('ar-SA')
                      : t.backup.notYet}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.backup.nextBackup}</p>
                  <p className="font-medium">
                    {settings.backup.nextBackup
                      ? new Date(settings.backup.nextBackup).toLocaleString('ar-SA')
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        <Button variant="outline">
          <Database className="h-4 w-4 ms-2" />
          {t.backup.backupNow}
        </Button>
      </CardContent>
    </Card>
  );
}
