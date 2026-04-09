"use client";

/**
 * Tenants Data Table
 * جدول الشركات مع الإجراءات
 */

import Link from "next/link";
import * as React from "react";
import { 
  Search,
  MoreHorizontal, 
  Eye, 
  Settings, 
  Pause, 
  Play, 
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Tenant, TenantStatus } from "@/lib/types/tenant";
import { buildTenantUrl } from "@/lib/tenant";
import { tenantsService } from "@/lib/api";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

type LocaleText = ReturnType<typeof getText>;

function getStatusMeta(status: string, t: LocaleText) {
  const statusConfig: Record<
    TenantStatus,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
  > = {
    active: {
      label: t.common.active,
      variant: "default",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    pending: {
      label: t.common.pending,
      variant: "secondary",
      icon: <Clock className="h-3 w-3" />,
    },
    suspended: {
      label: t.common.suspended,
      variant: "destructive",
      icon: <AlertCircle className="h-3 w-3" />,
    },
    cancelled: {
      label: t.common.cancelled,
      variant: "outline",
      icon: <XCircle className="h-3 w-3" />,
    },
    deleted: {
      label: t.common.deleted,
      variant: "outline",
      icon: <XCircle className="h-3 w-3" />,
    },
  };

  const meta = statusConfig[status as TenantStatus];
  return (
    meta ?? {
      label: status,
      variant: "outline" as const,
      icon: <AlertCircle className="h-3 w-3" />,
    }
  );
}

const planLabels: Record<string, { ar: string; en: string }> = {
  starter: { ar: "ستارتر", en: "Starter" },
  business: { ar: "بيزنس", en: "Business" },
  enterprise: { ar: "إنتربرايز", en: "Enterprise" },
};

export function TenantsTable() {
  const locale = useClientLocale("ar") as "ar" | "en";
  const t = getText(locale);
  const [tenants, setTenants] = React.useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<{ id: string; action: "suspend" | "activate" | "delete" } | null>(null);
  const [tenantToDelete, setTenantToDelete] = React.useState<Tenant | null>(null);
  const [tenantToSuspend, setTenantToSuspend] = React.useState<Tenant | null>(null);
  const defaultSuspendReason = locale === "ar" ? "تم الإيقاف بواسطة المشرف" : "Suspended by admin";
  const [suspendReason, setSuspendReason] = React.useState(defaultSuspendReason);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<TenantStatus | "all">("all");
  const [planFilter, setPlanFilter] = React.useState<"all" | "starter" | "business" | "enterprise">("all");
  const [sortBy, setSortBy] = React.useState<"newest" | "oldest" | "usersDesc" | "employeesDesc" | "nameAsc">("newest");
  const [density, setDensity] = React.useState<"comfortable" | "compact">("comfortable");

  const loadTenants = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await tenantsService.getAll();
      if (res.success && res.data) {
        setTenants(res.data);
      } else {
        setTenants([]);
        setError(res.error || t.tenants.connectionFailed);
      }
    } catch (e) {
      setTenants([]);
      setError(e instanceof Error ? e.message : t.tenants.connectionFailed);
    } finally {
      setIsLoading(false);
    }
  }, [t.tenants.connectionFailed]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadTenants();
        if (!mounted) return;
      } catch (e) {
        if (!mounted) return;
        setTenants([]);
        setError(e instanceof Error ? e.message : t.tenants.connectionFailed);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [loadTenants, t.tenants.connectionFailed]);

  const totals = React.useMemo(
    () => ({
      all: tenants.length,
      active: tenants.filter((item) => item.status === "active").length,
      pending: tenants.filter((item) => item.status === "pending").length,
      suspended: tenants.filter((item) => item.status === "suspended").length,
    }),
    [tenants]
  );

  const filteredTenants = React.useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = tenants.filter((tenant) => {
      if (statusFilter !== "all" && tenant.status !== statusFilter) {
        return false;
      }

      const planKey = String((tenant as any)?.plan ?? "").toLowerCase();
      if (planFilter !== "all" && planKey !== planFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchable = [
        tenant.nameAr ?? "",
        tenant.name ?? "",
        tenant.slug ?? "",
        tenant.status ?? "",
        planKey,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });

    return filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "usersDesc") {
        return Number(b.usersCount ?? 0) - Number(a.usersCount ?? 0);
      }
      if (sortBy === "employeesDesc") {
        return Number(b.employeesCount ?? 0) - Number(a.employeesCount ?? 0);
      }
      return String(a.nameAr ?? a.name ?? "").localeCompare(String(b.nameAr ?? b.name ?? ""), locale);
    });
  }, [locale, planFilter, searchTerm, sortBy, statusFilter, tenants]);

  async function handleDeleteTenant(tenant: Tenant) {
    setTenantToDelete(tenant);
  }

  async function confirmDeleteTenant() {
    if (!tenantToDelete) return;
    const tenant = tenantToDelete;
    setTenantToDelete(null);
    setBusy({ id: tenant.id, action: "delete" });
    try {
      const res = await tenantsService.delete(tenant.id);
      if (!res.success) {
        toast.error(res.error || t.tenants.deleteFailed);
        return;
      }
      toast.success(t.tenants.deleted);
      await loadTenants();
    } finally {
      setBusy(null);
    }
  }

  async function handleSuspendTenant(tenant: Tenant) {
    setTenantToSuspend(tenant);
    setSuspendReason(defaultSuspendReason);
  }

  async function confirmSuspendTenant() {
    if (!tenantToSuspend) return;
    const tenant = tenantToSuspend;
    setTenantToSuspend(null);
    setBusy({ id: tenant.id, action: "suspend" });
    try {
      const res = await tenantsService.suspend(tenant.id, suspendReason.trim() || defaultSuspendReason);
      if (!res.success) {
        toast.error(res.error || t.tenants.suspendFailed);
        return;
      }
      toast.success(t.tenants.suspended);
      await loadTenants();
    } finally {
      setBusy(null);
    }
  }

  async function handleActivateTenant(tenant: Tenant) {
    setBusy({ id: tenant.id, action: "activate" });
    try {
      const res = await tenantsService.activate(tenant.id);
      if (!res.success) {
        toast.error(res.error || t.tenants.activateFailed);
        return;
      }
      toast.success(t.tenants.activated);
      await loadTenants();
    } finally {
      setBusy(null);
    }
  }

  const searchPlaceholder =
    locale === "ar"
      ? "ابحث باسم الشركة أو الرابط المختصر أو الباقة"
      : "Search by company, slug, or plan";

  const sortLabels =
    locale === "ar"
      ? {
          newest: "الأحدث أولاً",
          oldest: "الأقدم أولاً",
          usersDesc: "الأكثر مستخدمين",
          employeesDesc: "الأكثر موظفين",
          nameAsc: "الاسم أ - ي",
        }
      : {
          newest: "Newest first",
          oldest: "Oldest first",
          usersDesc: "Most users",
          employeesDesc: "Most employees",
          nameAsc: "Name A-Z",
        };

  const noFilterResultsText =
    locale === "ar"
      ? "لا توجد نتائج مطابقة للفلاتر الحالية"
      : "No matching results for current filters";

  const dateLocale = locale === "ar" ? "ar-SA" : "en-US";

  const getPlanLabel = (plan: unknown) => {
    const key = String(plan ?? "").toLowerCase();
    return planLabels[key]?.[locale] ?? (key || "—");
  };

  if (isLoading) {
    return (
      <TableSkeleton rows={7} columns={8} />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <AlertCircle className="mb-3 h-10 w-10 text-destructive" />
        <p className="font-medium">{t.tenants.loadFailed}</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">{t.tenants.noTenants}</h3>
        <p className="text-muted-foreground">{t.tenants.noTenantsDesc}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 border-b p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{t.common.total}: {totals.all}</Badge>
          <Badge variant="default">{t.common.active}: {totals.active}</Badge>
          <Badge variant="secondary">{t.common.pending}: {totals.pending}</Badge>
          <Badge variant="destructive">{t.common.suspended}: {totals.suspended}</Badge>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="ps-9"
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
            />
          </div>

          <select
            className="h-9 min-w-40 rounded-md border border-input bg-background px-3 text-sm"
            aria-label={t.common.filterByStatus}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as TenantStatus | "all")}
          >
            <option value="all">{t.common.allStatuses}</option>
            <option value="active">{t.common.active}</option>
            <option value="pending">{t.common.pending}</option>
            <option value="suspended">{t.common.suspended}</option>
            <option value="cancelled">{t.common.cancelled}</option>
          </select>

          <select
            className="h-9 min-w-40 rounded-md border border-input bg-background px-3 text-sm"
            aria-label={t.tenants.filterByPlan}
            value={planFilter}
            onChange={(event) =>
              setPlanFilter(event.target.value as "all" | "starter" | "business" | "enterprise")
            }
          >
            <option value="all">{t.tenants.pAllPlans}</option>
            <option value="starter">{planLabels.starter[locale]}</option>
            <option value="business">{planLabels.business[locale]}</option>
            <option value="enterprise">{planLabels.enterprise[locale]}</option>
          </select>

          <select
            className="h-9 min-w-44 rounded-md border border-input bg-background px-3 text-sm"
            aria-label={locale === "ar" ? "الترتيب" : "Sort"}
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value as "newest" | "oldest" | "usersDesc" | "employeesDesc" | "nameAsc")
            }
          >
            <option value="newest">{sortLabels.newest}</option>
            <option value="oldest">{sortLabels.oldest}</option>
            <option value="usersDesc">{sortLabels.usersDesc}</option>
            <option value="employeesDesc">{sortLabels.employeesDesc}</option>
            <option value="nameAsc">{sortLabels.nameAsc}</option>
          </select>

          <div className="inline-flex rounded-md border border-input p-0.5">
            <Button
              type="button"
              variant={density === "comfortable" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 rounded-sm px-2"
              onClick={() => setDensity("comfortable")}
            >
              {locale === "ar" ? "مريح" : "Comfortable"}
            </Button>
            <Button
              type="button"
              variant={density === "compact" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 rounded-sm px-2"
              onClick={() => setDensity("compact")}
            >
              {locale === "ar" ? "مكثف" : "Compact"}
            </Button>
          </div>
        </div>
      </div>

      {filteredTenants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Search className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">{noFilterResultsText}</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.common.company}</TableHead>
              <TableHead>{t.tenants.slugColumn}</TableHead>
              <TableHead>{t.common.status}</TableHead>
              <TableHead>{t.common.type}</TableHead>
              <TableHead className="text-center">{t.common.users}</TableHead>
              <TableHead className="text-center">{t.common.employees}</TableHead>
              <TableHead>{t.common.createdAt}</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTenants.map((tenant) => (
              <TableRow key={tenant.id} className={density === "compact" ? "[&>td]:py-2" : "[&>td]:py-3"}>
                <TableCell>
                  <div>
                    <Link
                      href={`/dashboard/super-admin/tenants/${tenant.id}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {tenant.nameAr}
                    </Link>
                    <p className="text-sm text-muted-foreground">{tenant.name}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="rounded bg-muted px-2 py-1 text-sm">
                    {tenant.slug}
                  </code>
                </TableCell>
                <TableCell>
                  {(() => {
                    const meta = getStatusMeta(String((tenant as any)?.status ?? "unknown"), t);
                    return (
                      <Badge variant={meta?.variant ?? "outline"} className="gap-1">
                        {meta?.icon}
                        {meta?.label ?? "—"}
                      </Badge>
                    );
                  })()}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getPlanLabel((tenant as any)?.plan)}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">{tenant.usersCount}</TableCell>
                <TableCell className="text-center">{tenant.employeesCount}</TableCell>
                <TableCell>
                  {new Date(tenant.createdAt).toLocaleDateString(dateLocale)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">{t.tenants.openMenu}</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{t.common.actions}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/super-admin/tenants/${tenant.id}`}>
                          <Eye className="me-2 h-4 w-4" />{t.common.viewDetails}</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/super-admin/tenants/${tenant.id}/settings`}>
                          <Settings className="me-2 h-4 w-4" />{t.common.settings}</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a
                          href={buildTenantUrl(tenant.slug, "/dashboard")}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="me-2 h-4 w-4" />{t.common.open}</a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {tenant.status === "active" ? (
                        <DropdownMenuItem
                          className="text-amber-600"
                          disabled={busy?.id === tenant.id}
                          onSelect={(e) => {
                            e.preventDefault();
                            void handleSuspendTenant(tenant);
                          }}
                        >
                          <Pause className="me-2 h-4 w-4" />
                          {busy?.id === tenant.id && busy?.action === "suspend" ? (
                            <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />{t.tenants.suspending}</span>
                          ) : (
                            t.tenant.suspend
                          )}
                        </DropdownMenuItem>
                      ) : tenant.status === "suspended" ? (
                        <DropdownMenuItem
                          className="text-green-600"
                          disabled={busy?.id === tenant.id}
                          onSelect={(e) => {
                            e.preventDefault();
                            void handleActivateTenant(tenant);
                          }}
                        >
                          <Play className="me-2 h-4 w-4" />
                          {busy?.id === tenant.id && busy?.action === "activate" ? (
                            <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />{t.tenants.activating}</span>
                          ) : (
                            t.tenant.activate
                          )}
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem
                        className="text-destructive"
                        disabled={busy?.id === tenant.id}
                        onSelect={(e) => {
                          e.preventDefault();
                          void handleDeleteTenant(tenant);
                        }}
                      >
                        <Trash2 className="me-2 h-4 w-4" />
                        {busy?.id === tenant.id && busy?.action === "delete" ? (
                          <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />{t.common.deleting}</span>
                        ) : (
                          t.tenants.deleteTenant
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

    {/* Delete Confirmation */}
    <AlertDialog open={tenantToDelete !== null} onOpenChange={(open) => !open && setTenantToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.tenant.deleteConfirm}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.tenants.pAreYouSureYouWantToDelete} &quot;{tenantToDelete?.nameAr}&quot;? {t.tenants.deleteConfirmMsg}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => void confirmDeleteTenant()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >{t.common.delete}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Suspend Dialog with reason input */}
    <Dialog open={tenantToSuspend !== null} onOpenChange={(open) => !open && setTenantToSuspend(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.tenant.suspend}</DialogTitle>
          <DialogDescription>{t.tenant.suspendWarning}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="suspend-reason">{t.common.reason}</Label>
          <Input
            id="suspend-reason"
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder={t.tenant.suspendReasonExample}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setTenantToSuspend(null)}>{t.common.cancel}</Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700"
            onClick={() => void confirmSuspendTenant()}
          >
            {t.tenants.confirmSuspend}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
