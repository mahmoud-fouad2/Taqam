"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  IconPlus,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  LeaveRequestStatus,
  leaveRequestStatusLabels,
  leaveRequestStatusColors,
} from "@/lib/types/leave";
import { useEmployees } from "@/hooks/use-employees";
import { leavesApi } from "@/lib/api";

import { LeaveRequestsHeader } from "./_components/leave-requests-header";
import { LeaveRequestsStats } from "./_components/leave-requests-stats";
import { LeaveRequestsFilters } from "./_components/leave-requests-filters";
import { LeaveRequestsTable } from "./_components/leave-requests-table";
import { LeaveRequestsAddDialog } from "./_components/leave-requests-dialog-add";
import { LeaveRequestsViewDialog } from "./_components/leave-requests-dialog-view";
import { LeaveRequestsApproveDialog } from "./_components/leave-requests-dialog-approve";
import { LeaveRequestsRejectDialog } from "./_components/leave-requests-dialog-reject";
import type { ApiLeaveType, UiLeaveRequest } from "./_components/leave-requests-types";
import { mapRequestStatusToUi, toIso, toNumber, toYmd } from "./_components/leave-requests-types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leaveRequestSchema, type LeaveRequestFormData } from "./_components/leave-request-schema";

export function LeaveRequestsManager() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { employees, departments, isLoading: isEmployeesLoading, error: employeesError } = useEmployees();

  const [requests, setRequests] = useState<UiLeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<ApiLeaveType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<UiLeaveRequest | null>(null);
  const [approvalComment, setApprovalComment] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // URL-synced filters
  const activeTab = (searchParams.get("tab") ?? "all") as LeaveRequestStatus | "all";
  const searchQuery = searchParams.get("q") ?? "";
  const filterDepartment = searchParams.get("dept") ?? "all";

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const p = new URLSearchParams(searchParams.toString());
      if (value === "" || value === "all") p.delete(key);
      else p.set(key, value);
      router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const setActiveTab = (v: LeaveRequestStatus | "all") => updateFilter("tab", v);
  const setSearchQuery = (v: string) => updateFilter("q", v);
  const setFilterDepartment = (v: string) => updateFilter("dept", v);

  const leaveTypeById = useMemo(() => {
    const map = new Map<string, ApiLeaveType>();
    for (const t of leaveTypes) map.set(t.id, t);
    return map;
  }, [leaveTypes]);

  // React Hook Form with Zod validation for new leave request
  const leaveForm = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      employeeId: "",
      leaveTypeId: "",
      startDate: "",
      endDate: "",
      reason: "",
      isHalfDay: false,
      halfDayPeriod: "morning",
      delegateEmployeeId: "",
      emergencyContact: "",
      emergencyPhone: "",
    },
  });

  // Form state for new request normalized for dialog compatibility.
  const watchedFormData = leaveForm.watch();
  const formData = {
    employeeId: watchedFormData.employeeId ?? "",
    leaveTypeId: watchedFormData.leaveTypeId ?? "",
    startDate: watchedFormData.startDate ?? "",
    endDate: watchedFormData.endDate ?? "",
    reason: watchedFormData.reason ?? "",
    isHalfDay: watchedFormData.isHalfDay ?? false,
    halfDayPeriod: watchedFormData.halfDayPeriod ?? "morning",
    delegateEmployeeId: watchedFormData.delegateEmployeeId ?? "",
    emergencyContact: watchedFormData.emergencyContact ?? "",
    emergencyPhone: watchedFormData.emergencyPhone ?? "",
  };

  const onFormDataChange = (next: LeaveRequestFormData) => {
    leaveForm.reset(next);
  };

  const resetForm = () => {
    leaveForm.reset({
      employeeId: "",
      leaveTypeId: "",
      startDate: "",
      endDate: "",
      reason: "",
      isHalfDay: false,
      halfDayPeriod: "morning",
      delegateEmployeeId: "",
      emergencyContact: "",
      emergencyPhone: "",
    });
  };

  // Calculate days between dates
  const calculateDays = (start: string, end: string, isHalfDay: boolean): number => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return isHalfDay ? 0.5 : diffDays;
  };

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [leavesRes, typesRes] = await Promise.all([
        leavesApi.requests.getAll({ limit: 200 }),
        leavesApi.types.getAll(),
      ]);

      if (!leavesRes.success) {
        throw new Error(leavesRes.error || "فشل تحميل طلبات الإجازات");
      }

      if (!typesRes.success) {
        throw new Error(typesRes.error || "فشل تحميل أنواع الإجازات");
      }

      const mappedTypes: ApiLeaveType[] = Array.isArray(typesRes.data)
        ? (typesRes.data as any[]).map((t: any) => ({
            id: String(t.id),
            name: String(t.name ?? ""),
            nameAr: t.nameAr ?? null,
            code: String(t.code ?? ""),
            color: t.color ?? null,
            isActive: Boolean(t.isActive),
          }))
        : [];
      setLeaveTypes(mappedTypes);

      const mappedRequests: UiLeaveRequest[] = Array.isArray(leavesRes.data)
        ? (leavesRes.data as any[]).map((r: any) => {
            const employeeName = r?.employee
              ? `${String(r.employee.firstName ?? "")} ${String(r.employee.lastName ?? "")}`.trim()
              : "";
            return {
              id: String(r.id),
              employeeId: String(r.employeeId ?? ""),
              employeeName,
              employeeNumber: String(r.employee?.employeeNumber ?? ""),
              departmentId: String(r.employee?.departmentId ?? ""),
              departmentName: String(r.employee?.department?.name ?? ""),
              leaveTypeId: String(r.leaveTypeId ?? ""),
              leaveTypeName: String(r.leaveType?.name ?? ""),
              startDate: toYmd(r.startDate),
              endDate: toYmd(r.endDate),
              totalDays: toNumber(r.totalDays),
              isHalfDay: toNumber(r.totalDays) === 0.5,
              reason: String(r.reason ?? ""),
              status: mapRequestStatusToUi(r.status),
              attachmentUrl: r.attachmentUrl ?? null,
              delegateEmployeeId: r.delegateToId ?? null,
              createdAt: toIso(r.createdAt),
              updatedAt: toIso(r.updatedAt),
              approvedAt: toIso(r.approvedAt) ?? null,
              approvedById: r.approvedById ?? null,
              rejectionReason: r.rejectionReason ?? null,
            };
          })
        : [];
      setRequests(mappedRequests);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "فشل تحميل البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleAddRequest = leaveForm.handleSubmit(async (data: LeaveRequestFormData) => {
    try {
      // Convert "none" to undefined for delegateEmployeeId
      const delegateId = data.delegateEmployeeId === "none" || !data.delegateEmployeeId 
        ? undefined 
        : data.delegateEmployeeId;
        
      const res = await leavesApi.requests.create({
        employeeId: data.employeeId,
        leaveTypeId: data.leaveTypeId,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason || "",
        isHalfDay: data.isHalfDay,
        halfDayPeriod: data.halfDayPeriod,
        delegateEmployeeId: delegateId,
        emergencyContact: data.emergencyContact || undefined,
        emergencyPhone: data.emergencyPhone || undefined,
      });

      if (!res.success) {
        throw new Error(res.error || "فشل إنشاء طلب الإجازة");
      }

      toast.success("تم إرسال طلب الإجازة");
      setIsAddDialogOpen(false);
      resetForm();
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل إنشاء طلب الإجازة");
    }
  });

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      const res = await leavesApi.requests.approve(selectedRequest.id, approvalComment || undefined);
      if (!res.success) {
        throw new Error(res.error || "فشل الموافقة على الطلب");
      }
      toast.success("تمت الموافقة على الطلب");
      setIsApproveDialogOpen(false);
      setSelectedRequest(null);
      setApprovalComment("");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل الموافقة على الطلب");
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason) return;
    try {
      const res = await leavesApi.requests.reject(selectedRequest.id, rejectionReason);
      if (!res.success) {
        throw new Error(res.error || "فشل رفض الطلب");
      }
      toast.success("تم رفض الطلب");
      setIsRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason("");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل رفض الطلب");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const res = await leavesApi.requests.cancel(id);
      if (!res.success) {
        throw new Error(res.error || "فشل إلغاء الطلب");
      }
      toast.success("تم إلغاء الطلب");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل إلغاء الطلب");
    }
  };

  const handleBulkApprove = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => leavesApi.requests.approve(id)));
      toast.success(`تمت الموافقة على ${ids.length} طلب`);
      await loadData();
    } catch {
      toast.error("فشل الموافقة الجماعية");
    }
  };

  const handleBulkReject = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => leavesApi.requests.reject(id, "رفض جماعي")));
      toast.success(`تم رفض ${ids.length} طلب`);
      await loadData();
    } catch {
      toast.error("فشل الرفض الجماعي");
    }
  };

  // Filter requests
  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim();
    return requests.filter((r) => {
      const matchesTab = activeTab === "all" || r.status === activeTab;
      const matchesSearch =
        !q ||
        r.employeeName.includes(q) ||
        r.employeeNumber.includes(q) ||
        r.leaveTypeName.includes(q);
      const matchesDepartment = filterDepartment === "all" || r.departmentId === filterDepartment;
      return matchesTab && matchesSearch && matchesDepartment;
    });
  }, [requests, activeTab, searchQuery, filterDepartment]);

  // Stats
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    taken: requests.filter((r) => r.status === "taken").length,
  };

  const getStatusBadge = (status: LeaveRequestStatus) => (
    <Badge className={leaveRequestStatusColors[status]}>
      {leaveRequestStatusLabels[status]}
    </Badge>
  );

  return (
    <div className="space-y-6">
      <LeaveRequestsHeader onAdd={() => setIsAddDialogOpen(true)} />

      {/* Stats Cards */}
      <LeaveRequestsStats stats={stats} />

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <LeaveRequestsFilters
            activeTab={activeTab}
            onActiveTabChange={setActiveTab}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            filterDepartment={filterDepartment}
            onFilterDepartmentChange={setFilterDepartment}
            departments={departments.map((d) => ({ id: d.id, name: d.name }))}
          />
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
            <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
              <Progress value={35} className="h-2 w-40" />
              جاري التحميل...
            </div>
          )}
          <LeaveRequestsTable
            requests={filteredRequests}
            getLeaveTypeCode={(leaveTypeId) => leaveTypeById.get(leaveTypeId)?.code || ""}
            getStatusBadge={getStatusBadge}
            onView={(request) => {
              setSelectedRequest(request);
              setIsViewDialogOpen(true);
            }}
            onApprove={(request) => {
              setSelectedRequest(request);
              setIsApproveDialogOpen(true);
            }}
            onReject={(request) => {
              setSelectedRequest(request);
              setIsRejectDialogOpen(true);
            }}
            onCancel={handleCancel}
            onBulkApprove={handleBulkApprove}
            onBulkReject={handleBulkReject}
          />
        </CardContent>
      </Card>

      <LeaveRequestsAddDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        employees={employees}
        leaveTypes={leaveTypes}
        formData={formData}
        onFormDataChange={onFormDataChange}
        calculateDays={calculateDays}
        onSubmit={handleAddRequest}
      />

      <LeaveRequestsViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        request={selectedRequest}
        employees={employees}
        getStatusBadge={getStatusBadge}
      />

      <LeaveRequestsApproveDialog
        open={isApproveDialogOpen}
        onOpenChange={setIsApproveDialogOpen}
        approvalComment={approvalComment}
        onApprovalCommentChange={setApprovalComment}
        onApprove={handleApprove}
      />

      <LeaveRequestsRejectDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        rejectionReason={rejectionReason}
        onRejectionReasonChange={setRejectionReason}
        onReject={handleReject}
      />
    </div>
  );
}
