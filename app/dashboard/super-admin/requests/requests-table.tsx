"use client";

/**
 * Requests Table
 * جدول طلبات الاشتراك
 */

import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";
import { 
  Search,
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
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

type LocaleText = ReturnType<typeof getText>;

function getStatusMeta(status: unknown, t: LocaleText) {
  const statusConfig: Record<
    SubscriptionRequest["status"],
    { label: string; variant: "default" | "secondary" | "destructive"; icon: React.ReactNode }
  > = {
    pending: {
      label: t.common.pending,
      variant: "secondary",
      icon: <Clock className="h-3 w-3" />,
    },
    approved: {
      label: t.common.accepted,
      variant: "default",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    rejected: {
      label: t.common.rejected,
      variant: "destructive",
      icon: <XCircle className="h-3 w-3" />,
    },
  };

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
  const locale = useClientLocale();
  const t = getText(locale);
  const [requests, setRequests] = React.useState<SubscriptionRequest[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actingId, setActingId] = React.useState<string | null>(null);
  const [rejectingId, setRejectingId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<SubscriptionRequest["status"] | "all">("all");
  const [sortBy, setSortBy] = React.useState<"newest" | "oldest" | "employeesDesc" | "employeesAsc">("newest");
  const [density, setDensity] = React.useState<"comfortable" | "compact">("comfortable");

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
          setError(res.error || t.requests.loadingRequests);
        }
      } catch (e) {
        if (!mounted) return;
        setRequests([]);
        setError(e instanceof Error ? e.message : t.requests.loadingRequests);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [t.requests.loadingRequests]);

  const totals = React.useMemo(
    () => ({
      all: requests.length,
      pending: requests.filter((item) => item.status === "pending").length,
      approved: requests.filter((item) => item.status === "approved").length,
      rejected: requests.filter((item) => item.status === "rejected").length,
    }),
    [requests]
  );

  const filteredRequests = React.useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = requests.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchable = [
        item.companyName,
        item.companyNameAr ?? "",
        item.contactName,
        item.contactEmail,
        item.contactPhone ?? "",
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
      if (sortBy === "employeesDesc") {
        return Number(b.employeesCount ?? 0) - Number(a.employeesCount ?? 0);
      }
      return Number(a.employeesCount ?? 0) - Number(b.employeesCount ?? 0);
    });
  }, [requests, searchTerm, statusFilter, sortBy]);

  const searchPlaceholder =
    locale === "ar"
      ? "ابحث باسم الشركة أو البريد أو جهة الاتصال"
      : "Search by company, email, or contact";

  const sortLabels =
    locale === "ar"
      ? {
          newest: "الأحدث أولاً",
          oldest: "الأقدم أولاً",
          employeesDesc: "الأكثر موظفين",
          employeesAsc: "الأقل موظفين",
        }
      : {
          newest: "Newest first",
          oldest: "Oldest first",
          employeesDesc: "Most employees",
          employeesAsc: "Least employees",
        };

  const noFilterResultsText =
    locale === "ar"
      ? "لا توجد نتائج مطابقة للفلاتر الحالية"
      : "No matching results for current filters";

  const dateLocale = locale === "ar" ? "ar-SA" : "en-US";

  if (isLoading) {
    return (
      <TableSkeleton rows={7} columns={6} />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <XCircle className="mb-3 h-10 w-10 text-destructive" />
        <p className="font-medium">{t.superAdmin.pFailedToLoadRequests}</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  const approve = async (id: string) => {
    setActingId(id);
    try {
      const res = await tenantsService.approveRequest(id, {});
      if (!res.success) {
        toast.error(res.error || t.requests.acceptFailed);
        return;
      }
      toast.success(t.requests.approvedSuccess);
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.requests.acceptFailed);
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
        toast.error(res.error || t.requests.rejectFailed);
        return;
      }
      toast.success(t.leaveRequests.rejectedSuccess);
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.requests.rejectFailed);
    } finally {
      setActingId(null);
    }
  };

  return (
    <>
      <div className="space-y-3 border-b p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{t.common.total}: {totals.all}</Badge>
          <Badge variant="secondary">{t.common.pending}: {totals.pending}</Badge>
          <Badge variant="default">{t.common.accepted}: {totals.approved}</Badge>
          <Badge variant="destructive">{t.common.rejected}: {totals.rejected}</Badge>
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
            className="h-9 min-w-44 rounded-md border border-input bg-background px-3 text-sm"
            aria-label={t.common.filterByStatus}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as SubscriptionRequest["status"] | "all")}
          >
            <option value="all">{t.common.allStatuses}</option>
            <option value="pending">{t.common.pending}</option>
            <option value="approved">{t.common.accepted}</option>
            <option value="rejected">{t.common.rejected}</option>
          </select>

          <select
            className="h-9 min-w-44 rounded-md border border-input bg-background px-3 text-sm"
            aria-label={locale === "ar" ? "الترتيب" : "Sort"}
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value as "newest" | "oldest" | "employeesDesc" | "employeesAsc")
            }
          >
            <option value="newest">{sortLabels.newest}</option>
            <option value="oldest">{sortLabels.oldest}</option>
            <option value="employeesDesc">{sortLabels.employeesDesc}</option>
            <option value="employeesAsc">{sortLabels.employeesAsc}</option>
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

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle2 className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">{t.requests.noRequests}</h3>
          <p className="text-muted-foreground">{t.superAdmin.pNoNewSubscriptionRequestsRecei}</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Search className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">{noFilterResultsText}</p>
        </div>
      ) : (
      <Table>
        <TableHeader>
        <TableRow>
          <TableHead>{t.common.company}</TableHead>
          <TableHead>{t.myProfile.contactData}</TableHead>
          <TableHead>{t.common.employees}</TableHead>
          <TableHead>{t.common.status}</TableHead>
          <TableHead>{t.superAdmin.pRequestDate}</TableHead>
          <TableHead className="w-[100px]">{t.common.actions}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredRequests.map((request) => (
          <TableRow key={request.id} className={density === "compact" ? "[&>td]:py-2" : "[&>td]:py-3"}>
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
              <Badge variant="outline">{request.employeesCount ?? t.common.unspecified}</Badge>
            </TableCell>
            <TableCell>
              {(() => {
                const meta = getStatusMeta((request as any)?.status, t);
                return (
                  <Badge variant={meta.variant} className="gap-1">
                    {meta.icon}
                    {meta.label}
                  </Badge>
                );
              })()}
            </TableCell>
            <TableCell>
              {new Date(request.createdAt).toLocaleDateString(dateLocale)}
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
                    {t.superAdmin.pAccept}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    disabled={actingId === request.id}
                    onClick={() => reject(request.id)}
                  >
                    <XCircle className="me-1 h-3 w-3" />{t.common.reject}</Button>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{t.common.actions}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/super-admin/requests/${request.id}`}>{t.common.viewDetails}</Link>
                    </DropdownMenuItem>
                    {request.status === "approved" && (
                      <DropdownMenuItem>
                        <Building2 className="me-2 h-4 w-4" />
                        {t.superAdmin.pViewCompany}
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
      )}

    <Dialog open={!!rejectingId} onOpenChange={(open) => { if (!open) setRejectingId(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.common.reject}</DialogTitle>
          <DialogDescription>{t.common.rejectReasonOptional}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reject-reason">{t.common.reason}</Label>
          <Input
            id="reject-reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t.common.rejectReason}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setRejectingId(null)}>{t.common.cancel}</Button>
          <Button variant="destructive" onClick={() => void confirmReject()}>{t.common.reject}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
