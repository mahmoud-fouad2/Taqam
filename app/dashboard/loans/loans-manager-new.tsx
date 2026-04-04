"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  IconPlus,
  IconSearch,
  IconFilter,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconCurrencyRiyal,
  IconClock,
  IconReceipt,
  IconRefresh,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExportButton } from "@/components/export-button";
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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface Employee {
  id: string;
  employeeNumber: string | null;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
  };
}

interface Loan {
  id: string;
  type: string;
  status: string;
  amount: number;
  installments: number;
  installmentAmount: number;
  remainingAmount: number;
  paidInstallments: number;
  interestRate: number;
  startDate: string | null;
  reason: string | null;
  notes: string | null;
  approvedAt: string | null;
  createdAt: string;
  employee: Employee;
  approvedBy?: { firstName: string; lastName: string } | null;
}

interface Stats {
  total: number;
  pending: number;
  active: number;
  completed: number;
  totalActiveAmount: number;
}

const typeLabels: Record<string, { ar: string; en: string }> = {
  SALARY_ADVANCE: { ar: "سلفة راتب", en: "Salary Advance" },
  PERSONAL_LOAN: { ar: "قرض شخصي", en: "Personal Loan" },
  EMERGENCY_LOAN: { ar: "قرض طوارئ", en: "Emergency Loan" },
  HOUSING_LOAN: { ar: "قرض سكني", en: "Housing Loan" },
  CAR_LOAN: { ar: "قرض سيارة", en: "Car Loan" },
  OTHER: { ar: "أخرى", en: "Other" },
};

