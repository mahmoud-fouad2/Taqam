"use client";

/**
 * Create Tenant Form
 * نموذج إنشاء شركة جديدة
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Building2, User, Settings } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

// Validation Schema
const createTenantSchema = z.object({
  // Company Info
  name: z.string().min(2, "English name is required"),
  nameAr: z.string().min(2, "Arabic name is required"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(30, "Slug must be less than 30 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  commercialRegister: z.string().optional(),
  
  // Settings
  plan: z.enum(["starter", "business", "enterprise"]),
  defaultLocale: z.enum(["ar", "en"]),
  defaultTheme: z.enum(["shadcn", "mantine"]),
  
  // Company Admin
  adminName: z.string().min(2, "Admin name is required"),
  adminEmail: z.string().email("Invalid admin email"),
  sendInvite: z.boolean().default(true),
});

type CreateTenantInput = z.infer<typeof createTenantSchema>;

export function CreateTenantForm() {
  const locale = useClientLocale();
  const t = getText(locale);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTenantInput>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      plan: "business",
      defaultLocale: "ar",
      defaultTheme: "shadcn",
      sendInvite: true,
    },
  });

  // Auto-generate slug from English name
  const name = watch("name");
  const slugPreview = watch("slug");
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    register("name").onChange(e);
    // Auto-generate slug
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 30);
    setValue("slug", slug);
  };

  const onSubmit = async (data: CreateTenantInput) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          nameAr: data.nameAr,
          slug: data.slug,
          plan: data.plan,
          email: data.email,
          phone: data.phone,
          defaultLocale: data.defaultLocale,
          defaultTheme: data.defaultTheme,
          // Prisma model stores settings as Json
          settings: {
            defaultLocale: data.defaultLocale,
            defaultTheme: data.defaultTheme,
            contactEmail: data.email,
            contactPhone: data.phone,
            commercialRegister: data.commercialRegister,
            adminName: data.adminName,
            adminEmail: data.adminEmail,
            sendInvite: data.sendInvite,
          },
        }),
      });

      const json = await res.json().catch(() => ({} as any));

      if (!res.ok || json?.success === false) {
        const msg = json?.error || json?.message || t.tenant.createFailed;
        toast.error(msg);
        return;
      }

      toast.success(t.tenants.createdSuccess);
      router.push("/dashboard/super-admin/tenants?created=true");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.tenants.connectionFailed);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Section 1: Company Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Building2 className="h-5 w-5" />{t.organization.companySection}</div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nameAr">{t.tenant.nameArLabel}</Label>
            <Input
              id="nameAr"
              placeholder={t.tenant.companyNameExample}
              {...register("nameAr")}
            />
            {errors.nameAr && (
              <p className="text-sm text-destructive">{errors.nameAr.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">{t.tenant.nameEnLabel}</Label>
            <Input
              id="name"
              placeholder="Elite Technology Co."
              {...register("name")}
              onChange={handleNameChange}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="slug">{t.tenant.slugLabel}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="slug"
                placeholder={t.tenant.slugExample}
                className="flex-1"
                {...register("slug")}
              />
              <span className="text-sm text-muted-foreground">/t/</span>
            </div>
            <p className="text-xs text-muted-foreground">{t.tenant.pCompanyUrlWillBe} /t/{slugPreview || "company"}</p>
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="commercialRegister">{t.organization.commercialReg}</Label>
            <Input
              id="commercialRegister"
              placeholder="1010123456"
              {...register("commercialRegister")}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">{t.tenant.emailLabel}</Label>
            <Input
              id="email"
              type="email"
              placeholder="info@company.sa"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">{t.common.phone}</Label>
            <Input
              id="phone"
              placeholder="+966501234567"
              {...register("phone")}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Section 2: Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Settings className="h-5 w-5" />{t.tenant.defaultSettings}</div>
        
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>{t.tenant.planLabel}</Label>
            <Select
              defaultValue="business"
              onValueChange={(value) => setValue("plan", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.tenant.planPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>{t.tenant.languageLabel}</Label>
            <Select
              defaultValue="ar"
              onValueChange={(value) => setValue("defaultLocale", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.tenant.languagePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">{t.common.arabic}</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>{t.tenant.themeLabel}</Label>
            <Select
              defaultValue="shadcn"
              onValueChange={(value) => setValue("defaultTheme", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.tenant.themePlaceholder} />
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

      {/* Section 3: Company Admin */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <User className="h-5 w-5" />{t.tenant.adminLabel}</div>
        <p className="text-sm text-muted-foreground">{t.tenant.adminDescription}</p>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="adminName">{t.tenant.adminNameLabel}</Label>
            <Input
              id="adminName"
              placeholder={t.tenant.adminNameExample}
              {...register("adminName")}
            />
            {errors.adminName && (
              <p className="text-sm text-destructive">{errors.adminName.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="adminEmail">{t.tenant.adminEmailLabel}</Label>
            <Input
              id="adminEmail"
              type="email"
              placeholder="admin@company.sa"
              {...register("adminEmail")}
            />
            {errors.adminEmail && (
              <p className="text-sm text-destructive">{errors.adminEmail.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          <Checkbox
            id="sendInvite"
            defaultChecked
            onCheckedChange={(checked) => setValue("sendInvite", !!checked)}
          />
          <Label htmlFor="sendInvite" className="text-sm font-normal">{t.tenant.sendInviteCheckbox}</Label>
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >{t.common.cancel}</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {t.tenant.pCreateCompany}
        </Button>
      </div>
    </form>
  );
}
