"use client";

/**
 * Platform Settings Manager Component
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Save, Settings, Globe, Palette, Shield } from "lucide-react";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

interface PlatformSettings {
  id: string;
  platformName: string;
  platformNameEn: string;
  supportEmail: string;
  supportPhone: string | null;
  trialDays: number;
  trialMaxEmployees: number;
  primaryColor: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  twitterUrl: string | null;
  linkedinUrl: string | null;
  facebookUrl: string | null;
  termsUrl: string | null;
  privacyUrl: string | null;
  maintenanceMode: boolean;
  maintenanceMsg: string | null;
}

export function PlatformSettingsManager() {
  const locale = useClientLocale();
  const t = getText(locale);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/super-admin/platform-settings");
      const json = await res.json();
      if (json.data) {
        setSettings(json.data);
      }
    } catch (err) {
      console.error(err);
      toast.error(t.platformSettings.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [t.platformSettings.loadFailed]);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/super-admin/platform-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast.success(t.platformSettings.savedSuccess);
      } else {
        toast.error(t.platformSettings.saveFailed);
      }
    } catch (err) {
      console.error(err);
      toast.error(t.platformSettings.connectionError);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12 text-muted-foreground">{t.platformSettings.notFound}</div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />{t.common.general}</TabsTrigger>
          <TabsTrigger value="trial" className="gap-2">
            <Globe className="h-4 w-4" />{t.platformSettings.trial}</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />{t.platformSettings.appearance}</TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-2">
            <Shield className="h-4 w-4" />{t.platformSettings.maintenance}</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>{t.common.options}</CardTitle>
              <CardDescription>
                {t.platformSettings.pBasicPlatformInfoAndSupportDat}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t.platformSettings.platformNameAr}</Label>
                  <Input
                    value={settings.platformName}
                    onChange={(e) =>
                      setSettings({ ...settings, platformName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.platformSettings.platformNameEn}</Label>
                  <Input
                    value={settings.platformNameEn}
                    onChange={(e) =>
                      setSettings({ ...settings, platformNameEn: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t.platformSettings.supportEmail}</Label>
                  <Input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) =>
                      setSettings({ ...settings, supportEmail: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.platformSettings.supportPhone}</Label>
                  <Input
                    value={settings.supportPhone || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, supportPhone: e.target.value || null })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t.platformSettings.termsUrl}</Label>
                  <Input
                    value={settings.termsUrl || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, termsUrl: e.target.value || null })
                    }
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.platformSettings.privacyUrl}</Label>
                  <Input
                    value={settings.privacyUrl || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, privacyUrl: e.target.value || null })
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.platformSettings.socialLinks}</Label>
                <div className="grid gap-4 md:grid-cols-3">
                  <Input
                    value={settings.twitterUrl || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, twitterUrl: e.target.value || null })
                    }
                    placeholder="Twitter URL"
                  />
                  <Input
                    value={settings.linkedinUrl || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, linkedinUrl: e.target.value || null })
                    }
                    placeholder="LinkedIn URL"
                  />
                  <Input
                    value={settings.facebookUrl || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, facebookUrl: e.target.value || null })
                    }
                    placeholder="Facebook URL"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trial Settings */}
        <TabsContent value="trial">
          <Card>
            <CardHeader>
              <CardTitle>{t.platformSettings.trialSettings}</CardTitle>
              <CardDescription>{t.platformSettings.trialDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t.platformSettings.trialDays}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={90}
                    value={settings.trialDays}
                    onChange={(e) =>
                      setSettings({ ...settings, trialDays: parseInt(e.target.value) || 14 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.platformSettings.maxEmployees}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={settings.trialMaxEmployees}
                    onChange={(e) =>
                      setSettings({ ...settings, trialMaxEmployees: parseInt(e.target.value) || 10 })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>{t.platformSettings.branding}</CardTitle>
              <CardDescription>{t.platformSettings.brandingDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t.platformSettings.primaryColor}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) =>
                        setSettings({ ...settings, primaryColor: e.target.value })
                      }
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={settings.primaryColor}
                      onChange={(e) =>
                        setSettings({ ...settings, primaryColor: e.target.value })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t.platformSettings.logoUrl}</Label>
                  <Input
                    value={settings.logoUrl || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, logoUrl: e.target.value || null })
                    }
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.platformSettings.faviconUrl}</Label>
                  <Input
                    value={settings.faviconUrl || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, faviconUrl: e.target.value || null })
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Settings */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>{t.platformSettings.maintenanceMode}</CardTitle>
              <CardDescription>{t.platformSettings.maintenanceModeDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, maintenanceMode: checked })
                  }
                />
                <Label>{t.platformSettings.pEnableMaintenanceMode}</Label>
              </div>

              {settings.maintenanceMode && (
                <div className="space-y-2">
                  <Label>{t.platformSettings.maintenanceMsg}</Label>
                  <Textarea
                    value={settings.maintenanceMsg || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, maintenanceMsg: e.target.value || null })
                    }
                    placeholder={t.platformSettings.maintenanceMsgExample}
                    rows={3}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.common.saving}</>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />{t.common.saveChanges}</>
          )}
        </Button>
      </div>
    </div>
  );
}
