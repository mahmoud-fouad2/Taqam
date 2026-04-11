"use client";

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { AlertCircle, CheckCircle2, Link, RefreshCw, ShieldAlert } from "lucide-react";

import type { SystemSettings } from "@/lib/types/settings";
import type { RuntimeIntegrationReport } from "@/lib/runtime-integrations";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function IntegrationsSection({
  settings,
  setSettings
}: {
  settings: SystemSettings;
  setSettings: Dispatch<SetStateAction<SystemSettings>>;
}) {
  const locale = useClientLocale();
  const t = getText(locale);
  const [runtimeReport, setRuntimeReport] = useState<RuntimeIntegrationReport | null>(null);
  const [runtimeLoading, setRuntimeLoading] = useState(true);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  const loadRuntimeStatus = useCallback(async () => {
    setRuntimeLoading(true);
    setRuntimeError(null);

    try {
      const res = await fetch("/api/settings/integrations/status", { cache: "no-store" });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || t.integrations.loadFailed);
      }

      setRuntimeReport(json?.data ?? null);
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : t.integrations.loadFailed);
      setRuntimeReport(null);
    } finally {
      setRuntimeLoading(false);
    }
  }, [t.integrations.loadFailed]);

  useEffect(() => {
    void loadRuntimeStatus();
  }, [loadRuntimeStatus]);

  const runtimeItems = runtimeReport?.items ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              {t.integrations.runtime}
            </CardTitle>
            <CardDescription>{t.integrations.runtimeDesc}</CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => void loadRuntimeStatus()}
            disabled={runtimeLoading}>
            <RefreshCw className="ms-2 h-4 w-4" />
            {t.common.update}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTitle>{t.integrations.readOnly}</AlertTitle>
            <AlertDescription>{t.integrations.readOnlyDesc}</AlertDescription>
          </Alert>

          {runtimeError ? (
            <Alert variant="destructive">
              <AlertTitle>{t.integrations.loadError}</AlertTitle>
              <AlertDescription>{runtimeError}</AlertDescription>
            </Alert>
          ) : null}

          {runtimeLoading ? (
            <div className="text-muted-foreground text-sm">{t.integrations.checking}</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {runtimeItems.map((item) => {
                const isConfigured = item.mode === "configured";
                const isPartial = item.mode === "partial";
                const Icon = isConfigured ? CheckCircle2 : isPartial ? AlertCircle : ShieldAlert;

                return (
                  <div key={item.id} className="space-y-3 rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`rounded-lg p-2 ${
                            isConfigured
                              ? "bg-emerald-100 text-emerald-700"
                              : isPartial
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-muted-foreground text-sm">
                            {item.features.join(t.integrations.featureSeparator)}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={
                          isConfigured ? "default" : isPartial ? "secondary" : "destructive"
                        }>
                        {isConfigured
                          ? t.integrations.complete
                          : isPartial
                            ? t.integrations.partial
                            : t.integrations.notConfigured}
                      </Badge>
                    </div>

                    {item.missing.length > 0 ? (
                      <div className="bg-muted/50 text-muted-foreground rounded-lg p-3 text-xs">
                        <div className="text-foreground mb-2 font-medium">
                          {t.integrations.missingVariables}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {item.missing.map((entry) => (
                            <span
                              key={entry}
                              className="bg-background rounded-md px-2 py-1 font-mono text-[11px]">
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
            {t.integrations.title}
          </CardTitle>
          <CardDescription>{t.integrations.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              key: "gosi",
              name: t.integrations.gosi,
              field: "subscriberNumber",
              fieldLabel: t.integrations.subscriberNo
            },
            {
              key: "mol",
              name: t.integrations.mol,
              field: "establishmentNumber",
              fieldLabel: t.integrations.establishmentNo
            },
            {
              key: "muqeem",
              name: t.integrations.muqeem,
              field: "username",
              fieldLabel: t.integrations.username
            },
            {
              key: "mudad",
              name: t.integrations.mudad,
              field: "organizationId",
              fieldLabel: t.integrations.orgNo
            }
          ].map((integration) => (
            <div key={integration.key} className="rounded-lg border p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      settings.integrations[
                        integration.key as keyof typeof settings.integrations
                      ] &&
                      (
                        settings.integrations[
                          integration.key as keyof typeof settings.integrations
                        ] as { enabled: boolean }
                      ).enabled
                        ? "bg-green-100"
                        : "bg-gray-100"
                    }`}>
                    <Link
                      className={`h-5 w-5 ${
                        settings.integrations[
                          integration.key as keyof typeof settings.integrations
                        ] &&
                        (
                          settings.integrations[
                            integration.key as keyof typeof settings.integrations
                          ] as { enabled: boolean }
                        ).enabled
                          ? "text-green-600"
                          : "text-gray-600"
                      }`}
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold">{integration.name}</h4>
                    <Badge
                      variant={
                        settings.integrations[
                          integration.key as keyof typeof settings.integrations
                        ] &&
                        (
                          settings.integrations[
                            integration.key as keyof typeof settings.integrations
                          ] as { enabled: boolean }
                        ).enabled
                          ? "default"
                          : "secondary"
                      }>
                      {settings.integrations[
                        integration.key as keyof typeof settings.integrations
                      ] &&
                      (
                        settings.integrations[
                          integration.key as keyof typeof settings.integrations
                        ] as { enabled: boolean }
                      ).enabled
                        ? t.integrations.enabled
                        : t.integrations.disabled}
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
                        [key]: { ...current, enabled: checked }
                      }
                    });
                  }}
                />
              </div>
              {settings.integrations[integration.key as keyof typeof settings.integrations] &&
                (
                  settings.integrations[integration.key as keyof typeof settings.integrations] as {
                    enabled: boolean;
                  }
                ).enabled && (
                  <div className="grid gap-4 border-t pt-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{integration.fieldLabel}</Label>
                      <Input placeholder={`${t.common.enterField} ${integration.fieldLabel}`} />
                    </div>
                    <div className="flex items-end gap-2">
                      <Button variant="outline">
                        <RefreshCw className="ms-2 h-4 w-4" />
                        {t.common.syncNow}
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
