"use client";

/**
 * Tenants Data Table
 * جدول الشركات مع الإجراءات
 */

import Link from "next/link";
import * as React from "react";
import { 
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

const statusConfig: Record<TenantStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  active: { 
    label: "نشط", 
    variant: "default",
    icon: <CheckCircle2 className="h-3 w-3" />
  },
  pending: { 
    label: "معلق", 
    variant: "secondary",
    icon: <Clock className="h-3 w-3" />
  },
  suspended: { 
    label: "موقوف", 
    variant: "destructive",
    icon: <AlertCircle className="h-3 w-3" />
  },
  cancelled: {
    label: "ملغاة",
    variant: "outline",
    icon: <XCircle className="h-3 w-3" />,
  },
  deleted: { 
    label: "محذوف", 
    variant: "outline",
    icon: <XCircle className="h-3 w-3" />
  },
};

function getStatusMeta(status: string) {
  const meta = statusConfig[status as TenantStatus];
  return (
    meta ?? {
      label: status,
      variant: "outline" as const,
      icon: <AlertCircle className="h-3 w-3" />,
    }
  );
}

const planLabels: Record<string, string> = {
  starter: "Starter",
  business: "Business",
  enterprise: "Enterprise",
};

export function TenantsTable() {
  const [tenants, setTenants] = React.useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<{ id: string; action: "suspend" | "activate" | "delete" } | null>(null);
  const [tenantToDelete, setTenantToDelete] = React.useState<Tenant | null>(null);
  const [tenantToSuspend, setTenantToSuspend] = React.useState<Tenant | null>(null);
  const [suspendReason, setSuspendReason] = React.useState("Suspended by admin");

  const loadTenants = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await tenantsService.getAll();
      if (res.success && res.data) {
        setTenants(res.data);
      } else {
        setTenants([]);
        setError(res.error || "فشل تحميل الشركات");
      }
    } catch (e) {
      setTenants([]);
      setError(e instanceof Error ? e.message : "فشل تحميل الشركات");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadTenants();
        if (!mounted) return;
      } catch (e) {
        if (!mounted) return;
        setTenants([]);
        setError(e instanceof Error ? e.message : "فشل تحميل الشركات");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [loadTenants]);

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
        toast.error(res.error || "تعذر حذف الشركة");
        return;
      }
      toast.success("تم حذف الشركة");
      await loadTenants();
    } finally {
      setBusy(null);
    }
  }

  async function handleSuspendTenant(tenant: Tenant) {
    setTenantToSuspend(tenant);
    setSuspendReason("Suspended by admin");
  }

  async function confirmSuspendTenant() {
    if (!tenantToSuspend) return;
    const tenant = tenantToSuspend;
    setTenantToSuspend(null);
    setBusy({ id: tenant.id, action: "suspend" });
    try {
      const res = await tenantsService.suspend(tenant.id, suspendReason.trim() || "Suspended by admin");
      if (!res.success) {
        toast.error(res.error || "تعذر إيقاف الشركة");
        return;
      }
      toast.success("تم إيقاف الشركة");
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
        toast.error(res.error || "تعذر تفعيل الشركة");
        return;
      }
      toast.success("تم تفعيل الشركة");
      await loadTenants();
    } finally {
      setBusy(null);
    }
  }

  if (isLoading) {
    return (
      <TableSkeleton rows={7} columns={8} />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <AlertCircle className="mb-3 h-10 w-10 text-destructive" />
        <p className="font-medium">تعذر تحميل الشركات</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">لا توجد شركات</h3>
        <p className="text-muted-foreground">لم يتم العثور على أي شركات لعرضها</p>
      </div>
    );
  }

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>الشركة</TableHead>
          <TableHead>الـ Slug</TableHead>
          <TableHead>الحالة</TableHead>
          <TableHead>الباقة</TableHead>
          <TableHead className="text-center">المستخدمين</TableHead>
          <TableHead className="text-center">الموظفين</TableHead>
          <TableHead>تاريخ الإنشاء</TableHead>
          <TableHead className="w-[70px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tenants.map((tenant) => (
          <TableRow key={tenant.id}>
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
                const meta = getStatusMeta(String((tenant as any)?.status ?? "unknown"));
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
                {planLabels[String((tenant as any)?.plan ?? "").toLowerCase()] ?? String((tenant as any)?.plan ?? "—")}
              </Badge>
            </TableCell>
            <TableCell className="text-center">{tenant.usersCount}</TableCell>
            <TableCell className="text-center">{tenant.employeesCount}</TableCell>
            <TableCell>
              {new Date(tenant.createdAt).toLocaleDateString("ar-SA")}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">فتح القائمة</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/super-admin/tenants/${tenant.id}`}>
                      <Eye className="me-2 h-4 w-4" />
                      عرض التفاصيل
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/super-admin/tenants/${tenant.id}/settings`}>
                      <Settings className="me-2 h-4 w-4" />
                      الإعدادات
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a
                      href={buildTenantUrl(tenant.slug, "/dashboard")}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="me-2 h-4 w-4" />
                      فتح لوحة الشركة
                    </a>
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
                        <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />جارٍ الإيقاف...</span>
                      ) : (
                        "إيقاف الشركة"
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
                        <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />جارٍ التفعيل...</span>
                      ) : (
                        "تفعيل الشركة"
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
                      <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />جارٍ الحذف...</span>
                    ) : (
                      "حذف الشركة"
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>

    {/* Delete Confirmation */}
    <AlertDialog open={tenantToDelete !== null} onOpenChange={(open) => !open && setTenantToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>تأكيد حذف الشركة</AlertDialogTitle>
          <AlertDialogDescription>
            هل أنت متأكد من حذف الشركة &quot;{tenantToDelete?.nameAr}&quot;؟ سيتم إلغاؤها (Soft delete).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => void confirmDeleteTenant()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            حذف
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Suspend Dialog with reason input */}
    <Dialog open={tenantToSuspend !== null} onOpenChange={(open) => !open && setTenantToSuspend(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إيقاف الشركة</DialogTitle>
          <DialogDescription>
            سيتم منع المستخدمين من الدخول حتى يتم تفعيل الشركة مرة أخرى.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="suspend-reason">سبب الإيقاف (اختياري)</Label>
          <Input
            id="suspend-reason"
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder="مثال: فواتير متأخرة"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setTenantToSuspend(null)}>إلغاء</Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700"
            onClick={() => void confirmSuspendTenant()}
          >
            تأكيد الإيقاف
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
