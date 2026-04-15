"use client";

import * as React from "react";
import {
  IconPlus,
  IconFilter,
  IconSearch,
  IconClock,
  IconCheck,
  IconX,
  IconFileDescription,
  IconCalendarTime,
  IconHome,
  IconClockEdit
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type AttendanceRequest,
  type AttendanceRequestStatus,
  type AttendanceRequestType,
  requestStatusLabels,
  requestTypeLabels
} from "@/lib/types/attendance";
import { attendanceService } from "@/lib/api";
import { useEmployees } from "@/hooks/use-employees";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

type ProfileResponse = {
  data?: {
    role?: string;
    employee?: { id?: string } | null;
  };
};

type RequestsTableProps = {
  locale: "ar" | "en";
  t: ReturnType<typeof getText>;
  requests: AttendanceRequest[];
  isLoading: boolean;
  isApprovalMode: boolean;
  getEmployeeName: (employeeId: string) => string;
  getTypeIcon: (type: AttendanceRequestType) => React.ReactNode;
  getStatusVariant: (
    status: AttendanceRequestStatus
  ) => "default" | "secondary" | "destructive" | "outline";
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
};

const APPROVER_ROLES = ["SUPER_ADMIN", "TENANT_ADMIN", "HR_MANAGER", "MANAGER"];

function localeTag(locale: "ar" | "en") {
  return locale === "ar" ? "ar-SA" : "en-US";
}

function formatDate(value: string, locale: "ar" | "en") {
  return new Date(value).toLocaleDateString(localeTag(locale));
}

