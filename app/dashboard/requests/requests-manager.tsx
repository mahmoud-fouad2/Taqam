"use client";

import * as React from "react";
import {
  IconPlus,
  IconFilter,
  IconClock,
  IconCheck,
  IconX,
  IconFileDescription,
  IconCalendarTime,
  IconHome,
  IconClockEdit,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type AttendanceRequest,
  type AttendanceRequestStatus,
  type AttendanceRequestType,
  requestStatusLabels,
  requestTypeLabels,
} from "@/lib/types/attendance";
import { attendanceService } from "@/lib/api";
import { useEmployees } from "@/hooks/use-employees";

type ProfileResponse = {
  data?: {
    role?: string;
    employee?: { id?: string } | null;
  };
};

type RequestsTableProps = {
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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ar-SA");
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ar-SA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(value?: string) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
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
  requests,
  isLoading,
  isApprovalMode,
  getEmployeeName,
  getTypeIcon,
  getStatusVariant,
  onApprove,
  onReject,
}: RequestsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isApprovalMode ? "طلبات تحتاج موافقتك" : "طلباتي"}</CardTitle>
        <CardDescription>{requests.length} طلب</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {isApprovalMode && <TableHead>الموظف</TableHead>}
              <TableHead>نوع الطلب</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>التفاصيل</TableHead>
              <TableHead>السبب</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>تاريخ التقديم</TableHead>
              {isApprovalMode && <TableHead className="text-start">إجراءات</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={isApprovalMode ? 8 : 7} className="py-8 text-center text-muted-foreground">
                  جاري تحميل الطلبات...
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isApprovalMode ? 8 : 7} className="py-8 text-center">
                  <IconFileDescription className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">لا توجد طلبات</p>
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.id}>
                  {isApprovalMode && <TableCell className="font-medium">{getEmployeeName(request.employeeId)}</TableCell>}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(request.type)}
                      <span>{requestTypeLabels[request.type].ar}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(request.date)}</TableCell>
                  <TableCell className="text-sm">
                    {request.type === "check_correction" && request.requestedCheckIn && (
                      <span>
                        {formatTime(request.requestedCheckIn)} - {formatTime(request.requestedCheckOut)}
                      </span>
                    )}
                    {request.type === "overtime" && <span>{request.overtimeHours} ساعات</span>}
                    {request.type === "permission" && (
                      <span>
                        {formatTime(request.permissionStartTime)} - {formatTime(request.permissionEndTime)}
                      </span>
                    )}
                    {request.type === "work_from_home" && <span>يوم كامل</span>}
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate">{request.reason}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(request.status)}>
                      {requestStatusLabels[request.status].ar}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDateTime(request.createdAt)}</TableCell>
                  {isApprovalMode && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => onApprove?.(request.id)}>
                          <IconCheck className="ms-2 h-4 w-4" />
                          اعتماد
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => onReject?.(request.id)}>
                          <IconX className="ms-2 h-4 w-4" />
                          رفض
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
  const { getEmployeeFullName } = useEmployees();
  const [requests, setRequests] = React.useState<AttendanceRequest[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isRejecting, setIsRejecting] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = React.useState<string | null>(null);
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
    reason: "",
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

        setCurrentUserId(typeof json.data?.employee?.id === "string" ? json.data.employee.id : null);
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
        setError(response.error || "فشل تحميل الطلبات");
        return;
      }

      setRequests(response.data);
    } catch (loadError) {
      setRequests([]);
      setError(loadError instanceof Error ? loadError.message : "فشل تحميل الطلبات");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  React.useEffect(() => {
    if (!canApprove && activeTab === "pending") {
      setActiveTab("my");
    }
  }, [activeTab, canApprove]);

  const myRequests = currentUserId ? requests.filter((item) => item.employeeId === currentUserId) : [];
  const pendingApprovalRequests = requests.filter(
    (item) => item.status === "pending" && (!currentUserId || item.employeeId !== currentUserId)
  );

  const displayedRequests = activeTab === "my" ? myRequests : pendingApprovalRequests;
  const filteredRequests = displayedRequests.filter((item) => {
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const stats = {
    total: myRequests.length,
    pending: myRequests.filter((item) => item.status === "pending").length,
    approved: myRequests.filter((item) => item.status === "approved").length,
    rejected: myRequests.filter((item) => item.status === "rejected").length,
    pendingApproval: canApprove ? pendingApprovalRequests.length : 0,
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
      reason: "",
    });
  };

  const handleSubmit = async () => {
    if (!currentUserId) {
      setError("لا يوجد موظف مرتبط بالحساب الحالي");
      return;
    }

    if (!formData.date || !formData.reason.trim()) {
      setError("الرجاء إدخال التاريخ والسبب");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Parameters<typeof attendanceService.createRequest>[0] = {
        employeeId: currentUserId,
        type: formData.type,
        date: formData.date,
        reason: formData.reason.trim(),
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
        setError(response.error || "فشل تقديم الطلب");
        return;
      }

      toast.success("تم تقديم الطلب بنجاح");
      setIsAddOpen(false);
      resetForm();
      await loadRequests();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "فشل تقديم الطلب");
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
        setError(response.error || "فشل اعتماد الطلب");
        return;
      }

      toast.success("تم اعتماد الطلب");
      await loadRequests();
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : "فشل اعتماد الطلب");
    }
  };

  const handleReject = async () => {
    if (!canApprove || !rejectRequestId) {
      return;
    }

    if (!rejectReason.trim()) {
      setError("الرجاء كتابة سبب الرفض");
      return;
    }

    setIsRejecting(true);
    setError(null);

    try {
      const response = await attendanceService.rejectRequest(rejectRequestId, rejectReason.trim());
      if (!response.success) {
        setError(response.error || "فشل رفض الطلب");
        return;
      }

      toast.success("تم رفض الطلب");
      setRejectRequestId(null);
      setRejectReason("");
      await loadRequests();
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : "فشل رفض الطلب");
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
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي طلباتي</CardTitle>
            <IconFileDescription className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
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
            <CardTitle className="text-sm font-medium">معتمدة</CardTitle>
            <IconCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مرفوضة</CardTitle>
            <IconX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
        {canApprove && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">تحتاج موافقتك</CardTitle>
              <IconClock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.pendingApproval}</div>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "my" | "pending")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="my">طلباتي</TabsTrigger>
            {canApprove && (
              <TabsTrigger value="pending">
                بانتظار الموافقة
                {stats.pendingApproval > 0 && (
                  <Badge variant="destructive" className="me-2 h-5 w-5 justify-center p-0">
                    {stats.pendingApproval}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as AttendanceRequestType | "all")}>
              <SelectTrigger className="w-[150px]">
                <IconFilter className="ms-2 h-4 w-4" />
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                {Object.entries(requestTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label.ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AttendanceRequestStatus | "all")}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {Object.entries(requestStatusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label.ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <IconPlus className="ms-2 h-4 w-4" />
                  طلب جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle>طلب جديد</DialogTitle>
                  <DialogDescription>اختر نوع الطلب وأدخل البيانات المطلوبة.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>نوع الطلب</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData((current) => ({ ...current, type: value as AttendanceRequestType }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(requestTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(key as AttendanceRequestType)}
                              {label.ar}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>التاريخ</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(event) => setFormData((current) => ({ ...current, date: event.target.value }))}
                    />
                  </div>

                  {formData.type === "check_correction" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>وقت الحضور الصحيح</Label>
                        <Input
                          type="time"
                          value={formData.requestedCheckIn}
                          onChange={(event) =>
                            setFormData((current) => ({ ...current, requestedCheckIn: event.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>وقت الانصراف الصحيح</Label>
                        <Input
                          type="time"
                          value={formData.requestedCheckOut}
                          onChange={(event) =>
                            setFormData((current) => ({ ...current, requestedCheckOut: event.target.value }))
                          }
                        />
                      </div>
                    </div>
                  )}

                  {formData.type === "overtime" && (
                    <div className="space-y-2">
                      <Label>عدد ساعات العمل الإضافي</Label>
                      <Input
                        type="number"
                        min={1}
                        max={12}
                        value={formData.overtimeHours}
                        onChange={(event) =>
                          setFormData((current) => ({ ...current, overtimeHours: Number(event.target.value || 1) }))
                        }
                      />
                    </div>
                  )}

                  {formData.type === "permission" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>من الساعة</Label>
                        <Input
                          type="time"
                          value={formData.permissionStartTime}
                          onChange={(event) =>
                            setFormData((current) => ({ ...current, permissionStartTime: event.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>إلى الساعة</Label>
                        <Input
                          type="time"
                          value={formData.permissionEndTime}
                          onChange={(event) =>
                            setFormData((current) => ({ ...current, permissionEndTime: event.target.value }))
                          }
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>السبب</Label>
                    <Textarea
                      rows={3}
                      value={formData.reason}
                      onChange={(event) => setFormData((current) => ({ ...current, reason: event.target.value }))}
                      placeholder="اكتب سبب الطلب"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    تقديم الطلب
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="my">
          <RequestsTable
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

      <Dialog open={Boolean(rejectRequestId)} onOpenChange={(open) => !open && setRejectRequestId(null)}>
        <DialogContent className="w-full sm:max-w-md">
          <DialogHeader>
            <DialogTitle>رفض الطلب</DialogTitle>
            <DialogDescription>أدخل سبب الرفض ليظهر للموظف عند مراجعة الطلب.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="rejection-reason">سبب الرفض</Label>
            <Textarea
              id="rejection-reason"
              rows={4}
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="اكتب سبب الرفض"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectRequestId(null)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isRejecting}>
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
