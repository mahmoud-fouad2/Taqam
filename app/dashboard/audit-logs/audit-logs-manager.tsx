'use client';

import { useCallback, useEffect, useState } from "react";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { FileText, Filter, Download, Eye, Calendar, User, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  user: { id: string; name: string | null; email: string } | null;
  oldData: Record<string, any> | null;
  newData: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface AuditStats {
  total: number;
  byAction: { action: string; count: number }[];
  byUser: { userId: string | null; user: any; count: number }[];
  recentActivity: AuditLog[];
}

export default function AuditLogsManager() {
  const locale = useClientLocale("ar");
  const numLocale = locale === "en" ? "en-US" : "ar-SA";
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Selected log for details
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "50",
      });

      if (actionFilter !== "all") params.append("action", actionFilter);
      if (entityFilter !== "all") params.append("entity", entityFilter);
      if (userFilter !== "all") params.append("userId", userFilter);
      if (dateFrom) params.append("startDate", dateFrom);
      if (dateTo) params.append("endDate", dateTo);

      const [logsRes, statsRes] = await Promise.all([
        fetch(`/api/audit-logs?${params.toString()}`),
        page === 1 ? fetch("/api/audit-logs/stats") : Promise.resolve(null),
      ]);

      if (!logsRes.ok) {
        throw new Error("فشل تحميل سجلات التدقيق");
      }

      const logsData = await logsRes.json();
      setLogs(logsData.data || []);
      setTotalPages(logsData.pagination?.totalPages || 1);

      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter, dateFrom, dateTo, entityFilter, page, userFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getActionColor = (action: string) => {
    if (action.includes("CREATE")) return "bg-green-100 text-green-800";
    if (action.includes("UPDATE")) return "bg-blue-100 text-blue-800";
    if (action.includes("DELETE") || action.includes("BULK")) return "bg-red-100 text-red-800";
    if (action.includes("LOGIN")) return "bg-purple-100 text-purple-800";
    if (action.includes("APPROVE")) return "bg-emerald-100 text-emerald-800";
    if (action.includes("REJECT")) return "bg-orange-100 text-orange-800";
    return "bg-gray-100 text-gray-800";
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      LOGIN: "تسجيل دخول",
      LOGOUT: "تسجيل خروج",
      USER_CREATE: "إنشاء مستخدم",
      USER_UPDATE: "تحديث مستخدم",
      USER_DELETE: "حذف مستخدم",
      EMPLOYEE_CREATE: "إنشاء موظف",
      EMPLOYEE_UPDATE: "تحديث موظف",
      EMPLOYEE_DELETE: "حذف موظف",
      PAYROLL_PROCESS: "معالجة رواتب",
      PAYROLL_APPROVE: "موافقة رواتب",
      LEAVE_REQUEST_CREATE: "طلب إجازة",
      LEAVE_REQUEST_APPROVE: "موافقة إجازة",
      LEAVE_REQUEST_REJECT: "رفض إجازة",
      ATTENDANCE_CHECK_IN: "تسجيل حضور",
      ATTENDANCE_CHECK_OUT: "تسجيل انصراف",
      DATA_EXPORT: "تصدير بيانات",
      BULK_DELETE: "حذف جماعي",
    };
    return labels[action] || action;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const viewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">سجل التدقيق</h1>
          <p className="text-muted-foreground">
            جميع العمليات والتغييرات في النظام
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 ms-2" />
          تصدير السجل
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                إجمالي العمليات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.toLocaleString(numLocale)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                أكثر عملية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.byAction[0] ? getActionLabel(stats.byAction[0].action) : "-"}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.byAction[0] ? `${stats.byAction[0].count} مرة` : ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                المستخدمون النشطون
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byUser.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                آخر نشاط
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {stats.recentActivity[0]
                  ? formatDate(stats.recentActivity[0].createdAt)
                  : "-"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            تصفية السجلات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <Label>نوع العملية</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="LOGIN">تسجيل دخول</SelectItem>
                  <SelectItem value="EMPLOYEE_CREATE">إنشاء موظف</SelectItem>
                  <SelectItem value="EMPLOYEE_UPDATE">تحديث موظف</SelectItem>
                  <SelectItem value="PAYROLL_PROCESS">معالجة رواتب</SelectItem>
                  <SelectItem value="LEAVE_REQUEST_CREATE">طلب إجازة</SelectItem>
                  <SelectItem value="DATA_EXPORT">تصدير بيانات</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>الكيان</Label>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="User">مستخدم</SelectItem>
                  <SelectItem value="Employee">موظف</SelectItem>
                  <SelectItem value="LeaveRequest">إجازة</SelectItem>
                  <SelectItem value="AttendanceRecord">حضور</SelectItem>
                  <SelectItem value="PayrollPeriod">رواتب</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>من تاريخ</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div>
              <Label>إلى تاريخ</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setActionFilter("all");
                  setEntityFilter("all");
                  setDateFrom("");
                  setDateTo("");
                  setPage(1);
                }}
              >
                إعادة تعيين
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            السجلات ({logs.length})
          </CardTitle>
          <CardDescription>
            {isLoading ? "جارٍ التحميل..." : loadError || `صفحة ${page} من ${totalPages}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الوقت</TableHead>
                <TableHead>العملية</TableHead>
                <TableHead>الكيان</TableHead>
                <TableHead>المستخدم</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    لا توجد سجلات تطابق التصفية الحالية
                  </TableCell>
                </TableRow>
              ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDate(log.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getActionColor(log.action)}>
                      {getActionLabel(log.action)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{log.entity}</div>
                      {log.entityId && (
                        <div className="text-xs text-muted-foreground">
                          ID: {log.entityId.substring(0, 8)}...
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.user ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{log.user.name || log.user.email}</div>
                          <div className="text-xs text-muted-foreground">{log.user.email}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">النظام</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.ipAddress || "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => viewDetails(log)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))) }
            </TableBody>
          </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                السابق
              </Button>
              <span className="text-sm text-muted-foreground">
                صفحة {page} من {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                التالي
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="w-full max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل العملية</DialogTitle>
            <DialogDescription>
              {selectedLog && formatDate(selectedLog.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>العملية</Label>
                  <div className="mt-1">
                    <Badge className={getActionColor(selectedLog.action)}>
                      {getActionLabel(selectedLog.action)}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label>الكيان</Label>
                  <div className="mt-1 font-medium">{selectedLog.entity}</div>
                </div>

                <div>
                  <Label>المستخدم</Label>
                  <div className="mt-1 font-medium">
                    {selectedLog.user?.name || selectedLog.user?.email || "النظام"}
                  </div>
                </div>

                <div>
                  <Label>IP Address</Label>
                  <div className="mt-1 font-mono text-sm">
                    {selectedLog.ipAddress || "-"}
                  </div>
                </div>
              </div>

              {selectedLog.oldData && (
                <div>
                  <Label>البيانات القديمة</Label>
                  <pre className="mt-1 rounded-md bg-muted p-4 text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.oldData, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newData && (
                <div>
                  <Label>البيانات الجديدة</Label>
                  <pre className="mt-1 rounded-md bg-muted p-4 text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.newData, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.userAgent && (
                <div>
                  <Label>User Agent</Label>
                  <div className="mt-1 text-xs text-muted-foreground break-all">
                    {selectedLog.userAgent}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
