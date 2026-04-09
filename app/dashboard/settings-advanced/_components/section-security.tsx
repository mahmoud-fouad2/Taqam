"use client";

import type { Dispatch, SetStateAction } from 'react';
import { Shield } from 'lucide-react';

import type { SystemSettings } from '@/lib/types/settings';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
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

export function SecuritySettingsSection({
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
          <Shield className="h-5 w-5" />
          {t.security.title}
        </CardTitle>
        <CardDescription>{t.security.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-semibold">{t.security.passwordPolicy}</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t.security.minChars}</Label>
              <Input
                type="number"
                value={settings.security.passwordPolicy.minLength}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    security: {
                      ...settings.security,
                      passwordPolicy: {
                        ...settings.security.passwordPolicy,
                        minLength: parseInt(e.target.value),
                      },
                    },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t.security.expiryDays}</Label>
              <Input
                type="number"
                value={settings.security.passwordPolicy.expiryDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    security: {
                      ...settings.security,
                      passwordPolicy: {
                        ...settings.security.passwordPolicy,
                        expiryDays: parseInt(e.target.value),
                      },
                    },
                  })
                }
              />
            </div>
          </div>
          <div className="space-y-3">
            {[
              { key: 'requireUppercase', label: t.security.requireUppercase },
              { key: 'requireLowercase', label: t.security.requireLowercase },
              { key: 'requireNumbers', label: t.security.requireNumbers },
              { key: 'requireSpecialChars', label: t.security.requireSpecialChars },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <Label>{item.label}</Label>
                <Switch
                  checked={
                    settings.security.passwordPolicy[
                      item.key as keyof typeof settings.security.passwordPolicy
                    ] as boolean
                  }
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      security: {
                        ...settings.security,
                        passwordPolicy: {
                          ...settings.security.passwordPolicy,
                          [item.key]: checked,
                        },
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-semibold">{t.security.sessionSettings}</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t.security.sessionTimeout}</Label>
              <Input
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    security: {
                      ...settings.security,
                      sessionTimeout: parseInt(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t.security.maxLoginAttempts}</Label>
              <Input
                type="number"
                value={settings.security.maxLoginAttempts}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    security: {
                      ...settings.security,
                      maxLoginAttempts: parseInt(e.target.value),
                    },
                  })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label>{t.security.twoFactorAuth}</Label>
              <p className="text-sm text-muted-foreground">{t.security.twoFactorDesc}</p>
            </div>
            <Select
              value={settings.security.twoFactorAuth}
              onValueChange={(value: 'disabled' | 'optional' | 'required') =>
                setSettings({
                  ...settings,
                  security: { ...settings.security, twoFactorAuth: value },
                })
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disabled">{t.leaveTypes.disabledType}</SelectItem>
                <SelectItem value="optional">{t.common.optional}</SelectItem>
                <SelectItem value="required">{t.trainingCourses.mandatory}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label>{t.auditLogs.title}</Label>
              <p className="text-sm text-muted-foreground">{t.security.logAllOps}</p>
            </div>
            <Switch
              checked={settings.security.auditLogging}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  security: { ...settings.security, auditLogging: checked },
                })
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