function formatDateTime(value: string, locale: "ar" | "en") {
  return new Date(value).toLocaleString(localeTag(locale), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatTime(value: string | undefined, locale: "ar" | "en") {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleTimeString(localeTag(locale), {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function toLocalIso(date: string, time?: string) {
  if (!date || !time) {
    return undefined;
  }

  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return undefined;
  }

  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();
}

function RequestsTable({
  locale,
  t,
  requests,
  isLoading,
  isApprovalMode,
  getEmployeeName,
  getTypeIcon,
  getStatusVariant,
  onApprove,
  onReject
}: RequestsTableProps) {
  return (
    <Card className="border-border/40 bg-card/90 rounded-3xl shadow-[0_2px_10px_0_rgba(0,0,0,0.02)]">
      <CardHeader>
        <CardTitle>
          {isApprovalMode ? t.requests.needsApproval : t.requests.myRequestsLabel}
        </CardTitle>
        <CardDescription>
          {requests.length} {t.requests.requestCount}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {isApprovalMode && <TableHead>{t.common.employee}</TableHead>}
              <TableHead>{t.myRequests.requestType}</TableHead>
              <TableHead>{t.common.date}</TableHead>
              <TableHead>{t.common.details}</TableHead>
              <TableHead>{t.common.reason}</TableHead>
              <TableHead>{t.common.status}</TableHead>
              <TableHead>{t.myRequests.submissionDate}</TableHead>
              {isApprovalMode && <TableHead className="text-start">{t.common.actions}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={isApprovalMode ? 8 : 7}
                  className="text-muted-foreground py-8 text-center">
                  {t.requests.loadingRequests}
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isApprovalMode ? 8 : 7} className="py-8 text-center">
                  <IconFileDescription className="text-muted-foreground mx-auto mb-2 h-12 w-12" />
                  <p className="text-muted-foreground">{t.requests.noRequests}</p>
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.id}>
                  {isApprovalMode && (
                    <TableCell className="font-medium">
                      {getEmployeeName(request.employeeId)}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(request.type)}
                      <span>{requestTypeLabels[request.type][locale]}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(request.date, locale)}</TableCell>
                  <TableCell className="text-sm">
                    {request.type === "check_correction" && request.requestedCheckIn && (
                      <span>
                        {formatTime(request.requestedCheckIn, locale)} -{" "}
                        {formatTime(request.requestedCheckOut, locale)}
                      </span>
                    )}
                    {request.type === "overtime" && (
                      <span>
                        {request.overtimeHours} {t.requests.hoursUnit}
                      </span>
                    )}
                    {request.type === "permission" && (
                      <span>
                        {formatTime(request.permissionStartTime, locale)} -{" "}
                        {formatTime(request.permissionEndTime, locale)}
                      </span>
                    )}
                    {request.type === "work_from_home" && <span>{t.requests.fullDay}</span>}
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate">{request.reason}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(request.status)}>
                      {requestStatusLabels[request.status][locale]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDateTime(request.createdAt, locale)}
                  </TableCell>
                  {isApprovalMode && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => onApprove?.(request.id)}>
                          <IconCheck className="ms-2 h-4 w-4" />
                          {t.common.accept}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onReject?.(request.id)}>
                          <IconX className="ms-2 h-4 w-4" />
                          {t.common.reject}
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function RequestsManager() {
  const locale = useClientLocale();
  const t = getText(locale);
  const { getEmployeeFullName } = useEmployees();
  const [requests, setRequests] = React.useState<AttendanceRequest[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isRejecting, setIsRejecting] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<AttendanceRequestStatus | "all">("all");
  const [typeFilter, setTypeFilter] = React.useState<AttendanceRequestType | "all">("all");
  const [activeTab, setActiveTab] = React.useState<"my" | "pending">("my");
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [rejectRequestId, setRejectRequestId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [formData, setFormData] = React.useState({
    type: "check_correction" as AttendanceRequestType,
    date: "",
    requestedCheckIn: "",
    requestedCheckOut: "",
    overtimeHours: 1,
    permissionStartTime: "",
    permissionEndTime: "",
    reason: ""
  });

  const canApprove = currentUserRole ? APPROVER_ROLES.includes(currentUserRole) : false;

  React.useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const response = await fetch("/api/profile", { cache: "no-store" });
        const json = (await response.json()) as ProfileResponse;
        if (!mounted) {
          return;
        }

        setCurrentUserId(
          typeof json.data?.employee?.id === "string" ? json.data.employee.id : null
        );
        setCurrentUserRole(typeof json.data?.role === "string" ? json.data.role : null);
      } catch {
        if (!mounted) {
          return;
        }

        setCurrentUserId(null);
        setCurrentUserRole(null);
      }
    };

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const loadRequests = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await attendanceService.getRequests();
      if (!response.success || !response.data) {
        setRequests([]);
        setError(response.error || t.requests.loadingRequests);
        return;
      }

      setRequests(response.data);
    } catch (loadError) {
      setRequests([]);
      setError(loadError instanceof Error ? loadError.message : t.requests.loadingRequests);
    } finally {
      setIsLoading(false);
    }
  }, [t.requests.loadingRequests]);

  React.useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  React.useEffect(() => {
    if (!canApprove && activeTab === "pending") {
      setActiveTab("my");
    }
  }, [activeTab, canApprove]);

  const myRequests = currentUserId
    ? requests.filter((item) => item.employeeId === currentUserId)
    : [];
  const pendingApprovalRequests = requests.filter(
    (item) => item.status === "pending" && (!currentUserId || item.employeeId !== currentUserId)
  );

  const displayedRequests = activeTab === "my" ? myRequests : pendingApprovalRequests;
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredRequests = displayedRequests.filter((item) => {
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;

    if (!normalizedSearch) {
      return matchesType && matchesStatus;
    }

    const employeeName = getEmployeeFullName(item.employeeId).toLowerCase();
    const requestType = requestTypeLabels[item.type][locale].toLowerCase();
    const requestStatus = requestStatusLabels[item.status][locale].toLowerCase();
    const reason = item.reason.toLowerCase();

    const matchesSearch =
      employeeName.includes(normalizedSearch) ||
      requestType.includes(normalizedSearch) ||
      requestStatus.includes(normalizedSearch) ||
      reason.includes(normalizedSearch);

    return matchesType && matchesStatus && matchesSearch;
  });

  const searchPlaceholder =
    locale === "ar"
      ? "ابحث بالموظف أو النوع أو الحالة أو السبب"
      : "Search by employee, type, status, or reason";
  const pendingCountLabel = locale === "ar" ? "طلبات معلقة" : "Pending requests";

  const stats = {
    total: myRequests.length,
    pending: myRequests.filter((item) => item.status === "pending").length,
    approved: myRequests.filter((item) => item.status === "approved").length,
    rejected: myRequests.filter((item) => item.status === "rejected").length,
    pendingApproval: canApprove ? pendingApprovalRequests.length : 0
  };

  const resetForm = () => {
    setFormData({
      type: "check_correction",
      date: "",
      requestedCheckIn: "",
      requestedCheckOut: "",
      overtimeHours: 1,
      permissionStartTime: "",
      permissionEndTime: "",
      reason: ""
    });
  };

  const handleSubmit = async () => {
    if (!currentUserId) {
      setError(t.requests.noEmployeeLinked);
      return;
    }

    if (!formData.date || !formData.reason.trim()) {
      setError(t.requests.enterDateReason);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Parameters<typeof attendanceService.createRequest>[0] = {
        employeeId: currentUserId,
        type: formData.type,
        date: formData.date,
        reason: formData.reason.trim()
      };

      if (formData.type === "check_correction") {
        payload.requestedCheckIn = toLocalIso(formData.date, formData.requestedCheckIn);
        payload.requestedCheckOut = toLocalIso(formData.date, formData.requestedCheckOut);
      }

      if (formData.type === "overtime") {
        payload.overtimeHours = formData.overtimeHours;
      }

      if (formData.type === "permission") {
        payload.permissionStartTime = toLocalIso(formData.date, formData.permissionStartTime);
        payload.permissionEndTime = toLocalIso(formData.date, formData.permissionEndTime);
      }

      const response = await attendanceService.createRequest(payload);
      if (!response.success) {
        setError(response.error || t.requests.submitFailed);
        return;
      }

      toast.success(t.requests.submittedSuccess);
      setIsAddOpen(false);
      resetForm();
      await loadRequests();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t.requests.submitFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!canApprove) {
      return;
    }

    setError(null);

    try {
      const response = await attendanceService.approveRequest(requestId);
      if (!response.success) {
        setError(response.error || t.requests.approveFailed);
        return;
      }

      toast.success(t.requests.approvedSuccess);
      await loadRequests();
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : t.requests.approveFailed);
    }
  };

  const handleReject = async () => {
    if (!canApprove || !rejectRequestId) {
      return;
    }

    if (!rejectReason.trim()) {
      setError(t.requests.enterRejectReason);
      return;
    }

    setIsRejecting(true);
    setError(null);

    try {
      const response = await attendanceService.rejectRequest(rejectRequestId, rejectReason.trim());
      if (!response.success) {
        setError(response.error || t.leaveRequests.rejectFailed);
        return;
      }

      toast.success(t.leaveRequests.rejectedSuccess);
      setRejectRequestId(null);
      setRejectReason("");
      await loadRequests();
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : t.leaveRequests.rejectFailed);
    } finally {
      setIsRejecting(false);
    }
  };

  const getEmployeeName = (employeeId: string) => getEmployeeFullName(employeeId);

  const getTypeIcon = (type: AttendanceRequestType) => {
    switch (type) {
      case "check_correction":
        return <IconClockEdit className="h-4 w-4" />;
      case "overtime":
        return <IconClock className="h-4 w-4" />;
      case "permission":
        return <IconCalendarTime className="h-4 w-4" />;
      case "work_from_home":
        return <IconHome className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: AttendanceRequestStatus) => {
    switch (status) {
      case "approved":
        return "default" as const;
      case "pending":
        return "secondary" as const;
      case "rejected":
        return "destructive" as const;
      case "cancelled":
        return "outline" as const;
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-border/40 bg-card/90 rounded-3xl shadow-[0_2px_10px_0_rgba(0,0,0,0.02)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.requests.totalMyRequests}</CardTitle>
            <IconFileDescription className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/90 rounded-3xl shadow-[0_2px_10px_0_rgba(0,0,0,0.02)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.documents.pendingApproval}</CardTitle>
            <IconClock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/90 rounded-3xl shadow-[0_2px_10px_0_rgba(0,0,0,0.02)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.documents.approved}</CardTitle>
            <IconCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/90 rounded-3xl shadow-[0_2px_10px_0_rgba(0,0,0,0.02)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.common.rejected}</CardTitle>
            <IconX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
        {canApprove && (
          <Card className="border-primary/30 bg-primary/5 rounded-3xl shadow-[0_2px_10px_0_rgba(0,0,0,0.02)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.requests.needsYourApproval}</CardTitle>
              <IconClock className="text-primary h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-primary text-2xl font-bold">{stats.pendingApproval}</div>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "my" | "pending")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="my">{t.myRequests.title}</TabsTrigger>
            {canApprove && (
              <TabsTrigger value="pending">
                {t.requests.pPendingApproval}
                {stats.pendingApproval > 0 && (
                  <Badge variant="destructive" className="me-2 h-5 w-5 justify-center p-0">
                    {stats.pendingApproval}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
            <div className="relative w-full sm:w-72">
              <IconSearch className="text-muted-foreground pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-12 rounded-xl pe-10"
              />
            </div>

            <Badge variant="outline" className="text-muted-foreground h-12 rounded-xl px-4 text-xs">
              {pendingCountLabel}: {activeTab === "my" ? stats.pending : stats.pendingApproval}
            </Badge>

            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as AttendanceRequestType | "all")}>
              <SelectTrigger className="h-12 w-[170px] rounded-xl">
                <IconFilter className="ms-2 h-4 w-4" />
                <SelectValue placeholder={t.common.type} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.requests.allTypes}</SelectItem>
                {Object.entries(requestTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label[locale]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as AttendanceRequestStatus | "all")}>
              <SelectTrigger className="h-12 w-[170px] rounded-xl">
                <SelectValue placeholder={t.common.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.attendance.allStatuses}</SelectItem>
                {Object.entries(requestStatusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label[locale]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="h-12 rounded-xl px-5">
                  <IconPlus className="ms-2 h-4 w-4" />
                  {t.myRequests.newRequest}
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle>{t.myRequests.newRequest}</DialogTitle>
                  <DialogDescription>{t.requests.chooseTypeAndData}</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>{t.myRequests.requestType}</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData((current) => ({
                          ...current,
                          type: value as AttendanceRequestType
                        }))
                      }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(requestTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(key as AttendanceRequestType)}
                              {label[locale]}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t.common.date}</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(event) =>
                        setFormData((current) => ({ ...current, date: event.target.value }))
                      }
                    />
                  </div>

                  {formData.type === "check_correction" && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{t.requests.correctAttendance}</Label>
                        <Input
                          type="time"
                          value={formData.requestedCheckIn}
                          onChange={(event) =>
                            setFormData((current) => ({
                              ...current,
                              requestedCheckIn: event.target.value
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.requests.correctDeparture}</Label>
                        <Input
                          type="time"
                          value={formData.requestedCheckOut}
                          onChange={(event) =>
                            setFormData((current) => ({
                              ...current,
                              requestedCheckOut: event.target.value
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}

                  {formData.type === "overtime" && (
                    <div className="space-y-2">
                      <Label>{t.requests.overtimeHours}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={12}
                        value={formData.overtimeHours}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            overtimeHours: Number(event.target.value || 1)
                          }))
                        }
                      />
                    </div>
                  )}

                  {formData.type === "permission" && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{t.requests.fromTime}</Label>
                        <Input
                          type="time"
                          value={formData.permissionStartTime}
                          onChange={(event) =>
                            setFormData((current) => ({
                              ...current,
                              permissionStartTime: event.target.value
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.requests.toTime}</Label>
                        <Input
                          type="time"
                          value={formData.permissionEndTime}
                          onChange={(event) =>
                            setFormData((current) => ({
                              ...current,
                              permissionEndTime: event.target.value
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>{t.common.reason}</Label>
                    <Textarea
                      rows={3}
                      value={formData.reason}
                      onChange={(event) =>
                        setFormData((current) => ({ ...current, reason: event.target.value }))
                      }
                      placeholder={t.requests.writeReason}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                    {t.common.cancel}
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {t.common.submitRequest}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="my">
          <RequestsTable
            locale={locale}
            t={t}
            requests={filteredRequests}
            isLoading={isLoading}
            isApprovalMode={false}
            getEmployeeName={getEmployeeName}
            getTypeIcon={getTypeIcon}
            getStatusVariant={getStatusVariant}
          />
        </TabsContent>

        <TabsContent value="pending">
          <RequestsTable
            locale={locale}
            t={t}
            requests={filteredRequests}
            isLoading={isLoading}
            isApprovalMode={true}
            getEmployeeName={getEmployeeName}
            getTypeIcon={getTypeIcon}
            getStatusVariant={getStatusVariant}
            onApprove={handleApprove}
            onReject={(requestId) => {
              setRejectRequestId(requestId);
              setRejectReason("");
            }}
          />
        </TabsContent>
      </Tabs>

      <Dialog
        open={Boolean(rejectRequestId)}
        onOpenChange={(open) => !open && setRejectRequestId(null)}>
        <DialogContent className="w-full sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.common.reject}</DialogTitle>
            <DialogDescription>{t.requests.rejectDialogDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="rejection-reason">{t.common.reason}</Label>
            <Textarea
              id="rejection-reason"
              rows={4}
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder={t.requests.writeRejectReason}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectRequestId(null)}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isRejecting}>
              {t.requests.pConfirmRejection}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