const statusLabels: Record<string, { ar: string; en: string }> = {
  PENDING: { ar: "بانتظار الموافقة", en: "Pending" },
  APPROVED: { ar: "تمت الموافقة", en: "Approved" },
  ACTIVE: { ar: "نشط", en: "Active" },
  COMPLETED: { ar: "مكتمل", en: "Completed" },
  REJECTED: { ar: "مرفوض", en: "Rejected" },
  CANCELLED: { ar: "ملغي", en: "Cancelled" },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export function LoansManager() {
  const [loans, setLoans] = React.useState<Loan[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [stats, setStats] = React.useState<Stats>({
    total: 0,
    pending: 0,
    active: 0,
    completed: 0,
    totalActiveAmount: 0,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingLoan, setEditingLoan] = React.useState<Loan | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [loanToDelete, setLoanToDelete] = React.useState<Loan | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form state
  const [formEmployeeId, setFormEmployeeId] = React.useState("");
  const [formType, setFormType] = React.useState("SALARY_ADVANCE");
  const [formAmount, setFormAmount] = React.useState("");
  const [formInstallments, setFormInstallments] = React.useState("");
  const [formStartDate, setFormStartDate] = React.useState("");
  const [formReason, setFormReason] = React.useState("");

  // Fetch loans
  const fetchLoans = React.useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/loans?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setLoans(json.data.loans);
        setStats(json.data.stats);
      }
    } catch (error) {
      toast.error("فشل في تحميل القروض");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  // Fetch employees
  const fetchEmployees = React.useCallback(async () => {
    try {
      const res = await fetch("/api/employees?pageSize=100");
      const json = await res.json();
      if (json.success) {
        setEmployees(
          json.data.employees.map((e: any) => ({
            id: e.id,
            employeeNumber: e.employeeNumber,
            user: {
              firstName: e.user?.firstName || e.firstName || "",
              lastName: e.user?.lastName || e.lastName || "",
              email: e.user?.email || e.email || "",
              avatar: e.user?.avatar || e.avatar || null,
            },
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch employees", error);
    }
  }, []);

  React.useEffect(() => {
    fetchLoans();
    fetchEmployees();
  }, [fetchLoans, fetchEmployees]);

  const resetForm = () => {
    setFormEmployeeId("");
    setFormType("SALARY_ADVANCE");
    setFormAmount("");
    setFormInstallments("");
    setFormStartDate("");
    setFormReason("");
    setEditingLoan(null);
  };

  const handleSubmit = async () => {
    if (!formEmployeeId || !formAmount || !formInstallments) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        employeeId: formEmployeeId,
        type: formType,
        amount: parseFloat(formAmount),
        installments: parseInt(formInstallments),
        startDate: formStartDate || undefined,
        reason: formReason || undefined,
      };

      const url = editingLoan ? `/api/loans/${editingLoan.id}` : "/api/loans";
      const method = editingLoan ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "فشل في حفظ القرض");
      }

      toast.success(editingLoan ? "تم تحديث القرض" : "تم إنشاء طلب القرض");
      setIsFormOpen(false);
      resetForm();
      fetchLoans();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (loanId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/loans/${loanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("فشل في تحديث الحالة");
      }

      toast.success("تم تحديث حالة القرض");
      fetchLoans();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    if (!loanToDelete) return;

    try {
      const res = await fetch(`/api/loans/${loanToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "فشل في حذف القرض");
      }

      toast.success("تم حذف القرض");
      setDeleteDialogOpen(false);
      setLoanToDelete(null);
      fetchLoans();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openEditForm = (loan: Loan) => {
    setEditingLoan(loan);
    setFormEmployeeId(loan.employee.id);
    setFormType(loan.type);
    setFormAmount(loan.amount.toString());
    setFormInstallments(loan.installments.toString());
    setFormStartDate(loan.startDate?.split("T")[0] || "");
    setFormReason(loan.reason || "");
    setIsFormOpen(true);
  };

  const getEmployeeName = (emp: Employee) => {
    return `${emp.user.firstName} ${emp.user.lastName}`.trim() || emp.user.email;
  };

  const getStatusBadge = (status: string) => {
    const label = statusLabels[status]?.ar || status;
    const variants: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-blue-100 text-blue-800",
      ACTIVE: "bg-green-100 text-green-800",
      COMPLETED: "bg-gray-100 text-gray-800",
      REJECTED: "bg-red-100 text-red-800",
      CANCELLED: "bg-gray-100 text-gray-800",
    };
    return <Badge className={variants[status] || ""}>{label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي القروض</CardTitle>
            <IconReceipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قروض نشطة</CardTitle>
            <IconCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
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
            <CardTitle className="text-sm font-medium">المبالغ المتبقية</CardTitle>
            <IconCurrencyRiyal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(stats.totalActiveAmount)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <IconFilter className="h-4 w-4 me-2" />
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              {Object.entries(statusLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label.ar}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ExportButton 
            type="loans" 
            filters={{ status: statusFilter !== "all" ? statusFilter : "" }} 
          />
          <Button variant="outline" size="icon" aria-label="تحديث" onClick={() => fetchLoans()}>
            <IconRefresh className="h-4 w-4" />
          </Button>
        </div>

        <Dialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="h-4 w-4 me-2" />
              طلب قرض جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingLoan ? "تعديل القرض" : "طلب قرض جديد"}</DialogTitle>
              <DialogDescription>أدخل تفاصيل القرض أو السلفة</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>الموظف *</Label>
                <Select value={formEmployeeId} onValueChange={setFormEmployeeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الموظف" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {getEmployeeName(emp)} {emp.employeeNumber && `(${emp.employeeNumber})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>نوع القرض *</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label.ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>المبلغ (ر.س) *</Label>
                  <Input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="10000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>عدد الأقساط *</Label>
                  <Input
                    type="number"
                    value={formInstallments}
                    onChange={(e) => setFormInstallments(e.target.value)}
                    placeholder="12"
                  />
                </div>
              </div>

              {formAmount && formInstallments && parseInt(formInstallments) > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">قيمة القسط الشهري</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(parseFloat(formAmount) / parseInt(formInstallments))}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>تاريخ البدء</Label>
                <Input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>السبب</Label>
                <Textarea
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="سبب طلب القرض..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "جاري الحفظ..." : editingLoan ? "حفظ التعديلات" : "إرسال الطلب"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الموظف</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>الأقساط</TableHead>
                <TableHead>المتبقي</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-[120px]">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    لا توجد قروض
                  </TableCell>
                </TableRow>
              ) : (
                loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={loan.employee.user.avatar || undefined} alt="" />
                          <AvatarFallback>
                            {loan.employee.user.firstName?.[0]}
                            {loan.employee.user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{getEmployeeName(loan.employee)}</div>
                          <div className="text-xs text-muted-foreground">
                            {loan.employee.employeeNumber}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{typeLabels[loan.type]?.ar || loan.type}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(loan.amount)}</TableCell>
                    <TableCell>
                      {loan.paidInstallments}/{loan.installments}
                    </TableCell>
                    <TableCell>{formatCurrency(loan.remainingAmount)}</TableCell>
                    <TableCell>{getStatusBadge(loan.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {loan.status === "PENDING" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="موافقة"
                              className="h-8 w-8 text-green-600"
                              onClick={() => handleStatusChange(loan.id, "ACTIVE")}
                              title="موافقة"
                            >
                              <IconCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="رفض"
                              className="h-8 w-8 text-red-600"
                              onClick={() => handleStatusChange(loan.id, "REJECTED")}
                              title="رفض"
                            >
                              <IconX className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="تعديل"
                          className="h-8 w-8"
                          onClick={() => openEditForm(loan)}
                          disabled={loan.status === "COMPLETED"}
                        >
                          <IconEdit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="حذف"
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            setLoanToDelete(loan);
                            setDeleteDialogOpen(true);
                          }}
                          disabled={loan.status === "ACTIVE" && loan.paidInstallments > 0}
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذا القرض نهائياً. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
