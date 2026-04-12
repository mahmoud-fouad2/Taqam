"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { IconPlus, IconRefresh } from "@tabler/icons-react";
import { ExportButton } from "@/components/export-button";

import type {
  Employee,
  Department,
  JobTitle,
  ContractType,
  EmployeeStatus
} from "@/lib/types/core-hr";
import { departmentsService, employeesService, jobTitlesService } from "@/lib/api";

import { EmployeeFormDialog } from "./_components/employee-form-dialog";
import { EmployeeDeleteDialog } from "./_components/employee-delete-dialog";
import { EmployeesFilters } from "./_components/employees-filters";
import { EmployeesList } from "./_components/employees-list";
import { EmployeesStats } from "./_components/employees-stats";
import { EmployeesImportDialog } from "./_components/employees-import-dialog";
import type { EmployeeFormData } from "./_components/employee-form-schema";
import { employeeSchema } from "./_components/employee-form-schema";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function EmployeesManager() {
  const locale = useClientLocale();
  const t = getText(locale);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [saving, setSaving] = useState(false);

  // URL-synced filters — survives refresh & can be shared as links
  const searchQuery = searchParams.get("q") ?? "";
  const filterDept = searchParams.get("dept") ?? "all";
  const filterStatus = searchParams.get("status") ?? "all";
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const p = new URLSearchParams(searchParams.toString());
      if (value === "" || value === "all") p.delete(key);
      else p.set(key, value);
      router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const setSearchQuery = (v: string) => updateFilter("q", v);
  const setFilterDept = (v: string) => updateFilter("dept", v);
  const setFilterStatus = (v: string) => updateFilter("status", v);
  const openDialog = searchParams.get("open");
  const editEmployeeId = searchParams.get("edit");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  // Fetch data from API using React Query
  const {
    data: employees = [],
    isLoading: isLoadingEmployees,
    refetch: refetchEmployees
  } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await employeesService.getAll();
      if (!res.success) throw new Error(res.error || "Failed to fetch employees");
      return res.data || [];
    }
  });

  const { data: departments = [], isLoading: isLoadingDepartments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await departmentsService.getAll();
      if (!res.success) throw new Error(res.error || "Failed to fetch departments");
      return res.data || [];
    }
  });

  const { data: jobTitles = [], isLoading: isLoadingJobTitles } = useQuery({
    queryKey: ["jobTitles"],
    queryFn: async () => {
      const res = await jobTitlesService.getAll();
      if (!res.success) throw new Error(res.error || "Failed to fetch job titles");
      return res.data || [];
    }
  });

  const loading = isLoadingEmployees || isLoadingDepartments || isLoadingJobTitles;

  const fetchEmployees = async () => {
    await refetchEmployees();
  };

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchQuery(searchQuery), 200);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeNumber: "",
      firstName: "",
      firstNameAr: "",
      lastName: "",
      lastNameAr: "",
      email: "",
      phone: "",
      nationalId: "",
      departmentId: "",
      jobTitleId: "",
      managerId: "",
      hireDate: "",
      contractType: "full_time",
      overtimeEligible: false,
      basicSalary: "",
      status: "active"
    }
  });

  // Filter
  const filteredEmployees = employees.filter((emp) => {
    const query = debouncedSearchQuery.toLowerCase();
    const matchesSearch =
      emp.firstName?.toLowerCase().includes(query) ||
      emp.firstNameAr?.toLowerCase().includes(query) ||
      emp.lastName?.toLowerCase().includes(query) ||
      emp.lastNameAr?.toLowerCase().includes(query) ||
      emp.email?.toLowerCase().includes(query) ||
      emp.employeeNumber?.toLowerCase().includes(query);
    const matchesDept = filterDept === "all" || emp.departmentId === filterDept;
    const matchesStatus = filterStatus === "all" || emp.status === filterStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const departmentNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of departments) {
      map.set(d.id, d.nameAr || d.name || "-");
    }
    return map;
  }, [departments]);

  const jobTitleNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const j of jobTitles) {
      map.set(j.id, j.nameAr || j.name || "-");
    }
    return map;
  }, [jobTitles]);

  const getDeptName = (id: string) => departmentNameById.get(id) || "-";
  const getJobName = (id: string) => jobTitleNameById.get(id) || "-";

  // Add
  const clearDialogParam = useCallback(
    (key: string) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete(key);
      const nextQuery = nextParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const handleAdd = useCallback(() => {
    setEditingEmployee(null);
    const nextNum = employees.length + 1;
    form.reset({
      employeeNumber: `EMP${String(nextNum).padStart(3, "0")}`,
      firstName: "",
      firstNameAr: "",
      lastName: "",
      lastNameAr: "",
      email: "",
      phone: "",
      nationalId: "",
      departmentId: "",
      jobTitleId: "",
      managerId: "",
      hireDate: new Date().toISOString().split("T")[0],
      contractType: "full_time",
      overtimeEligible: false,
      basicSalary: "",
      status: "onboarding"
    });
    setIsDialogOpen(true);
  }, [employees.length, form]);

  const handleEdit = useCallback(
    (emp: Employee) => {
      setEditingEmployee(emp);
      form.reset({
        employeeNumber: emp.employeeNumber,
        firstName: emp.firstName,
        firstNameAr: emp.firstNameAr || "",
        lastName: emp.lastName,
        lastNameAr: emp.lastNameAr || "",
        email: emp.email,
        phone: emp.phone || "",
        nationalId: emp.nationalId || "",
        departmentId: emp.departmentId,
        jobTitleId: emp.jobTitleId,
        managerId: emp.managerId || "",
        hireDate: emp.hireDate,
        contractType: emp.contractType,
        overtimeEligible: Boolean(emp.overtimeEligible),
        basicSalary: emp.basicSalary?.toString() || "",
        status: emp.status
      });
      setIsDialogOpen(true);
    },
    [form]
  );

  useEffect(() => {
    if (loading || openDialog !== "new") {
      return;
    }

    handleAdd();
    clearDialogParam("open");
  }, [loading, openDialog, handleAdd, clearDialogParam]);

  useEffect(() => {
    if (loading || !editEmployeeId) {
      return;
    }

    const employee = employees.find((item) => item.id === editEmployeeId);
    if (employee) {
      handleEdit(employee);
    }

    clearDialogParam("edit");
  }, [loading, editEmployeeId, employees, handleEdit, clearDialogParam]);

  // Submit
  const onSubmit = async (data: EmployeeFormData) => {
    setSaving(true);
    try {
      if (editingEmployee) {
        const res = await employeesService.update(editingEmployee.id, {
          employeeNumber: data.employeeNumber || editingEmployee.employeeNumber,
          firstName: data.firstName,
          firstNameAr: data.firstNameAr || undefined,
          lastName: data.lastName,
          lastNameAr: data.lastNameAr || undefined,
          email: data.email,
          phone: data.phone || undefined,
          nationalId: data.nationalId || undefined,
          departmentId: data.departmentId,
          jobTitleId: data.jobTitleId,
          managerId: data.managerId || undefined,
          hireDate: data.hireDate,
          contractType: data.contractType as ContractType,
          overtimeEligible: data.overtimeEligible,
          basicSalary: data.basicSalary ? parseFloat(data.basicSalary) : undefined,
          status: (data.status as EmployeeStatus) || editingEmployee.status
        });
        if (!res.success) throw new Error(res.error || "Failed to update employee");
        toast.success(t.employees.updatedSuccess);
        await fetchEmployees();
      } else {
        const res = await employeesService.create({
          employeeNumber: data.employeeNumber || undefined,
          firstName: data.firstName,
          firstNameAr: data.firstNameAr || undefined,
          lastName: data.lastName,
          lastNameAr: data.lastNameAr || undefined,
          email: data.email,
          phone: data.phone || undefined,
          nationalId: data.nationalId || undefined,
          departmentId: data.departmentId,
          jobTitleId: data.jobTitleId,
          managerId: data.managerId || undefined,
          hireDate: data.hireDate,
          contractType: data.contractType as ContractType,
          overtimeEligible: data.overtimeEligible,
          basicSalary: data.basicSalary ? parseFloat(data.basicSalary) : undefined
        });
        if (!res.success) throw new Error(res.error || "Failed to create employee");
        toast.success(t.employees.addedSuccess);
        await fetchEmployees();
      }
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error saving employee:", error);
      toast.error(editingEmployee ? t.employees.updateFailed : t.employees.addFailed);
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDeleteClick = (emp: Employee) => {
    setEmployeeToDelete(emp);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (employeeToDelete) {
      try {
        const wasTerminated = employeeToDelete.status === "terminated";
        const res = await employeesService.delete(employeeToDelete.id);
        if (!res.success) throw new Error(res.error || "Failed to delete employee");
        toast.success(wasTerminated ? t.employees.deletedPermanently : t.employees.terminated);
        await fetchEmployees();
      } catch (error) {
        console.error("Error deleting employee:", error);
        toast.error(t.employees.deleteFailed);
      } finally {
        setDeleteDialogOpen(false);
        setEmployeeToDelete(null);
      }
    }
  };

  // Stats
  const activeCount = employees.filter((e) => e.status === "active").length;
  const onboardingCount = employees.filter((e) => e.status === "onboarding").length;

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-2 h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <EmployeesStats
        totalEmployees={employees.length}
        activeCount={activeCount}
        onboardingCount={onboardingCount}
        departmentsCount={departments.length}
      />

      {/* Main */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t.employees.title}</CardTitle>
              <CardDescription>{t.employees.subtitle}</CardDescription>
            </div>
            <div className="flex gap-2">
              <ExportButton
                type="employees"
                filters={{
                  departmentId: filterDept !== "all" ? filterDept : "",
                  status: filterStatus !== "all" ? filterStatus : ""
                }}
              />
              <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                {t.employees.importCsv}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchEmployees}
                aria-label={t.common.refresh}
                title={t.common.refresh}>
                <IconRefresh className="h-4 w-4" />
              </Button>
              <Button onClick={handleAdd}>
                <IconPlus className="ms-2 h-4 w-4" />
                {t.employees.addEmployee}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <EmployeesFilters
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            filterDept={filterDept}
            onFilterDeptChange={setFilterDept}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            departments={departments}
          />
          <EmployeesList
            employees={filteredEmployees}
            getDeptName={getDeptName}
            getJobName={getJobName}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
          />
        </CardContent>
      </Card>

      <EmployeeFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingEmployee={editingEmployee}
        departments={departments}
        jobTitles={jobTitles}
        employees={employees}
        form={form}
        saving={saving}
        onSubmit={onSubmit}
      />

      <EmployeeDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        employee={employeeToDelete}
        onConfirm={confirmDelete}
      />

      <EmployeesImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImported={fetchEmployees}
      />
    </div>
  );
}
