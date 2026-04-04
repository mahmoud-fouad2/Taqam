"use client";

/**
 * Requests Table
 * جدول طلبات الاشتراك
 */

import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";
import { 
  MoreHorizontal, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Mail,
  Phone,
  Building2,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { SubscriptionRequest } from "@/lib/types/tenant";
import { tenantsService } from "@/lib/api";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";

const statusConfig: Record<SubscriptionRequest["status"], { label: string; variant: "default" | "secondary" | "destructive"; icon: React.ReactNode }> = {
  pending: { 
    label: "معلقة", 
    variant: "secondary",
    icon: <Clock className="h-3 w-3" />
  },
  approved: { 
    label: "مقبولة", 
    variant: "default",
    icon: <CheckCircle2 className="h-3 w-3" />
  },
  rejected: { 
    label: "مرفوضة", 
    variant: "destructive",
    icon: <XCircle className="h-3 w-3" />
  },
};

function getStatusMeta(status: unknown) {
  const key = String(status ?? "pending") as SubscriptionRequest["status"];
  const meta = (statusConfig as Record<string, any>)[key];
  return (
    meta ?? {
      label: String(status ?? "—"),
      variant: "secondary" as const,
      icon: <Clock className="h-3 w-3" />,
    }
  );
}

export function RequestsTable() {
  const [requests, setRequests] = React.useState<SubscriptionRequest[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actingId, setActingId] = React.useState<string | null>(null);
  const [rejectingId, setRejectingId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await tenantsService.getRequests();
        if (!mounted) return;
        if (res.success && res.data) {
          setRequests(res.data);
        } else {
          setRequests([]);
          setError(res.error || "فشل تحميل الطلبات");
        }
      } catch (e) {
        if (!mounted) return;
        setRequests([]);
        setError(e instanceof Error ? e.message : "فشل تحميل الطلبات");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <TableSkeleton rows={7} columns={6} />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <XCircle className="mb-3 h-10 w-10 text-destructive" />
        <p className="font-medium">تعذر تحميل الطلبات</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">لا توجد طلبات</h3>
        <p className="text-muted-foreground">لم يتم استلام أي طلبات اشتراك جديدة</p>
      </div>
    );
  }

  const approve = async (id: string) => {
    setActingId(id);
    try {
      const res = await tenantsService.approveRequest(id, {});
      if (!res.success) {
        toast.error(res.error || "تعذر قبول الطلب");
        return;
      }
      toast.success("تم قبول الطلب");
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر قبول الطلب");
    } finally {
      setActingId(null);
    }
  };

  const reject = (id: string) => {
    setRejectReason("");
    setRejectingId(id);
  };

  const confirmReject = async () => {
    if (!rejectingId) return;
    const id = rejectingId;
    setRejectingId(null);
    setActingId(id);
    try {
      const res = await tenantsService.rejectRequest(id, rejectReason);
      if (!res.success) {
        toast.error(res.error || "تعذر رفض الطلب");
        return;
      }
      toast.success("تم رفض الطلب");
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر رفض الطلب");
    } finally {
      setActingId(null);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
        <TableRow>
          <TableHead>الشركة</TableHead>
          <TableHead>بيانات التواصل</TableHead>
          <TableHead>عدد الموظفين</TableHead>
          <TableHead>الحالة</TableHead>
          <TableHead>تاريخ الطلب</TableHead>
          <TableHead className="w-[100px]">الإجراءات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>
              <div>
                <p className="font-medium">{request.companyNameAr || request.companyName}</p>
                {request.companyNameAr && (
                  <p className="text-sm text-muted-foreground">{request.companyName}</p>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  {request.contactName}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  {request.contactEmail}
                </div>
                {request.contactPhone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {request.contactPhone}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{request.employeesCount || "غير محدد"}</Badge>
            </TableCell>
            <TableCell>
              {(() => {
                const meta = getStatusMeta((request as any)?.status);
                return (
                  <Badge variant={meta.variant} className="gap-1">
                    {meta.icon}
                    {meta.label}
                  </Badge>
                );
              })()}
            </TableCell>
            <TableCell>
              {new Date(request.createdAt).toLocaleDateString("ar-SA")}
            </TableCell>
            <TableCell>
              {request.status === "pending" ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="h-8"
                    disabled={actingId === request.id}
                    onClick={() => approve(request.id)}
                  >
                    <CheckCircle2 className="me-1 h-3 w-3" />
                    قبول
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    disabled={actingId === request.id}
                    onClick={() => reject(request.id)}
                  >
                    <XCircle className="me-1 h-3 w-3" />
                    رفض
                  </Button>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/super-admin/requests/${request.id}`}>عرض التفاصيل</Link>
                    </DropdownMenuItem>
                    {request.status === "approved" && (
                      <DropdownMenuItem>
                        <Building2 className="me-2 h-4 w-4" />
                        عرض الشركة
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>

    <Dialog open={!!rejectingId} onOpenChange={(open) => { if (!open) setRejectingId(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>رفض الطلب</DialogTitle>
          <DialogDescription>يمكنك إدخال سبب الرفض أدناه (اختياري).</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reject-reason">سبب الرفض</Label>
          <Input
            id="reject-reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="سبب الرفض..."
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setRejectingId(null)}>إلغاء</Button>
          <Button variant="destructive" onClick={() => void confirmReject()}>رفض</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
