"use client";

/**
 * Tenant Settings Form
 * نموذج إعدادات الشركة
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { Tenant } from "@/lib/types/tenant";
import { tenantsService } from "@/lib/api";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

interface TenantSettingsFormProps {
  tenant: Tenant;
}

export function TenantSettingsForm({ tenant }: TenantSettingsFormProps) {
  const locale = useClientLocale();
  const t = getText(locale);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: tenant.name,
    nameAr: tenant.nameAr,
    email: tenant.email,
    phone: tenant.phone || "",
    plan: tenant.plan,
    defaultLocale: tenant.defaultLocale,
    defaultTheme: tenant.defaultTheme,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.nameAr?.trim() && !formData.name?.trim()) {
      toast.error(t.organization.companyNameRequired);
      setIsLoading(false);
      return;
    }

    try {
      const res = await tenantsService.update(tenant.id, {
        name: formData.name?.trim() || formData.nameAr?.trim() || tenant.name,
        nameAr: formData.nameAr?.trim() || formData.name?.trim() || tenant.nameAr,
        email: formData.email?.trim() || "",
        phone: formData.phone?.trim() || undefined,
        plan: formData.plan,
        defaultLocale: formData.defaultLocale,
        defaultTheme: formData.defaultTheme,
      });

      if (!res.success) {
        toast.error(res.error || t.organization.updateFailed);
        return;
      }

      toast.success(t.tenant.pCompanySettingsSaved);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.organization.updateFailed);
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t.organization.companySection}</h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nameAr">{t.tenant.pCompanyNameArabic}</Label>
            <Input
              id="nameAr"
              value={formData.nameAr}
              onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">{t.tenant.pCompanyNameEnglish}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">{t.common.email}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">{t.common.phone}</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t.common.options}</h3>
        
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>{t.common.type}</Label>
            <Select
              value={formData.plan}
              onValueChange={(value) => setFormData({ ...formData, plan: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>{t.common.options}</Label>
            <Select
              value={formData.defaultLocale}
              onValueChange={(value) => setFormData({ ...formData, defaultLocale: value as any })}
            >
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
            <Label>{t.tenant.defaultTheme}</Label>
            <Select
              value={formData.defaultTheme}
              onValueChange={(value) => setFormData({ ...formData, defaultTheme: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shadcn">Modern (shadcn)</SelectItem>
                <SelectItem value="mantine">Classic (Mantine)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>{t.common.cancel}</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {t.tenant.pSaveChanges}
        </Button>
      </div>
    </form>
  );
}
