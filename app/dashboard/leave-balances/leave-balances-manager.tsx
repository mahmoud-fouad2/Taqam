"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IconSearch,
  IconFilter,
  IconDownload,
  IconRefresh,
  IconPlus,
  IconMinus,
  IconAdjustments,
  IconCalendar
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { getBalancePercentage } from "@/lib/types/leave";
import { useEmployees } from "@/hooks/use-employees";
import { leavesApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { getLeaveTheme } from "@/lib/ui/leave-color";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

type UiLeaveBalance = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  departmentId: string;
  departmentName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeColor?: string | null;
  year: number;
  entitled: number;
  carriedOver: number;
  taken: number;
  pending: number;
  remaining: number;
  createdAt?: string;
  updatedAt?: string;
};

type ApiLeaveType = {
  id: string;
  name: string;
  code: string;
  color?: string | null;
  isActive: boolean;
};

function toNumber(value: any): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function LeaveBalancesManager() {
  const locale = useClientLocale();
  const t = getText(locale);
  const { departments, isLoading: isEmployeesLoading, error: employeesError } = useEmployees();

  const [balances, setBalances] = useState<UiLeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<ApiLeaveType[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterLeaveType, setFilterLeaveType] = useState<string>("all");
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<UiLeaveBalance | null>(null);
  const [adjustmentData, setAdjustmentData] = useState({
    type: "add" as "add" | "subtract",
    days: 0,
    reason: ""
  });

  const loadData = useCallback(
    async (year: number) => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [balancesRes, typesRes] = await Promise.all([
          leavesApi.balances.getAll({ year }),
          leavesApi.types.getAll()
        ]);

        if (!balancesRes.success) {
          throw new Error(balancesRes.error || t.leaveBalances.loadBalancesFailed);
        }
        if (!typesRes.success) {
          throw new Error(typesRes.error || t.leaveTypes.loadFailed);
        }

        const mappedTypes: ApiLeaveType[] = Array.isArray(typesRes.data)
          ? (typesRes.data as any[]).map((t: any) => ({
              id: String(t.id),
              name: String(t.name ?? ""),
              code: String(t.code ?? ""),
              color: t.color ?? null,
              isActive: Boolean(t.isActive)
            }))
          : [];
        setLeaveTypes(mappedTypes);

        const mappedBalances: UiLeaveBalance[] = Array.isArray(balancesRes.data)
          ? (balancesRes.data as any[]).map((b: any) => {
              const entitled = toNumber(b.entitled);
              const carriedOver = toNumber(b.carriedOver);
              const adjustment = toNumber(b.adjustment);
              const used = toNumber(b.used);
              const pending = toNumber(b.pending);
              const entitledWithAdjust = entitled + adjustment;
              const remaining = entitledWithAdjust + carriedOver - used - pending;

              const employeeName = b?.employee
                ? `${String(b.employee.firstName ?? "")} ${String(b.employee.lastName ?? "")}`.trim()
                : "";

              return {
                id: String(b.id),
                employeeId: String(b.employeeId ?? ""),
                employeeName,
                employeeNumber: String(b.employee?.employeeNumber ?? ""),
                departmentId: String(b.employee?.departmentId ?? ""),
                departmentName: String(b.employee?.department?.name ?? ""),
                leaveTypeId: String(b.leaveTypeId ?? ""),
                leaveTypeName: String(b.leaveType?.name ?? ""),
                leaveTypeColor: b.leaveType?.color ?? null,
                year: Number(b.year ?? year),
                entitled: entitledWithAdjust,
                carriedOver,
                taken: used,
                pending,
                remaining,
                createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : undefined,
                updatedAt: b.updatedAt ? new Date(b.updatedAt).toISOString() : undefined
              };
            })
          : [];
        setBalances(mappedBalances);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : t.common.loadFailed);
      } finally {
        setIsLoading(false);
      }
    },
    [t.common.loadFailed, t.leaveBalances.loadBalancesFailed, t.leaveTypes.loadFailed]
  );

  useEffect(() => {
    void loadData(selectedYear);
  }, [selectedYear, loadData]);

  // Group balances by employee
  const employeeBalances = balances.reduce(
    (acc, balance) => {
      if (!acc[balance.employeeId]) {
        acc[balance.employeeId] = {
          employeeId: balance.employeeId,
          employeeName: balance.employeeName,
          employeeNumber: balance.employeeNumber,
          departmentId: balance.departmentId,
          departmentName: balance.departmentName,
          balances: []
        };
      }
      acc[balance.employeeId].balances.push(balance);
      return acc;
    },
    {} as Record<
      string,
      {
        employeeId: string;
        employeeName: string;
        employeeNumber: string;
        departmentId: string;
        departmentName: string;
        balances: UiLeaveBalance[];
      }
    >
  );

  // Filter employees
  const filteredEmployees = Object.values(employeeBalances).filter((emp) => {
    const matchesSearch =
      emp.employeeName.includes(searchQuery) || emp.employeeNumber.includes(searchQuery);
    const matchesDepartment = filterDepartment === "all" || emp.departmentId === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  // Calculate totals
  const calculateTotals = () => {
    let totalEntitled = 0;
    let totalTaken = 0;
    let totalPending = 0;
    let totalRemaining = 0;

    balances.forEach((b) => {
      totalEntitled += b.entitled + b.carriedOver;
      totalTaken += b.taken;
      totalPending += b.pending;
      totalRemaining += b.remaining;
    });

    return { totalEntitled, totalTaken, totalPending, totalRemaining };
  };

  const totals = calculateTotals();

  const handleAdjust = async () => {
    if (!selectedBalance || adjustmentData.days <= 0 || !adjustmentData.reason) return;

    try {
      const res = await leavesApi.balances.adjustBalance(selectedBalance.id, {
        adjustmentType: adjustmentData.type === "add" ? "add" : "subtract",
        days: adjustmentData.days,
        reason: adjustmentData.reason
      });

      if (!res.success) {
        throw new Error(res.error || t.leaveBalances.updateFailed);
      }

      toast.success(t.leaveBalances.updatedSuccess);
      setIsAdjustDialogOpen(false);
      setSelectedBalance(null);
      setAdjustmentData({ type: "add", days: 0, reason: "" });
      await loadData(selectedYear);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.leaveBalances.updateFailed);
    }
  };

  const openAdjustDialog = (balance: UiLeaveBalance) => {
    setSelectedBalance(balance);
    setAdjustmentData({ type: "add", days: 0, reason: "" });
    setIsAdjustDialogOpen(true);
  };

  // Stats for each leave type
  const leaveTypeStats = useMemo(() => {
    return leaveTypes.map((type) => {
      const typeBalances = balances.filter((b) => b.leaveTypeId === type.id);
      const totalEntitled = typeBalances.reduce((sum, b) => sum + b.entitled + b.carriedOver, 0);
      const totalTaken = typeBalances.reduce((sum, b) => sum + b.taken, 0);
      return {
        ...type,
        totalEntitled,
        totalTaken,
        usageRate: totalEntitled > 0 ? Math.round((totalTaken / totalEntitled) * 100) : 0
      };
    });
  }, [leaveTypes, balances]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t.leaveBalances.title}</h2>
          <p className="text-muted-foreground">{t.leaveBalances.description}</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const res = await fetch(`/api/export?type=leaves&format=csv&year=${selectedYear}`);
                if (!res.ok) throw new Error();
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `leaves_${selectedYear}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              } catch {
                toast.error("فشل التصدير");
              }
            }}>
            <IconDownload className="ms-2 h-4 w-4" />
            {t.common.exportData}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.leaveBalances.entitled}</CardDescription>
            <CardTitle className="text-3xl">{totals.totalEntitled}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">{t.leaveBalances.allEmployees}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.leaveBalances.taken}</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{totals.totalTaken}</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={(totals.totalTaken / totals.totalEntitled) * 100} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.common.pending}</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{totals.totalPending}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">{t.leaveBalances.pendingDays}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.leaveBalances.remaining}</CardDescription>
            <CardTitle className="text-3xl text-green-600">{totals.totalRemaining}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">{t.leaveBalances.available}</p>
          </CardContent>
        </Card>
      </div>

      {/* Leave Type Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle>{t.leaveBalances.usageRate}</CardTitle>
          <CardDescription>{t.leaveBalances.usageDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {leaveTypeStats.slice(0, 4).map((type) => {
              const theme = getLeaveTheme(type.color);
              return (
                <div key={type.id} className={cn("rounded-lg border p-4", theme.border)}>
                  <div className="mb-3 flex items-center gap-2">
                    <div className={cn("h-3 w-3 rounded-full", theme.dot)} />
                    <span className="font-medium">{type.name}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t.common.user}</span>
                      <span>
                        {type.totalTaken} {t.leaveBalances.ofTotal} {type.totalEntitled}
                      </span>
                    </div>
                    <Progress value={type.usageRate} className={cn("h-2", theme.progress)} />
                    <div className={cn("text-start text-sm font-medium", theme.text)}>
                      {type.usageRate}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Employee Balances Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>{t.leaveBalances.employeeBalances}</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <IconSearch className="text-muted-foreground absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder={t.employees.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[200px] ps-9"
                />
              </div>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t.common.allDepartments} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.common.allDepartments}</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {loadError}
            </div>
          )}
          {employeesError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {employeesError}
            </div>
          )}
          {(isLoading || isEmployeesLoading) && (
            <div className="text-muted-foreground mb-4 flex items-center gap-3 text-sm">
              <Progress value={35} className="h-2 w-40" />
              {t.common.loading}
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.common.employee}</TableHead>
                <TableHead>{t.common.type}</TableHead>
                <TableHead className="text-center">{t.common.due}</TableHead>
                <TableHead className="text-center">{t.leaveBalances.carryOver}</TableHead>
                <TableHead className="text-center">{t.common.taken}</TableHead>
                <TableHead className="text-center">{t.common.pending}</TableHead>
                <TableHead className="text-center">{t.leaveBalances.remaining}</TableHead>
                <TableHead className="text-center">{t.leaveBalances.usage}</TableHead>
                <TableHead className="w-[100px]">{t.common.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center">
                    <p className="text-muted-foreground">{t.common.noData}</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.flatMap((emp) =>
                  emp.balances
                    .filter((b) => filterLeaveType === "all" || b.leaveTypeId === filterLeaveType)
                    .map((balance, index) => (
                      <TableRow key={balance.id}>
                        {index === 0 ? (
                          <TableCell rowSpan={emp.balances.length}>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback>{emp.employeeName.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{emp.employeeName}</div>
                                <div className="text-muted-foreground text-sm">
                                  {emp.departmentName}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        ) : null}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "h-3 w-3 rounded-full",
                                getLeaveTheme(balance.leaveTypeColor).dot
                              )}
                            />
                            {balance.leaveTypeName}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {balance.entitled}
                        </TableCell>
                        <TableCell className="text-center">
                          {balance.carriedOver > 0 ? (
                            <Badge variant="secondary">{balance.carriedOver}</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-center text-orange-600">
                          {balance.taken}
                        </TableCell>
                        <TableCell className="text-center">
                          {balance.pending > 0 ? (
                            <Badge variant="outline" className="bg-yellow-50">
                              {balance.pending}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-center font-medium text-green-600">
                          {balance.remaining}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={getBalancePercentage(balance as any)}
                              className="h-2 w-16"
                            />
                            <span className="text-muted-foreground text-sm">
                              {getBalancePercentage(balance as any)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAdjustDialog(balance)}>
                            <IconAdjustments className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Adjust Balance Dialog */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.leaveBalances.editBalance}</DialogTitle>
            <DialogDescription>
              {t.leaveBalances.pAdjustBalance} {selectedBalance?.leaveTypeName}{" "}
              {t.leaveBalances.pForEmployee} {selectedBalance?.employeeName}
            </DialogDescription>
          </DialogHeader>

          {selectedBalance && (
            <div className="space-y-4 py-4">
              {/* Current Balance Info */}
              <div className="bg-muted rounded-lg p-4">
                <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-2 md:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground text-sm">{t.common.due}</p>
                    <p className="text-xl font-bold">{selectedBalance.entitled}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">{t.common.taken}</p>
                    <p className="text-xl font-bold text-orange-600">{selectedBalance.taken}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">{t.leaveBalances.remaining}</p>
                    <p className="text-xl font-bold text-green-600">{selectedBalance.remaining}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.leaveBalances.adjustType}</Label>
                <div className="flex gap-2">
                  <Button
                    variant={adjustmentData.type === "add" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setAdjustmentData({ ...adjustmentData, type: "add" })}>
                    <IconPlus className="ms-2 h-4 w-4" />
                    {t.leaveBalances.pAddDays}
                  </Button>
                  <Button
                    variant={adjustmentData.type === "subtract" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setAdjustmentData({ ...adjustmentData, type: "subtract" })}>
                    <IconMinus className="ms-2 h-4 w-4" />
                    {t.leaveBalances.pDeductDays}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.leaveBalances.daysCount}</Label>
                <Input
                  type="number"
                  value={adjustmentData.days}
                  onChange={(e) =>
                    setAdjustmentData({
                      ...adjustmentData,
                      days: Number(e.target.value)
                    })
                  }
                  min={1}
                  max={adjustmentData.type === "subtract" ? selectedBalance.remaining : 365}
                />
              </div>

              <div className="space-y-2">
                <Label>{t.leaveBalances.adjustReason}</Label>
                <Textarea
                  value={adjustmentData.reason}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                  placeholder={t.leaveBalances.adjustReasonPlaceholder}
                  rows={3}
                />
              </div>

              {/* Preview */}
              {adjustmentData.days > 0 && (
                <div className="rounded-lg border border-dashed p-4">
                  <p className="text-muted-foreground mb-2 text-sm">
                    {t.leaveBalances.adjustPreview}
                  </p>
                  <div className="flex items-center justify-between">
                    <span>{t.leaveBalances.newBalance}</span>
                    <Badge
                      variant="outline"
                      className={
                        adjustmentData.type === "add"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }>
                      {adjustmentData.type === "add"
                        ? selectedBalance.remaining + adjustmentData.days
                        : selectedBalance.remaining - adjustmentData.days}{" "}
                      {t.leaveBalances.pDay}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleAdjust}
              disabled={adjustmentData.days <= 0 || !adjustmentData.reason}>
              {t.leaveBalances.pSaveAdjustment}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
