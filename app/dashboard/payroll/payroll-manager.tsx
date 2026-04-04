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

export function PayrollProcessingManager() {
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
        throw new Error(json.error || "فشل تحميل فترات الرواتب");
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
      setLoadError(err instanceof Error ? err.message : "فشل تحميل فترات الرواتب");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, yearFilter]);

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
        throw new Error(json.error || "فشل إنشاء فترة الرواتب");
      }

      toast.success("تم إنشاء فترة الرواتب");
      setIsCreateOpen(false);
      setFormPaymentDate("");
      await loadPeriods();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل إنشاء فترة الرواتب");
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
        throw new Error(json.error || "فشل معالجة فترة الرواتب");
      }

      setProcessProgress(100);
      toast.success("تمت معالجة فترة الرواتب وإرسالها للموافقة");
      await loadPeriods();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل معالجة فترة الرواتب");
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
        throw new Error(json.error || "فشل تحديث حالة الفترة");
      }
      await loadPeriods();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل تحديث حالة الفترة");
    }
  };

  const handleSendPayslips = async (periodId: string) => {
    try {
      const res = await fetch(`/api/payroll/periods/${encodeURIComponent(periodId)}/send-payslips`, {
        method: "POST",
      });
      const json = (await res.json()) as { data?: { sent?: number }; error?: string };
      if (!res.ok) {
        throw new Error(json.error || "فشل إرسال قسائم الرواتب");
      }

      toast.success(`تم إرسال ${json.data?.sent ?? 0} قسيمة راتب`);
      await loadPeriods();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل إرسال قسائم الرواتب");
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
      toast.error(err instanceof Error ? err.message : "فشل تحميل ملف البنك");
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
            <CardTitle className="text-sm font-medium">إجمالي الفترات</CardTitle>
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مسودات</CardTitle>
            <IconFileInvoice className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">بانتظار الموافقة</CardTitle>
            <IconClock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مدفوعة</CardTitle>
            <IconCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.paid}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المدفوع</CardTitle>
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
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9"
            />
          </div>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="السنة" />
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
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
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
              فترة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء فترة رواتب جديدة</DialogTitle>
              <DialogDescription>
                حدد الشهر والسنة لإنشاء مسير رواتب جديد
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>السنة</Label>
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
                  <Label>الشهر</Label>
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
                <Label>تاريخ الصرف</Label>
                <Input
                  type="date"
                  value={formPaymentDate}
                  onChange={(e) => setFormPaymentDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreatePeriod}>إنشاء</Button>
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
                <p className="text-sm font-medium">جاري معالجة مسير الرواتب...</p>
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
          <CardTitle>فترات الرواتب</CardTitle>
          <CardDescription>
            إدارة ومعالجة مسيرات الرواتب الشهرية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الفترة</TableHead>
                <TableHead>تاريخ الصرف</TableHead>
                <TableHead>الموظفين</TableHead>
                <TableHead>الإجمالي</TableHead>
                <TableHead>الخصومات</TableHead>
                <TableHead>الصافي</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-start">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPeriods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <IconFileInvoice className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">لا توجد فترات رواتب</p>
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
                            إجراءات
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
                              معالجة المسير
                            </DropdownMenuItem>
                          )}
                          {period.status === "pending_approval" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(period.id, "approved")}
                              >
                                <IconCheck className="h-4 w-4 ms-2 text-green-500" />
                                موافقة
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(period.id, "draft")}
                              >
                                <IconX className="h-4 w-4 ms-2 text-red-500" />
                                إرجاع للتعديل
                              </DropdownMenuItem>
                            </>
                          )}
                          {period.status === "approved" && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(period.id, "paid")}
                            >
                              <IconCurrencyRiyal className="h-4 w-4 ms-2" />
                              تأكيد الصرف
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setSelectedPeriod(period)}
                          >
                            <IconFileInvoice className="h-4 w-4 ms-2" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          {period.status === "paid" && (
                            <>
                              <DropdownMenuItem onClick={() => handleSendPayslips(period.id)}>
                                <IconSend className="h-4 w-4 ms-2" />
                                إرسال قسائم الرواتب
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadBankFile(period)}>
                                <IconDownload className="h-4 w-4 ms-2" />
                                تحميل ملف البنك
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
                                <IconX className="h-4 w-4 ms-2" />
                                إلغاء
                              </DropdownMenuItem>
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
            <DialogTitle>تفاصيل مسير الرواتب</DialogTitle>
            <DialogDescription>{selectedPeriod?.nameAr}</DialogDescription>
          </DialogHeader>
          {selectedPeriod && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">فترة المسير</p>
                  <p className="font-medium">
                    {selectedPeriod.startDate} - {selectedPeriod.endDate}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">تاريخ الصرف</p>
                  <p className="font-medium">{selectedPeriod.paymentDate}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">ملخص المسير</h4>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>عدد الموظفين</TableCell>
                      <TableCell className="text-start">{selectedPeriod.employeeCount}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>إجمالي الرواتب</TableCell>
                      <TableCell className="text-start">
                        {formatCurrency(selectedPeriod.totalGross)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>إجمالي الخصومات</TableCell>
                      <TableCell className="text-start text-red-600">
                        -{formatCurrency(selectedPeriod.totalDeductions)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="font-bold">
                      <TableCell>صافي الرواتب</TableCell>
                      <TableCell className="text-start text-green-600">
                        {formatCurrency(selectedPeriod.totalNet)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {selectedPeriod.processedAt && (
                <div className="text-sm text-muted-foreground">
                  <p>تمت المعالجة: {new Date(selectedPeriod.processedAt).toLocaleDateString("ar-SA")}</p>
                  {selectedPeriod.approvedAt && (
                    <p>تمت الموافقة: {new Date(selectedPeriod.approvedAt).toLocaleDateString("ar-SA")}</p>
                  )}
                  {selectedPeriod.paidAt && (
                    <p>تم الصرف: {new Date(selectedPeriod.paidAt).toLocaleDateString("ar-SA")}</p>
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
