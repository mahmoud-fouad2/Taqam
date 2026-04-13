/**
 * Tenant Settings Page
 * صفحة إعدادات الشركة
 */

"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowRight, Settings, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import type { Tenant } from "@/lib/types/tenant";
import { TenantSettingsForm } from "./tenant-settings-form";
import { tenantsService } from "@/lib/api";
import { TenantAdminCredentialsCard } from "./tenant-admin-credentials-card";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { getText } from "@/lib/i18n/text";
import { useClientLocale } from "@/lib/i18n/use-client-locale";

type LocaleText = ReturnType<typeof getText>;

// Delete Tenant Dialog Component with controlled open state
function DeleteTenantDialog({
  tenant,
  busyAction,
  onDelete,
  text
}: {
  tenant: Tenant;
  busyAction: string | null;
  onDelete: () => Promise<void>;
  text: LocaleText;
}) {
  const [open, setOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete();
      // Don't close - the redirect will happen
    } catch {
      setDeleting(false);
      setOpen(false);
    }
  }

  return (
    <div className="border-destructive/20 bg-destructive/5 flex items-center justify-between rounded-lg border p-4">
      <div>
        <p className="text-destructive font-medium">{text.tenant.deleteTitle}</p>
        <p className="text-muted-foreground text-sm">{text.tenant.deleteDescription}</p>
      </div>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={busyAction !== null || deleting}>
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {text.common.deleting}
              </>
            ) : (
              text.common.delete
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{text.tenant.deleteConfirm}</AlertDialogTitle>
            <AlertDialogDescription>
              {text.tenant.pThisActionCannotBeUndone} &quot;{tenant.nameAr}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{text.common.cancel}</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {text.common.deleting}
                </>
              ) : (
                text.common.confirmDeleteTitle
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function TenantSettingsPage() {
  const locale = useClientLocale();
  const t = getText(locale);
  const router = useRouter();
  const params = useParams<{ id?: string | string[] }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [tenant, setTenant] = React.useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busyAction, setBusyAction] = React.useState<null | "suspend" | "activate" | "delete">(
    null
  );
  const [suspendReason, setSuspendReason] = React.useState("");

  const loadTenant = React.useCallback(
    async (tenantId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await tenantsService.getById(tenantId);
        if (res.success && res.data) {
          setTenant(res.data);
        } else {
          setTenant(null);
          setError(res.error || t.organization.fetchCompanyError);
        }
      } catch (e) {
        setTenant(null);
        setError(e instanceof Error ? e.message : t.organization.fetchCompanyError);
      } finally {
        setIsLoading(false);
      }
    },
    [t.organization.fetchCompanyError]
  );

  React.useEffect(() => {
    if (!id) return;
    void loadTenant(id);
  }, [id, loadTenant]);

  async function doSuspend() {
    if (!tenant) return;
    setBusyAction("suspend");
    try {
      const res = await tenantsService.suspend(
        tenant.id,
        suspendReason.trim() || "Suspended by admin"
      );
      if (!res.success) {
        toast.error(res.error || t.tenants.suspendFailed);
        return;
      }
      toast.success(t.tenants.suspended);
      await loadTenant(tenant.id);
    } finally {
      setBusyAction(null);
    }
  }

  async function doActivate() {
    if (!tenant) return;
    setBusyAction("activate");
    try {
      const res = await tenantsService.activate(tenant.id);
      if (!res.success) {
        toast.error(res.error || t.tenants.activateFailed);
        return;
      }
      toast.success(t.tenants.activated);
      await loadTenant(tenant.id);
    } finally {
      setBusyAction(null);
    }
  }

  async function doDelete() {
    if (!tenant) return;
    setBusyAction("delete");
    try {
      const res = await tenantsService.delete(tenant.id);
      if (!res.success) {
        toast.error(res.error || t.tenants.deleteFailed);
        return;
      }
      toast.success(t.tenants.deleted);
      router.push("/dashboard/super-admin/tenants");
    } finally {
      setBusyAction(null);
    }
  }

  if (!id || isLoading) {
    return (
      <div className="border-border/60 bg-card/80 text-muted-foreground flex items-center justify-center rounded-2xl border py-10 shadow-sm">
        {t.tenant.settingsLoading}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4">
          {error}
        </div>
        <Link
          href="/dashboard/super-admin/tenants"
          className="border-border/60 bg-background text-foreground hover:bg-muted inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium shadow-sm transition-colors">
          {t.tenant.backToList}
        </Link>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">{t.tenant.notFound}</p>
        <Link
          href="/dashboard/super-admin/tenants"
          className="border-border/60 bg-background text-foreground hover:bg-muted inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium shadow-sm transition-colors">
          {t.tenant.backToList}
        </Link>
      </div>
    );
  }

  const isSuspended = tenant.status === "suspended";
  const isPending = tenant.status === "pending";
  const canActivate = isSuspended || isPending;

  return (
    <div className="space-y-6">
      <section className="border-border/60 bg-card/80 supports-[backdrop-filter]:bg-card/70 rounded-2xl border p-5 shadow-sm backdrop-blur">
        <div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
          <Link href="/dashboard/super-admin/tenants" className="hover:text-primary font-medium">
            {t.common.companies}
          </Link>
          <ArrowRight className="h-4 w-4 rotate-180" />
          <Link
            href={`/dashboard/super-admin/tenants/${id}`}
            className="hover:text-primary font-medium">
            {tenant.nameAr}
          </Link>
          <ArrowRight className="h-4 w-4 rotate-180" />
          <span>{t.common.options}</span>
        </div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Settings className="h-6 w-6" />
          {t.tenant.settings}
        </h1>
        <p className="text-muted-foreground text-sm">
          {tenant.nameAr} - {tenant.name}
        </p>
      </section>

      <Card className="border-border/60 bg-card/85 shadow-sm">
        <CardHeader>
          <CardTitle>{t.common.options}</CardTitle>
          <CardDescription>{t.tenant.settingsDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <TenantSettingsForm tenant={tenant} />
        </CardContent>
      </Card>

      <TenantAdminCredentialsCard tenantId={tenant.id} />

      <Card className="border-destructive/40 bg-card/85 shadow-sm">
        <CardHeader>
          <CardTitle className="text-destructive">{t.tenant.dangerZone}</CardTitle>
          <CardDescription>{t.tenant.dangerZoneDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
            <div>
              <p className="font-medium">{canActivate ? t.tenant.activate : t.tenant.suspend}</p>
              <p className="text-muted-foreground text-sm">
                {canActivate
                  ? isPending
                    ? locale === "ar"
                      ? "الشركة منشأة ولكنها ما زالت بانتظار التفعيل النهائي. فعّلها عندما يصبح حساب مدير الشركة جاهزًا."
                      : "The company has been created but is still awaiting final activation. Activate it when the company admin account is ready."
                    : `${t.tenant.pReactivateCompany} - ${t.tenant.pUser}`
                  : `${t.tenant.suspendDesc} - ${t.tenant.pUser}`}
              </p>
            </div>

            {canActivate ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={busyAction !== null}
                    className="bg-emerald-600 hover:bg-emerald-700">
                    {t.tenant.pEnable}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {isPending
                        ? locale === "ar"
                          ? "تأكيد تفعيل الشركة الجديدة"
                          : "Confirm initial company activation"
                        : t.tenant.activateConfirm}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {isPending
                        ? locale === "ar"
                          ? "سيتم تحويل الشركة من Pending إلى Active والسماح بالدخول بعد جاهزية حساب مدير الشركة والمستخدمين المرتبطين بها."
                          : "The company will move from Pending to Active and linked users will be allowed to sign in once their accounts are ready."
                        : t.tenant.activateWarning}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => void doActivate()}
                      disabled={busyAction !== null}>
                      {t.tenant.pConfirm}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={busyAction !== null}
                    className="bg-amber-600 hover:bg-amber-700">
                    {t.tenant.pSuspend}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t.tenant.pConfirmCompanySuspension}</AlertDialogTitle>
                    <AlertDialogDescription>{t.tenant.suspendWarning}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t.common.reason}</label>
                    <Input
                      value={suspendReason}
                      onChange={(e) => setSuspendReason(e.target.value)}
                      placeholder={t.tenant.suspendReasonExample}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => void doSuspend()}
                      disabled={busyAction !== null}>
                      {t.tenant.pConfirm}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          <DeleteTenantDialog
            tenant={tenant}
            busyAction={busyAction}
            onDelete={doDelete}
            text={t}
          />
        </CardContent>
      </Card>
    </div>
  );
}
