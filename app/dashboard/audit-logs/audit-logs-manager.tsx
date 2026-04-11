"use client";

import { useCallback, useEffect, useState } from "react";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
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
  const t = getText(locale);
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
        pageSize: "50"
      });

      if (actionFilter !== "all") params.append("action", actionFilter);
      if (entityFilter !== "all") params.append("entity", entityFilter);
      if (userFilter !== "all") params.append("userId", userFilter);
      if (dateFrom) params.append("startDate", dateFrom);
      if (dateTo) params.append("endDate", dateTo);

      const [logsRes, statsRes] = await Promise.all([
        fetch(`/api/audit-logs?${params.toString()}`),
        page === 1 ? fetch("/api/audit-logs/stats") : Promise.resolve(null)
      ]);

      if (!logsRes.ok) {
        throw new Error(t.auditLogs.loadFailed);
      }

      const logsData = await logsRes.json();
      setLogs(logsData.data || []);
      setTotalPages(logsData.pagination?.totalPages || 1);

      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : t.organization.genericError);
    } finally {
      setIsLoading(false);
    }
  }, [
    actionFilter,
    dateFrom,
    dateTo,
    entityFilter,
    page,
    userFilter,
    t.auditLogs.loadFailed,
    t.organization.genericError
  ]);

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
      LOGIN: t.audit.login,
      LOGOUT: t.audit.logout,
      USER_CREATE: t.common.add,
      USER_UPDATE: t.common.update,
      USER_DELETE: t.common.delete,
      EMPLOYEE_CREATE: t.employees.addEmployee,
      EMPLOYEE_UPDATE: t.employees.updatedSuccess,
      EMPLOYEE_DELETE: t.audit.employeeDelete,
      PAYROLL_PROCESS: t.auditLogs.payrollProcess,
      PAYROLL_APPROVE: t.auditLogs.payrollApprove,
      LEAVE_REQUEST_CREATE: t.auditLogs.leaveRequest,
      LEAVE_REQUEST_APPROVE: t.auditLogs.leaveApprove,
      LEAVE_REQUEST_REJECT: t.auditLogs.leaveReject,
      ATTENDANCE_CHECK_IN: t.auditLogs.checkIn,
      ATTENDANCE_CHECK_OUT: t.auditLogs.checkOut,
      DATA_EXPORT: t.common.exportData,
      BULK_DELETE: t.auditLogs.bulkDelete
    };
    return labels[action] || action;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
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
          <h1 className="text-3xl font-bold">{t.auditLogs.title}</h1>
          <p className="text-muted-foreground">{t.auditLogs.description}</p>
        </div>
        <Button variant="outline">
          <Download className="ms-2 h-4 w-4" />
          {t.auditLogs.export}
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t.auditLogs.totalOperations}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.toLocaleString(numLocale)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t.auditLogs.topOperation}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.byAction[0] ? getActionLabel(stats.byAction[0].action) : "-"}
              </div>
              <p className="text-muted-foreground text-xs">
                {stats.byAction[0] ? `${stats.byAction[0].count} ${t.auditLogs.timesUnit}` : ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t.auditLogs.activeUsers}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byUser.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t.auditLogs.lastActivity}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {stats.recentActivity[0] ? formatDate(stats.recentActivity[0].createdAt) : "-"}
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
            {t.auditLogs.filter}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <Label>{t.auditLogs.actionType}</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.common.all}</SelectItem>
                  <SelectItem value="LOGIN">{t.auditLogs.loginFilter}</SelectItem>
                  <SelectItem value="EMPLOYEE_CREATE">{t.auditLogs.employeeCreate}</SelectItem>
                  <SelectItem value="EMPLOYEE_UPDATE">{t.auditLogs.employeeUpdate}</SelectItem>
                  <SelectItem value="PAYROLL_PROCESS">{t.auditLogs.payrollProcess}</SelectItem>
                  <SelectItem value="LEAVE_REQUEST_CREATE">{t.auditLogs.leaveRequest}</SelectItem>
                  <SelectItem value="DATA_EXPORT">{t.common.exportData}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t.common.company}</Label>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.common.all}</SelectItem>
                  <SelectItem value="User">{t.auditLogs.userEntity}</SelectItem>
                  <SelectItem value="Employee">{t.auditLogs.employeeEntity}</SelectItem>
                  <SelectItem value="LeaveRequest">{t.auditLogs.leaveEntity}</SelectItem>
                  <SelectItem value="AttendanceRecord">{t.attendance.present}</SelectItem>
                  <SelectItem value="PayrollPeriod">{t.auditLogs.payrollEntity}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t.auditLogs.fromDate}</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>

            <div>
              <Label>{t.auditLogs.toDate}</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
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
                }}>
                {t.common.reset}
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
            {t.auditLogs.logCount} ({logs.length})
          </CardTitle>
          <CardDescription>
            {isLoading
              ? t.common.loading
              : loadError || `${t.auditLogs.pageOf} ${page} ${t.auditLogs.ofPages} ${totalPages}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.interviews.time}</TableHead>
                  <TableHead>{t.auditLogs.operation}</TableHead>
                  <TableHead>{t.common.company}</TableHead>
                  <TableHead>{t.common.user}</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 && !isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground py-12 text-center">
                      {t.auditLogs.noRecords}
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="text-muted-foreground h-4 w-4" />
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
                            <div className="text-muted-foreground text-xs">
                              ID: {log.entityId.substring(0, 8)}...
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.user ? (
                          <div className="flex items-center gap-2">
                            <User className="text-muted-foreground h-4 w-4" />
                            <div>
                              <div className="font-medium">{log.user.name || log.user.email}</div>
                              <div className="text-muted-foreground text-xs">{log.user.email}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">{t.auditLogs.pSystem}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.ipAddress || "-"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => viewDetails(log)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
                onClick={() => setPage((p) => Math.max(1, p - 1))}>
                {t.common.previous}
              </Button>
              <span className="text-muted-foreground text-sm">
                {t.auditLogs.pPage} {page} {t.auditLogs.pOf} {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                {t.common.next}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-h-[80vh] w-full max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.auditLogs.details}</DialogTitle>
            <DialogDescription>
              {selectedLog && formatDate(selectedLog.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>{t.auditLogs.operation}</Label>
                  <div className="mt-1">
                    <Badge className={getActionColor(selectedLog.action)}>
                      {getActionLabel(selectedLog.action)}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label>{t.common.company}</Label>
                  <div className="mt-1 font-medium">{selectedLog.entity}</div>
                </div>

                <div>
                  <Label>{t.common.user}</Label>
                  <div className="mt-1 font-medium">
                    {selectedLog.user?.name || selectedLog.user?.email || t.auditLogs.system}
                  </div>
                </div>

                <div>
                  <Label>IP Address</Label>
                  <div className="mt-1 font-mono text-sm">{selectedLog.ipAddress || "-"}</div>
                </div>
              </div>

              {selectedLog.oldData && (
                <div>
                  <Label>{t.auditLogs.oldData}</Label>
                  <pre className="bg-muted mt-1 overflow-x-auto rounded-md p-4 text-xs">
                    {JSON.stringify(selectedLog.oldData, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newData && (
                <div>
                  <Label>{t.auditLogs.newData}</Label>
                  <pre className="bg-muted mt-1 overflow-x-auto rounded-md p-4 text-xs">
                    {JSON.stringify(selectedLog.newData, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.userAgent && (
                <div>
                  <Label>User Agent</Label>
                  <div className="text-muted-foreground mt-1 text-xs break-all">
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
