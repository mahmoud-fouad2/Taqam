"use client";

import * as React from "react";
import {
  IconSearch,
  IconFilter,
  IconDownload,
  IconSend,
  IconEye,
  IconPrinter,
  IconMail,
  IconCurrencyRiyal,
  IconUser,
  IconBuilding,
  IconCalendar,
  IconFileInvoice,
} from "@tabler/icons-react";
import { toast } from "sonner";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { downloadBlob, fetchBlobOrThrow, openBlob } from "@/lib/browser/download";
import {
  type Payslip,
  type PayslipStatus,
  formatCurrency,
  type PayrollPeriod,
} from "@/lib/types/payroll";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error || "Request failed");
  }
  return json as T;
}

export function PayslipsManager() {
  const [periods, setPeriods] = React.useState<PayrollPeriod[]>([]);
  const [payslips, setPayslips] = React.useState<Payslip[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [periodFilter, setPeriodFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<PayslipStatus | "all">("all");
  const [selectedPayslip, setSelectedPayslip] = React.useState<Payslip | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSendingAll, setIsSendingAll] = React.useState(false);

  const loadPeriods = React.useCallback(async () => {
    const year = new Date().getFullYear();
    const { data } = await fetchJson<{ data: PayrollPeriod[] }>(`/api/payroll/periods?year=${year}`);
    setPeriods(data);
    if (!periodFilter && data.length > 0) {
      setPeriodFilter(data[0].id);
    }
  }, [periodFilter]);

  const loadPayslips = React.useCallback(async (periodId: string) => {
    if (!periodId) return;
    setIsLoading(true);
    try {
      const { data } = await fetchJson<{ data: { payslips: Payslip[] } }>(
        `/api/payroll/payslips?periodId=${encodeURIComponent(periodId)}`
      );
      setPayslips(data.payslips);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPeriods().catch((e) => {
      console.error(e);
      toast.error(e?.message || "فشل تحميل فترات الرواتب");
    });
  }, [loadPeriods]);

  React.useEffect(() => {
    if (!periodFilter) return;
    loadPayslips(periodFilter).catch((e) => {
      console.error(e);
      toast.error(e?.message || "فشل تحميل قسائم الرواتب");
    });
  }, [periodFilter, loadPayslips]);

  const filteredPayslips = payslips.filter((p) => {
    const matchesSearch =
      p.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.employeeNameAr.includes(searchQuery) ||
      p.employeeNumber.includes(searchQuery);
    const matchesPeriod = !periodFilter || p.payrollPeriodId === periodFilter;
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesPeriod && matchesStatus;
  });

  const stats = {
    total: payslips.length,
    sent: payslips.filter((p) => p.status === "sent").length,
    viewed: payslips.filter((p) => p.status === "viewed").length,
    totalNet: payslips.reduce((sum, p) => sum + p.netSalary, 0),
  };

  const handleSendPayslip = async (payslipId: string) => {
    try {
      await fetchJson(`/api/payroll/payslips/${encodeURIComponent(payslipId)}/send`, {
        method: "POST",
      });
      toast.success("تم إرسال القسيمة");
      await loadPayslips(periodFilter);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "فشل إرسال القسيمة");
    }
  };

  const handleSendAll = async () => {
    if (!periodFilter) return;
    setIsSendingAll(true);
    try {
      await fetchJson("/api/payroll/payslips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodId: periodFilter }),
      });
      toast.success("تم إرسال جميع القسائم");
      await loadPayslips(periodFilter);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "فشل إرسال جميع القسائم");
    } finally {
      setIsSendingAll(false);
    }
  };

  const handleDownloadPayslip = async (payslipId: string) => {
    try {
      const { blob, filename } = await fetchBlobOrThrow(
        `/api/payroll/payslips/${encodeURIComponent(payslipId)}/download`,
        { cache: "no-store" }
      );
      downloadBlob(blob, filename || `payslip-${payslipId}.html`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "فشل تحميل القسيمة");
    }
  };

  const handlePrintPayslip = async (payslipId: string) => {
    try {
      const { blob } = await fetchBlobOrThrow(
        `/api/payroll/payslips/${encodeURIComponent(payslipId)}/download`,
        { cache: "no-store" }
      );
      openBlob(blob);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "فشل فتح القسيمة للطباعة");
    }
  };

  const handleExportPayslips = () => {
    const headers = ["الرقم الوظيفي", "الموظف", "القسم", "الإجمالي", "الخصومات", "الصافي", "الحالة"];
    const rows = filteredPayslips.map((payslip) => [
      payslip.employeeNumber,
      payslip.employeeNameAr,
      payslip.departmentAr,
      payslip.totalEarnings,
      payslip.totalDeductions,
      payslip.netSalary,
      payslip.status,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    downloadBlob(
      new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8" }),
      `payslips-${currentPeriod?.name || currentPeriod?.id || "export"}.csv`
    );
  };

  const getStatusBadge = (status: PayslipStatus) => {
    const labels: Record<PayslipStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
      draft: { label: "مسودة", variant: "secondary" },
      generated: { label: "تم الإنشاء", variant: "outline" },
      sent: { label: "تم الإرسال", variant: "default" },
      viewed: { label: "تم الاطلاع", variant: "default" },
    };

    const meta = (labels as Record<string, { label: string; variant: "default" | "secondary" | "outline" }>)[status] ?? {
      label: String(status ?? "غير معروف"),
      variant: "outline" as const,
    };

    return <Badge variant={meta.variant}>{meta.label}</Badge>;
  };

  const currentPeriod = periods.find((p) => p.id === periodFilter);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي القسائم</CardTitle>
            <IconFileInvoice className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تم إرسالها</CardTitle>
            <IconMail className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تم الاطلاع</CardTitle>
            <IconEye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.viewed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الصافي</CardTitle>
            <IconCurrencyRiyal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(stats.totalNet)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الرقم الوظيفي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9"
            />
          </div>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[180px]">
              <IconCalendar className="h-4 w-4 ms-2" />
              <SelectValue placeholder="الفترة" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.id} value={period.id}>
                  {period.nameAr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as PayslipStatus | "all")}
          >
            <SelectTrigger className="w-[140px]">
              <IconFilter className="h-4 w-4 ms-2" />
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="generated">تم الإنشاء</SelectItem>
              <SelectItem value="sent">تم الإرسال</SelectItem>
              <SelectItem value="viewed">تم الاطلاع</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSendAll} disabled={!periodFilter || isSendingAll}>
            <IconSend className="ms-2 h-4 w-4" />
            إرسال الكل
          </Button>
          <Button variant="outline" onClick={handleExportPayslips} disabled={filteredPayslips.length === 0}>
            <IconDownload className="ms-2 h-4 w-4" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Current Period Info */}
      {currentPeriod && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الفترة الحالية</p>
                <p className="font-semibold">{currentPeriod.nameAr}</p>
              </div>
              <div className="text-start">
                <p className="text-sm text-muted-foreground">تاريخ الصرف</p>
                <p className="font-semibold">{currentPeriod.paymentDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payslips Table */}
      <Card>
        <CardHeader>
          <CardTitle>قسائم الرواتب</CardTitle>
          <CardDescription>قائمة بجميع قسائم الرواتب للفترة المحددة</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الموظف</TableHead>
                <TableHead>القسم</TableHead>
                <TableHead>الإجمالي</TableHead>
                <TableHead>الخصومات</TableHead>
                <TableHead>الصافي</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-start">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">جاري التحميل...</p>
                  </TableCell>
                </TableRow>
              ) : filteredPayslips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <IconFileInvoice className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">لا توجد قسائم</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <IconUser className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{payslip.employeeNameAr}</p>
                          <p className="text-xs text-muted-foreground">
                            {payslip.employeeNumber}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <IconBuilding className="h-4 w-4 text-muted-foreground" />
                        <span>{payslip.departmentAr}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(payslip.totalEarnings)}</TableCell>
                    <TableCell className="text-red-600">
                      -{formatCurrency(payslip.totalDeductions)}
                    </TableCell>
                    <TableCell className="font-bold text-green-600">
                      {formatCurrency(payslip.netSalary)}
                    </TableCell>
                    <TableCell>{getStatusBadge(payslip.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" aria-label="عرض" onClick={() => setSelectedPayslip(payslip)}>
                          <IconEye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="تحميل" onClick={() => handleDownloadPayslip(payslip.id)}>
                          <IconDownload className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="طباعة" onClick={() => handlePrintPayslip(payslip.id)}>
                          <IconPrinter className="h-4 w-4" />
                        </Button>
                        {payslip.status !== "sent" && payslip.status !== "viewed" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="إرسال"
                            onClick={() => handleSendPayslip(payslip.id)}
                          >
                            <IconSend className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payslip Preview Dialog */}
      <Dialog open={!!selectedPayslip} onOpenChange={() => setSelectedPayslip(null)}>
        <DialogContent className="w-full sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>قسيمة الراتب</DialogTitle>
          </DialogHeader>
          {selectedPayslip && (
            <div className="space-y-6 p-4 border rounded-lg">
              {/* Header */}
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold">قسيمة راتب</h2>
                <p className="text-muted-foreground">{currentPeriod?.nameAr}</p>
              </div>

              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">اسم الموظف</p>
                  <p className="font-medium">{selectedPayslip.employeeNameAr}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">الرقم الوظيفي</p>
                  <p className="font-medium">{selectedPayslip.employeeNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">القسم</p>
                  <p className="font-medium">{selectedPayslip.departmentAr}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">المسمى الوظيفي</p>
                  <p className="font-medium">{selectedPayslip.jobTitleAr}</p>
                </div>
              </div>

              <Separator />

              {/* Earnings */}
              <div>
                <h3 className="font-semibold mb-2">الاستحقاقات</h3>
                <Table>
                  <TableBody>
                    {selectedPayslip.earnings.map((earning, index) => (
                      <TableRow key={index}>
                        <TableCell>{earning.nameAr}</TableCell>
                        <TableCell className="text-start">
                          {formatCurrency(earning.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-muted">
                      <TableCell>إجمالي الاستحقاقات</TableCell>
                      <TableCell className="text-start">
                        {formatCurrency(selectedPayslip.totalEarnings)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Deductions */}
              <div>
                <h3 className="font-semibold mb-2">الخصومات</h3>
                <Table>
                  <TableBody>
                    {selectedPayslip.deductions.map((deduction, index) => (
                      <TableRow key={index}>
                        <TableCell>{deduction.nameAr}</TableCell>
                        <TableCell className="text-start text-red-600">
                          -{formatCurrency(deduction.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-muted">
                      <TableCell>إجمالي الخصومات</TableCell>
                      <TableCell className="text-start text-red-600">
                        -{formatCurrency(selectedPayslip.totalDeductions)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <Separator />

              {/* Net Salary */}
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <span className="text-lg font-bold">صافي الراتب</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(selectedPayslip.netSalary)}
                </span>
              </div>

              {/* Attendance Summary */}
              <div className="grid grid-cols-4 gap-4 text-center text-sm">
                <div className="p-2 bg-muted rounded">
                  <p className="text-muted-foreground">أيام العمل</p>
                  <p className="font-bold">{selectedPayslip.workingDays}</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="text-muted-foreground">أيام الحضور</p>
                  <p className="font-bold">{selectedPayslip.actualWorkDays}</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="text-muted-foreground">أيام الغياب</p>
                  <p className="font-bold text-red-600">{selectedPayslip.absentDays}</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="text-muted-foreground">ساعات إضافية</p>
                  <p className="font-bold text-blue-600">{selectedPayslip.overtimeHours}</p>
                </div>
              </div>

              {/* Bank Info */}
              <div className="text-sm text-muted-foreground">
                <p>طريقة الدفع: تحويل بنكي</p>
                <p>البنك: {selectedPayslip.bankName}</p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handlePrintPayslip(selectedPayslip.id)}>
                  <IconPrinter className="ms-2 h-4 w-4" />
                  طباعة
                </Button>
                <Button variant="outline" onClick={() => handleDownloadPayslip(selectedPayslip.id)}>
                  <IconDownload className="ms-2 h-4 w-4" />
                  تحميل PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
