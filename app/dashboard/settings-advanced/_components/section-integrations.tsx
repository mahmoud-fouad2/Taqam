import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { AlertCircle, CheckCircle2, Link, RefreshCw, ShieldAlert } from 'lucide-react';

import type { SystemSettings } from '@/lib/types/settings';
import type { RuntimeIntegrationReport } from '@/lib/runtime-integrations';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function IntegrationsSection({
  settings,
  setSettings,
}: {
  settings: SystemSettings;
  setSettings: Dispatch<SetStateAction<SystemSettings>>;
}) {
  const [runtimeReport, setRuntimeReport] = useState<RuntimeIntegrationReport | null>(null);
  const [runtimeLoading, setRuntimeLoading] = useState(true);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  const loadRuntimeStatus = async () => {
    setRuntimeLoading(true);
    setRuntimeError(null);

    try {
      const res = await fetch('/api/settings/integrations/status', { cache: 'no-store' });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || 'فشل تحميل حالة التكاملات');
      }

      setRuntimeReport(json?.data ?? null);
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : 'فشل تحميل حالة التكاملات');
      setRuntimeReport(null);
    } finally {
      setRuntimeLoading(false);
    }
  };

  useEffect(() => {
    void loadRuntimeStatus();
  }, []);

  const runtimeItems = runtimeReport?.items ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              جاهزية التشغيل
            </CardTitle>
            <CardDescription>
              تُقرأ هذه الحالة مباشرة من بيئة السيرفر الحالية لتوضيح ما إذا كانت التكاملات التشغيلية مربوطة فعليًا أم لا.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => void loadRuntimeStatus()} disabled={runtimeLoading}>
            <RefreshCw className="h-4 w-4 ms-2" />
            تحديث الحالة
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTitle>قراءة فقط من بيئة التشغيل</AlertTitle>
            <AlertDescription>
              هذه القيم لا تُحفَظ من داخل الصفحة. أي نقص هنا يعني أن متغيرات البيئة غير مضبوطة بالكامل على السيرفر.
            </AlertDescription>
          </Alert>

          {runtimeError ? (
            <Alert variant="destructive">
              <AlertTitle>تعذر قراءة حالة التكاملات</AlertTitle>
              <AlertDescription>{runtimeError}</AlertDescription>
            </Alert>
          ) : null}

          {runtimeLoading ? (
            <div className="text-sm text-muted-foreground">جاري التحقق من تكاملات التشغيل...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {runtimeItems.map((item) => {
                const isConfigured = item.mode === 'configured';
                const isPartial = item.mode === 'partial';
                const Icon = isConfigured ? CheckCircle2 : isPartial ? AlertCircle : ShieldAlert;

                return (
                  <div key={item.id} className="rounded-xl border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`rounded-lg p-2 ${
                            isConfigured ? 'bg-emerald-100 text-emerald-700' : isPartial ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.features.join('، ')}
                          </div>
                        </div>
                      </div>
                      <Badge variant={isConfigured ? 'default' : isPartial ? 'secondary' : 'destructive'}>
                        {isConfigured ? 'مكتمل' : isPartial ? 'ناقص جزئيًا' : 'غير مضبوط'}
                      </Badge>
                    </div>

                    {item.missing.length > 0 ? (
                      <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                        <div className="mb-2 font-medium text-foreground">المتغيرات الناقصة</div>
                        <div className="flex flex-wrap gap-2">
                          {item.missing.map((entry) => (
                            <span key={entry} className="rounded-md bg-background px-2 py-1 font-mono text-[11px]">
                              {entry}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            التكاملات
          </CardTitle>
          <CardDescription>ربط النظام مع الخدمات الحكومية والأنظمة الأخرى</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              key: 'gosi',
              name: 'التأمينات الاجتماعية (GOSI)',
              field: 'subscriberNumber',
              fieldLabel: 'رقم المشترك',
            },
            {
              key: 'mol',
              name: 'وزارة العمل',
              field: 'establishmentNumber',
              fieldLabel: 'رقم المنشأة',
            },
            { key: 'muqeem', name: 'مقيم', field: 'username', fieldLabel: 'اسم المستخدم' },
            {
              key: 'mudad',
              name: 'مدد',
              field: 'organizationId',
              fieldLabel: 'رقم المنظمة',
            },
          ].map((integration) => (
            <div key={integration.key} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      settings.integrations[integration.key as keyof typeof settings.integrations] &&
                      (
                        settings.integrations[
                          integration.key as keyof typeof settings.integrations
                        ] as { enabled: boolean }
                      ).enabled
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Link
                      className={`h-5 w-5 ${
                        settings.integrations[integration.key as keyof typeof settings.integrations] &&
                        (
                          settings.integrations[
                            integration.key as keyof typeof settings.integrations
                          ] as { enabled: boolean }
                        ).enabled
                          ? 'text-green-600'
                          : 'text-gray-600'
                      }`}
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold">{integration.name}</h4>
                    <Badge
                      variant={
                        settings.integrations[integration.key as keyof typeof settings.integrations] &&
                        (
                          settings.integrations[
                            integration.key as keyof typeof settings.integrations
                          ] as { enabled: boolean }
                        ).enabled
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {settings.integrations[integration.key as keyof typeof settings.integrations] &&
                      (
                        settings.integrations[
                          integration.key as keyof typeof settings.integrations
                        ] as { enabled: boolean }
                      ).enabled
                        ? 'مفعل'
                        : 'غير مفعل'}
                    </Badge>
                  </div>
                </div>
                <Switch
                  checked={
                    settings.integrations[integration.key as keyof typeof settings.integrations]
                      ? (
                          settings.integrations[
                            integration.key as keyof typeof settings.integrations
                          ] as { enabled: boolean }
                        ).enabled
                      : false
                  }
                  onCheckedChange={(checked) => {
                    const key = integration.key as keyof typeof settings.integrations;
                    const current = settings.integrations[key] as any;
                    if (!current) return;
                    setSettings({
                      ...settings,
                      integrations: {
                        ...settings.integrations,
                        [key]: { ...current, enabled: checked },
                      },
                    });
                  }}
                />
              </div>
              {settings.integrations[integration.key as keyof typeof settings.integrations] &&
                (
                  settings.integrations[
                    integration.key as keyof typeof settings.integrations
                  ] as { enabled: boolean }
                ).enabled && (
                  <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                    <div className="space-y-2">
                      <Label>{integration.fieldLabel}</Label>
                      <Input placeholder={`أدخل ${integration.fieldLabel}`} />
                    </div>
                    <div className="flex items-end gap-2">
                      <Button variant="outline">
                        <RefreshCw className="h-4 w-4 ms-2" />
                        مزامنة الآن
                      </Button>
                    </div>
                  </div>
                )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
