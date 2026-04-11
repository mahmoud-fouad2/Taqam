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
  IconRefresh
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExportButton } from "@/components/export-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

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
  SALARY_ADVANCE: { ar: t.loans.salaryAdvance, en: "Salary Advance" },
  PERSONAL_LOAN: { ar: t.loans.personalLoan, en: "Personal Loan" },
  EMERGENCY_LOAN: { ar: t.loans.emergencyLoan, en: "Emergency Loan" },
  HOUSING_LOAN: { ar: t.loans.housingLoan, en: "Housing Loan" },
  CAR_LOAN: { ar: t.loans.carLoan, en: "Car Loan" },
  OTHER: { ar: t.common.other, en: "Other" }
};

const statusLabels: Record<string, { ar: string; en: string }> = {
  PENDING: { ar: t.documents.pendingApproval, en: "Pending" },
  APPROVED: { ar: t.loans.pApproval, en: "Approved" },
  ACTIVE: { ar: t.common.active, en: "Active" },
  COMPLETED: { ar: t.common.completed, en: "Completed" },
  REJECTED: { ar: t.common.rejected, en: "Rejected" },
  CANCELLED: { ar: t.common.cancelled, en: "Cancelled" }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0
  }).format(amount);
};

export function LoansManager() {
  const locale = useClientLocale();
  const t = getText(locale);
  const [loans, setLoans] = React.useState<Loan[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [stats, setStats] = React.useState<Stats>({
    total: 0,
    pending: 0,
    active: 0,
    completed: 0,
    totalActiveAmount: 0
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
      toast.error(t.loans.loadFailed);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, t.loans.loadFailed]);

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
              avatar: e.user?.avatar || e.avatar || null
            }
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
      toast.error(t.common.fillRequired);
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
        reason: formReason || undefined
      };

      const url = editingLoan ? `/api/loans/${editingLoan.id}` : "/api/loans";
      const method = editingLoan ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || t.loans.saveFailed);
      }

      toast.success(editingLoan ? t.loans.updatedSuccess : t.loans.createdSuccess);
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
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        throw new Error(t.loans.statusUpdateFailed);
      }

      toast.success(t.loans.statusUpdated);
      fetchLoans();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    if (!loanToDelete) return;

    try {
      const res = await fetch(`/api/loans/${loanToDelete.id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || t.loans.deleteFailed);
      }

      toast.success(t.loans.deletedSuccess);
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
      CANCELLED: "bg-gray-100 text-gray-800"
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
            <CardTitle className="text-sm font-medium">{t.loans.totalLoans}</CardTitle>
            <IconReceipt className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.loans.activeLoans}</CardTitle>
            <IconCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
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
            <CardTitle className="text-sm font-medium">{t.loans.remainingAmounts}</CardTitle>
            <IconCurrencyRiyal className="text-muted-foreground h-4 w-4" />
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
              <IconFilter className="me-2 h-4 w-4" />
              <SelectValue placeholder={t.common.status} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.attendance.allStatuses}</SelectItem>
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
          <Button
            variant="outline"
            size="icon"
            aria-label={t.common.refresh}
            onClick={() => fetchLoans()}>
            <IconRefresh className="h-4 w-4" />
          </Button>
        </div>

        <Dialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) resetForm();
          }}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="me-2 h-4 w-4" />
              {t.loans.newLoanRequest}
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingLoan ? t.loans.editLoan : t.loans.newLoanRequest}</DialogTitle>
              <DialogDescription>{t.loans.loanDetailsDesc}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>{t.common.selectEmployee}</Label>
                <Select value={formEmployeeId} onValueChange={setFormEmployeeId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.common.selectEmployee} />
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
                <Label>{t.loans.loanType}</Label>
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t.loans.amountSar}</Label>
                  <Input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="10000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.loans.installments}</Label>
                  <Input
                    type="number"
                    value={formInstallments}
                    onChange={(e) => setFormInstallments(e.target.value)}
                    placeholder="12"
                  />
                </div>
              </div>

              {formAmount && formInstallments && parseInt(formInstallments) > 0 && (
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-muted-foreground text-sm">{t.loans.monthlyInstallment}</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(parseFloat(formAmount) / parseInt(formInstallments))}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>{t.common.startDate}</Label>
                <Input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>{t.common.reason}</Label>
                <Textarea
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder={t.loans.loanReasonPlaceholder}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                {t.common.cancel}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting
                  ? t.common.saving
                  : editingLoan
                    ? t.common.saveChanges
                    : t.loans.submitRequest}
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
                <TableHead>{t.common.employee}</TableHead>
                <TableHead>{t.common.type}</TableHead>
                <TableHead>{t.common.amount}</TableHead>
                <TableHead>{t.loans.installments}</TableHead>
                <TableHead>{t.leaveBalances.remaining}</TableHead>
                <TableHead>{t.common.status}</TableHead>
                <TableHead className="w-[120px]">{t.common.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground py-12 text-center">
                    {t.loans.pNoLoansFound}
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
                          <div className="text-muted-foreground text-xs">
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
                              aria-label={t.common.approve}
                              className="h-8 w-8 text-green-600"
                              onClick={() => handleStatusChange(loan.id, "ACTIVE")}
                              title={t.common.approve}>
                              <IconCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t.common.reject}
                              className="h-8 w-8 text-red-600"
                              onClick={() => handleStatusChange(loan.id, "REJECTED")}
                              title={t.common.reject}>
                              <IconX className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t.common.edit}
                          className="h-8 w-8"
                          onClick={() => openEditForm(loan)}
                          disabled={loan.status === "COMPLETED"}>
                          <IconEdit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t.common.delete}
                          className="text-destructive h-8 w-8"
                          onClick={() => {
                            setLoanToDelete(loan);
                            setDeleteDialogOpen(true);
                          }}
                          disabled={loan.status === "ACTIVE" && loan.paidInstallments > 0}>
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
            <AlertDialogTitle>{t.common.areYouSure}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.loans.pThisLoanWillBePermanentlyDelet}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
