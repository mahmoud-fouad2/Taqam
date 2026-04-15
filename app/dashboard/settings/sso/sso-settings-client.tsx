"use client";

import * as React from "react";
import {
  IconBrandAzure,
  IconBrandGoogle,
  IconKey,
  IconCheck,
  IconLoader2,
  IconExternalLink,
  IconInfoCircle
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
interface SsoConfig {
  entraId?: {
    tenantId?: string;
    clientId?: string;
    clientSecret?: string;
    hasClientSecret?: boolean;
    enabled?: boolean;
  };
  google?: {
    clientId?: string;
    clientSecret?: string;
    hostedDomain?: string;
    hasClientSecret?: boolean;
    enabled?: boolean;
  };
  saml?: {
    metadataUrl?: string;
    entityId?: string;
    acsUrl?: string;
    enabled?: boolean;
  };
}

/* ─────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────── */
export function SsoSettingsClient({ initialConfig }: { initialConfig: SsoConfig }) {
  const locale = useClientLocale();
  const t = getText(locale);

  const [config, setConfig] = React.useState<SsoConfig>(initialConfig);
  const [saving, setSaving] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const update = <K extends keyof SsoConfig>(key: K, field: string, value: string | boolean) => {
    setConfig((prev) => ({
      ...prev,
      [key]: { ...(prev[key] as object), [field]: value }
    }));
  };

  const save = async (provider: string) => {
    setSaving(provider);
    setError(null);
    try {
      const res = await fetch("/api/tenant/sso", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sso: config })
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j.error ?? t.ssoSettings.saveFailed);
      }
      if (j.data) {
        setConfig(j.data as SsoConfig);
      }
      setSaved(provider);
      setTimeout(() => setSaved(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.ssoSettings.saveFailed);
    } finally {
      setSaving(null);
    }
  };

  const isConfigured = (provider: keyof SsoConfig) => {
    const c = config[provider];
    if (!c) return false;
    if (provider === "entraId") {
      return (
        Boolean((c as SsoConfig["entraId"])?.tenantId) &&
        Boolean((c as SsoConfig["entraId"])?.clientId) &&
        Boolean(
          (c as SsoConfig["entraId"])?.hasClientSecret ||
          (c as SsoConfig["entraId"])?.clientSecret?.trim()
        )
      );
    }
    if (provider === "google") {
      return (
        Boolean((c as SsoConfig["google"])?.clientId) &&
        Boolean(
          (c as SsoConfig["google"])?.hasClientSecret ||
          (c as SsoConfig["google"])?.clientSecret?.trim()
        )
      );
    }
    if (provider === "saml") return !!(c as SsoConfig["saml"])?.metadataUrl;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-800/40 dark:bg-blue-900/10">
        <IconInfoCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
        <p className="text-sm text-blue-800 dark:text-blue-300">{t.ssoSettings.infoBanner}</p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Tabs defaultValue="entra">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="entra" className="flex-1 gap-2">
            <IconBrandAzure className="h-4 w-4" />
            Microsoft Entra ID
          </TabsTrigger>
          <TabsTrigger value="google" className="flex-1 gap-2">
            <IconBrandGoogle className="h-4 w-4" />
            Google Workspace
          </TabsTrigger>
          <TabsTrigger value="saml" className="flex-1 gap-2">
            <IconKey className="h-4 w-4" />
            SAML 2.0
          </TabsTrigger>
        </TabsList>

        {/* ── Microsoft Entra ID ── */}
        <TabsContent value="entra">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0078D4]/10">
                    <IconBrandAzure className="h-5 w-5 text-[#0078D4]" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Microsoft Entra ID (Azure AD)</CardTitle>
                    <CardDescription className="text-xs">{t.ssoSettings.entraDesc}</CardDescription>
                  </div>
                </div>
                {isConfigured("entraId") && (
                  <Badge
                    variant="outline"
                    className="border-green-500/50 text-green-600 dark:text-green-400">
                    <IconCheck className="mr-1 h-3 w-3" />
                    {t.ssoSettings.configured}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t.ssoSettings.tenantId}</Label>
                  <Input
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={config.entraId?.tenantId ?? ""}
                    onChange={(e) => update("entraId", "tenantId", e.target.value)}
                  />
                  <p className="text-muted-foreground text-xs">{t.ssoSettings.tenantIdDesc}</p>
                </div>
                <div className="space-y-1.5">
                  <Label>{t.ssoSettings.clientId}</Label>
                  <Input
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={config.entraId?.clientId ?? ""}
                    onChange={(e) => update("entraId", "clientId", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>{t.ssoSettings.clientSecret}</Label>
                  <Input
                    type="password"
                    placeholder="••••••••••••••••"
                    value={config.entraId?.clientSecret ?? ""}
                    onChange={(e) => update("entraId", "clientSecret", e.target.value)}
                  />
                  {config.entraId?.hasClientSecret && !config.entraId?.clientSecret ? (
                    <p className="text-muted-foreground text-xs">
                      {locale === "ar"
                        ? "يوجد Client Secret محفوظ بالفعل. اترك الحقل فارغاً للإبقاء عليه أو أدخل قيمة جديدة للاستبدال."
                        : "A client secret is already stored. Leave this field empty to keep it or enter a new value to replace it."}
                    </p>
                  ) : null}
                </div>
              </div>
              <CallbackUrlBox
                label={t.ssoSettings.redirectUri}
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/auth/callback/azure-ad`}
              />
              <Accordion type="single" collapsible>
                <AccordionItem value="setup">
                  <AccordionTrigger className="text-sm">
                    {t.ssoSettings.setupGuide}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2 text-sm">
                    <ol className="list-inside list-decimal space-y-1">
                      <li>{t.ssoSettings.entraStep1}</li>
                      <li>{t.ssoSettings.entraStep2}</li>
                      <li>{t.ssoSettings.entraStep3}</li>
                      <li>{t.ssoSettings.entraStep4}</li>
                    </ol>
                    <a
                      href="https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary inline-flex items-center gap-1 text-xs hover:underline">
                      {t.ssoSettings.entraDocsLink}
                      <IconExternalLink className="h-3 w-3" />
                    </a>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <div className="flex justify-end">
                <Button
                  onClick={() => save("entra")}
                  disabled={saving === "entra"}
                  className="gap-2">
                  {saving === "entra" ? <IconLoader2 className="h-4 w-4 animate-spin" /> : null}
                  {saved === "entra" ? (
                    <>
                      <IconCheck className="h-4 w-4" />
                      {t.ssoSettings.saved}
                    </>
                  ) : (
                    t.ssoSettings.save
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Google Workspace ── */}
        <TabsContent value="google">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4285F4]/10">
                    <IconBrandGoogle className="h-5 w-5 text-[#4285F4]" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Google Workspace</CardTitle>
                    <CardDescription className="text-xs">
                      {t.ssoSettings.googleDesc}
                    </CardDescription>
                  </div>
                </div>
                {isConfigured("google") && (
                  <Badge
                    variant="outline"
                    className="border-green-500/50 text-green-600 dark:text-green-400">
                    <IconCheck className="mr-1 h-3 w-3" />
                    {t.ssoSettings.configured}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t.ssoSettings.clientId}</Label>
                  <Input
                    placeholder="123456789-xxxxxxxx.apps.googleusercontent.com"
                    value={config.google?.clientId ?? ""}
                    onChange={(e) => update("google", "clientId", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.ssoSettings.clientSecret}</Label>
                  <Input
                    type="password"
                    placeholder="••••••••••••••••"
                    value={config.google?.clientSecret ?? ""}
                    onChange={(e) => update("google", "clientSecret", e.target.value)}
                  />
                  {config.google?.hasClientSecret && !config.google?.clientSecret ? (
                    <p className="text-muted-foreground text-xs">
                      {locale === "ar"
                        ? "يوجد Client Secret محفوظ بالفعل. اترك الحقل فارغاً للإبقاء عليه أو أدخل قيمة جديدة للاستبدال."
                        : "A client secret is already stored. Leave this field empty to keep it or enter a new value to replace it."}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label>{t.ssoSettings.hostedDomain}</Label>
                  <Input
                    placeholder="yourdomain.com"
                    value={config.google?.hostedDomain ?? ""}
                    onChange={(e) => update("google", "hostedDomain", e.target.value)}
                  />
                  <p className="text-muted-foreground text-xs">{t.ssoSettings.hostedDomainDesc}</p>
                </div>
              </div>
              <CallbackUrlBox
                label={t.ssoSettings.redirectUri}
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/auth/callback/google`}
              />
              <div className="flex justify-end">
                <Button
                  onClick={() => save("google")}
                  disabled={saving === "google"}
                  className="gap-2">
                  {saving === "google" ? <IconLoader2 className="h-4 w-4 animate-spin" /> : null}
                  {saved === "google" ? (
                    <>
                      <IconCheck className="h-4 w-4" />
                      {t.ssoSettings.saved}
                    </>
                  ) : (
                    t.ssoSettings.save
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SAML 2.0 ── */}
        <TabsContent value="saml">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                    <IconKey className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">SAML 2.0</CardTitle>
                    <CardDescription className="text-xs">{t.ssoSettings.samlDesc}</CardDescription>
                  </div>
                </div>
                {isConfigured("saml") && (
                  <Badge
                    variant="outline"
                    className="border-green-500/50 text-green-600 dark:text-green-400">
                    <IconCheck className="mr-1 h-3 w-3" />
                    {t.ssoSettings.configured}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-1.5">
                  <Label>{t.ssoSettings.samlMetadataUrl}</Label>
                  <Input
                    placeholder="https://your-idp.com/saml/metadata"
                    value={config.saml?.metadataUrl ?? ""}
                    onChange={(e) => update("saml", "metadataUrl", e.target.value)}
                  />
                  <p className="text-muted-foreground text-xs">
                    {t.ssoSettings.samlMetadataUrlDesc}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>{t.ssoSettings.samlEntityId}</Label>
                  <Input
                    placeholder="https://your-idp.com"
                    value={config.saml?.entityId ?? ""}
                    onChange={(e) => update("saml", "entityId", e.target.value)}
                  />
                </div>
              </div>
              <CallbackUrlBox
                label={t.ssoSettings.samlAcsUrl}
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/auth/callback/saml`}
              />
              <div className="flex justify-end">
                <Button onClick={() => save("saml")} disabled={saving === "saml"} className="gap-2">
                  {saving === "saml" ? <IconLoader2 className="h-4 w-4 animate-spin" /> : null}
                  {saved === "saml" ? (
                    <>
                      <IconCheck className="h-4 w-4" />
                      {t.ssoSettings.saved}
                    </>
                  ) : (
                    t.ssoSettings.save
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Callback URL display helper
───────────────────────────────────────────────────────────── */
function CallbackUrlBox({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = React.useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input value={value} readOnly className="text-muted-foreground font-mono text-xs" />
        <Button variant="outline" size="sm" onClick={copy} className="shrink-0">
          {copied ? <IconCheck className="h-4 w-4 text-green-500" /> : "نسخ"}
        </Button>
      </div>
    </div>
  );
}
