"use client";

import * as React from "react";
import {
  IconPlus,
  IconSearch,
  IconFilter,
  IconClock,
  IconCheck,
  IconX,
  IconCurrencyRiyal,
  IconUsers,
  IconFileInvoice,
  IconDownload,
  IconSend,
  IconPlayerPlay,
  IconAlertCircle,
  IconChevronDown,
  IconCalendar,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  type PayrollPeriod,
  type PayrollPeriodStatus,
  payrollPeriodStatusLabels,
  formatCurrency,
  getMonthName,
} from "@/lib/types/payroll";
import { downloadBlob, fetchBlobOrThrow } from "@/lib/browser/download";
import { toast } from "sonner";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function PayrollProcessingManager() {
  const locale = useClientLocale();
  const t = getText(locale);
  const [periods, setPeriods] = React.useState<PayrollPeriod[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<PayrollPeriodStatus | "all">("all");
  const [yearFilter, setYearFilter] = React.useState<string>("2024");
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [selectedPeriod, setSelectedPeriod] = React.useState<PayrollPeriod | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processProgress, setProcessProgress] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // Create form state
  const [formYear, setFormYear] = React.useState(new Date().getFullYear().toString());
  const [formMonth, setFormMonth] = React.useState((new Date().getMonth() + 1).toString());
  const [formPaymentDate, setFormPaymentDate] = React.useState("");

  const loadPeriods = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const params = new URLSearchParams();
      if (yearFilter) params.set("year", yearFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/payroll/periods?${params.toString()}`, { cache: "no-store" });
      const json = (await res.json()) as { data?: any[]; error?: string };
      if (!res.ok) {
        throw new Error(json.error || t.payroll.loadFailed);
      }

      const mapped: PayrollPeriod[] = Array.isArray(json.data)
        ? json.data.map((p: any) => ({
            id: String(p.id),
            tenantId: String(p.tenantId ?? ""),
            name: String(p.name ?? ""),
            nameAr: String(p.nameAr ?? ""),
            startDate: String(p.startDate ?? ""),
            endDate: String(p.endDate ?? ""),
            paymentDate: String(p.paymentDate ?? ""),
            status: String(p.status ?? "draft") as PayrollPeriodStatus,
            totalGross: Number(p.totalGross ?? 0),
            totalDeductions: Number(p.totalDeductions ?? 0),
            totalNet: Number(p.totalNet ?? 0),
            employeeCount: Number(p.employeeCount ?? 0),
            processedBy: p.processedById ?? undefined,
            processedAt: p.processedAt ?? undefined,
            notes: p.notes ?? undefined,
            createdAt: p.createdAt ?? new Date().toISOString(),
            updatedAt: p.updatedAt ?? new Date().toISOString(),
          }))
        : [];

      setPeriods(mapped);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : t.payroll.loadFailed);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, yearFilter, t.payroll.loadFailed]);

  React.useEffect(() => {
    void loadPeriods();
  }, [loadPeriods]);

  const filteredPeriods = periods.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nameAr.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesYear = !yearFilter || p.startDate.startsWith(yearFilter);
    return matchesSearch && matchesStatus && matchesYear;
  });

  const stats = {
    total: periods.length,
    draft: periods.filter((p) => p.status === "draft").length,
    pending: periods.filter((p) => p.status === "pending_approval").length,
    paid: periods.filter((p) => p.status === "paid").length,
    totalPaid: periods
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.totalNet, 0),
  };

  const handleCreatePeriod = async () => {
    const year = parseInt(formYear);
    const month = parseInt(formMonth);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    try {
      const res = await fetch("/api/payroll/periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${getMonthName(month, "en")} ${year}`,
          nameAr: `${getMonthName(month, "ar")} ${year}`,
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          paymentDate: formPaymentDate || endDate.toISOString().split("T")[0],
        }),
      });

      const json = (await res.json()) as { data?: any; error?: string };
      if (!res.ok) {
        throw new Error(json.error || t.payroll.createFailed);
      }

      toast.success(t.payroll.createdSuccess);
      setIsCreateOpen(false);
      setFormPaymentDate("");
      await loadPeriods();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.payroll.createFailed);
    }
  };

  const handleProcessPeriod = async (periodId: string) => {
    setIsProcessing(true);
    setProcessProgress(20);

    try {
      const res = await fetch(`/api/payroll/periods/${encodeURIComponent(periodId)}/process`, {
        method: "POST",
      });
      const json = (await res.json()) as { data?: any; error?: string };
      if (!res.ok) {
        throw new Error(json.error || t.payroll.processFailed);
      }

      setProcessProgress(100);
      toast.success(t.payroll.processedSuccess);
      await loadPeriods();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.payroll.processFailed);
    } finally {
      setIsProcessing(false);
      setProcessProgress(0);
    }
  };

  const handleStatusChange = async (periodId: string, newStatus: PayrollPeriodStatus) => {
    try {
      const res = await fetch(`/api/payroll/periods/${encodeURIComponent(periodId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = (await res.json()) as { data?: any; error?: string };
      if (!res.ok) {
        throw new Error(json.error || t.payroll.statusUpdateFailed);
      }
      await loadPeriods();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.payroll.statusUpdateFailed);
    }
  };

  const handleSendPayslips = async (periodId: string) => {
    try {
      const res = await fetch(`/api/payroll/periods/${encodeURIComponent(periodId)}/send-payslips`, {
        method: "POST",
      });
      const json = (await res.json()) as { data?: { sent?: number }; error?: string };
      if (!res.ok) {
        throw new Error(json.error || t.payroll.payslipsSendFailed);
      }

      toast.success(`${t.payroll.sentPayslips} ${json.data?.sent ?? 0} ${t.payroll.payslipUnit}`);
      await loadPeriods();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.payroll.payslipsSendFailed);
    }
  };

  const handleDownloadBankFile = async (period: PayrollPeriod) => {
    try {
      const { blob, filename } = await fetchBlobOrThrow(
        `/api/payroll/periods/${encodeURIComponent(period.id)}/bank-file?format=csv`,
        { cache: "no-store" }
      );
      downloadBlob(blob, filename || `bank-file-${period.id}.csv`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.payroll.bankFileFailed);
    }
  };

  const getStatusBadge = (status: PayrollPeriodStatus) => {
    const info = payrollPeriodStatusLabels[status];
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      processing: "outline",
      pending_approval: "outline",
      approved: "default",
      paid: "default",
      cancelled: "destructive",
    };
    return (
      <Badge variant={variants[status] || "secondary"} className={
        status === "paid" ? "bg-emerald-500" :
        status === "approved" ? "bg-green-500" :
        status === "pending_approval" ? "bg-yellow-500 text-yellow-900" :
        status === "processing" ? "bg-blue-500" :
        ""
      }>
        {info.ar}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.payroll.totalPeriods}</CardTitle>
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.jobOffers.drafts}</CardTitle>
            <IconFileInvoice className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.documents.pendingApproval}</CardTitle>
            <IconClock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.payroll.paid}</CardTitle>
            <IconCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.paid}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.payroll.totalPaid}</CardTitle>
            <IconCurrencyRiyal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(stats.totalPaid)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t.common.searchDots}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9"
            />
          </div>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder={t.common.year} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as PayrollPeriodStatus | "all")}
          >
            <SelectTrigger className="w-[160px]">
              <IconFilter className="h-4 w-4 ms-2" />
              <SelectValue placeholder={t.common.status} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.attendance.allStatuses}</SelectItem>
              {Object.entries(payrollPeriodStatusLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label.ar}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="ms-2 h-4 w-4" />
              {t.payroll.pNewPeriod}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.payroll.createNewPeriod}</DialogTitle>
              <DialogDescription>
                {t.payroll.pSelectMonthAndYearToCreateANew}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.common.year}</Label>
                  <Select value={formYear} onValueChange={setFormYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t.common.month}</Label>
                  <Select value={formMonth} onValueChange={setFormMonth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {getMonthName(i + 1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t.payroll.paymentDate}</Label>
                <Input
                  type="date"
                  value={formPaymentDate}
                  onChange={(e) => setFormPaymentDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>{t.common.cancel}</Button>
              <Button onClick={handleCreatePeriod}>{t.common.add}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Processing Progress */}
      {isProcessing && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <IconClock className="h-5 w-5 animate-spin text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">{t.payroll.processingPayroll}</p>
                <Progress value={processProgress} className="mt-2" />
              </div>
              <span className="text-sm text-muted-foreground">{processProgress}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Periods Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t.payroll.title}</CardTitle>
          <CardDescription>
            {t.payroll.pManageAndProcessMonthlyPayroll}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.leaveRequests.period}</TableHead>
                <TableHead>{t.payroll.paymentDate}</TableHead>
                <TableHead>{t.common.employees}</TableHead>
                <TableHead>{t.common.total}</TableHead>
                <TableHead>{t.payroll.deductionsCol}</TableHead>
                <TableHead>{t.payroll.netCol}</TableHead>
                <TableHead>{t.common.status}</TableHead>
                <TableHead className="text-start">{t.common.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPeriods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <IconFileInvoice className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">{t.payroll.noPayrollPeriods}</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPeriods.map((period) => (
                  <TableRow key={period.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{period.nameAr}</p>
                        <p className="text-xs text-muted-foreground">
                          {period.startDate} - {period.endDate}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{period.paymentDate}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <IconUsers className="h-4 w-4 text-muted-foreground" />
                        {period.employeeCount}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(period.totalGross)}</TableCell>
                    <TableCell className="text-red-600">
                      -{formatCurrency(period.totalDeductions)}
                    </TableCell>
                    <TableCell className="font-bold">
                      {formatCurrency(period.totalNet)}
                    </TableCell>
                    <TableCell>{getStatusBadge(period.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {t.payroll.pActions}
                            <IconChevronDown className="h-4 w-4 me-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {period.status === "draft" && (
                            <DropdownMenuItem
                              onClick={() => handleProcessPeriod(period.id)}
                              disabled={isProcessing}
                            >
                              <IconPlayerPlay className="h-4 w-4 ms-2" />
                              {t.payroll.pProcessPayroll}
                            </DropdownMenuItem>
                          )}
                          {period.status === "pending_approval" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(period.id, "approved")}
                              >
                                <IconCheck className="h-4 w-4 ms-2 text-green-500" />{t.common.accept}</DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(period.id, "draft")}
                              >
                                <IconX className="h-4 w-4 ms-2 text-red-500" />
                                {t.payroll.pReturnForEditing}
                              </DropdownMenuItem>
                            </>
                          )}
                          {period.status === "approved" && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(period.id, "paid")}
                            >
                              <IconCurrencyRiyal className="h-4 w-4 ms-2" />
                              {t.payroll.pConfirmPayment}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setSelectedPeriod(period)}
                          >
                            <IconFileInvoice className="h-4 w-4 ms-2" />{t.common.viewDetails}</DropdownMenuItem>
                          {period.status === "paid" && (
                            <>
                              <DropdownMenuItem onClick={() => handleSendPayslips(period.id)}>
                                <IconSend className="h-4 w-4 ms-2" />
                                {t.payroll.pSendPayslips}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadBankFile(period)}>
                                <IconDownload className="h-4 w-4 ms-2" />
                                {t.payroll.pDownloadBankFile}
                              </DropdownMenuItem>
                            </>
                          )}
                          {(period.status === "draft" || period.status === "pending_approval") && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleStatusChange(period.id, "cancelled")}
                              >
                                <IconX className="h-4 w-4 ms-2" />{t.common.cancel}</DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Period Details Dialog */}
      <Dialog open={!!selectedPeriod} onOpenChange={() => setSelectedPeriod(null)}>
        <DialogContent className="w-full sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t.payroll.payrollDetails}</DialogTitle>
            <DialogDescription>{selectedPeriod?.nameAr}</DialogDescription>
          </DialogHeader>
          {selectedPeriod && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">{t.payroll.payrollPeriod}</p>
                  <p className="font-medium">
                    {selectedPeriod.startDate} - {selectedPeriod.endDate}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">{t.payroll.paymentDate}</p>
                  <p className="font-medium">{selectedPeriod.paymentDate}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">{t.payroll.payrollSummary}</h4>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>{t.common.employees}</TableCell>
                      <TableCell className="text-start">{selectedPeriod.employeeCount}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>{t.salaryStructures.totalSalaries}</TableCell>
                      <TableCell className="text-start">
                        {formatCurrency(selectedPeriod.totalGross)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>{t.payroll.totalDeductions}</TableCell>
                      <TableCell className="text-start text-red-600">
                        -{formatCurrency(selectedPeriod.totalDeductions)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="font-bold">
                      <TableCell>{t.salaryStructures.netSalaries}</TableCell>
                      <TableCell className="text-start text-green-600">
                        {formatCurrency(selectedPeriod.totalNet)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {selectedPeriod.processedAt && (
                <div className="text-sm text-muted-foreground">
                  <p>{t.payroll.processedAt} {new Date(selectedPeriod.processedAt).toLocaleDateString("ar-SA")}</p>
                  {selectedPeriod.approvedAt && (
                    <p>{t.payroll.approvedAt} {new Date(selectedPeriod.approvedAt).toLocaleDateString("ar-SA")}</p>
                  )}
                  {selectedPeriod.paidAt && (
                    <p>{t.payroll.paidAt} {new Date(selectedPeriod.paidAt).toLocaleDateString("ar-SA")}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
