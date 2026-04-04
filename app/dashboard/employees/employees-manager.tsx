"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { IconPlus, IconRefresh } from "@tabler/icons-react";
import { ExportButton } from "@/components/export-button";

import type { Employee, Department, JobTitle, ContractType, EmployeeStatus } from "@/lib/types/core-hr";
import { departmentsService, employeesService, jobTitlesService } from "@/lib/api";

import { EmployeeFormDialog } from "./_components/employee-form-dialog";
import { EmployeeViewDialog } from "./_components/employee-view-dialog";
import { EmployeeDeleteDialog } from "./_components/employee-delete-dialog";
import { EmployeesFilters } from "./_components/employees-filters";
import { EmployeesList } from "./_components/employees-list";
import { EmployeesStats } from "./_components/employees-stats";
import { EmployeesImportDialog } from "./_components/employees-import-dialog";
import type { EmployeeFormData } from "./_components/employee-form-schema";
import { employeeSchema } from "./_components/employee-form-schema";

export function EmployeesManager() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [loading, setLoading] = useState(true);
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
    [router, pathname, searchParams],
  );

  const setSearchQuery = (v: string) => updateFilter("q", v);
  const setFilterDept = (v: string) => updateFilter("dept", v);
  const setFilterStatus = (v: string) => updateFilter("status", v);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  // Fetch data from API
  const fetchEmployees = useCallback(async () => {
    try {
      const res = await employeesService.getAll();
      if (!res.success) throw new Error(res.error || "Failed to fetch employees");
      setEmployees(res.data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("فشل في جلب بيانات الموظفين");
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await departmentsService.getAll();
      if (!res.success) throw new Error(res.error || "Failed to fetch departments");
      setDepartments(res.data || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  }, []);

  const fetchJobTitles = useCallback(async () => {
    try {
      const res = await jobTitlesService.getAll();
      if (!res.success) throw new Error(res.error || "Failed to fetch job titles");
      setJobTitles(res.data || []);
    } catch (error) {
      console.error("Error fetching job titles:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchEmployees(), fetchDepartments(), fetchJobTitles()]);
      setLoading(false);
    };
    loadData();
  }, [fetchEmployees, fetchDepartments, fetchJobTitles]);

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
      basicSalary: "",
      status: "active",
    },
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
  const handleAdd = () => {
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
      basicSalary: "",
      status: "onboarding",
    });
    setIsDialogOpen(true);
  };

  // Edit
  const handleEdit = (emp: Employee) => {
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
      basicSalary: emp.basicSalary?.toString() || "",
      status: emp.status,
    });
    setIsDialogOpen(true);
  };

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
          basicSalary: data.basicSalary ? parseFloat(data.basicSalary) : undefined,
          status: (data.status as EmployeeStatus) || editingEmployee.status,
        });
        if (!res.success) throw new Error(res.error || "Failed to update employee");
        toast.success("تم تحديث بيانات الموظف بنجاح");
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
          basicSalary: data.basicSalary ? parseFloat(data.basicSalary) : undefined,
        });
        if (!res.success) throw new Error(res.error || "Failed to create employee");
        toast.success("تم إضافة الموظف بنجاح");
        await fetchEmployees();
      }
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error saving employee:", error);
      toast.error(editingEmployee ? "فشل في تحديث الموظف" : "فشل في إضافة الموظف");
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
        toast.success(
          wasTerminated
            ? "تم حذف الموظف نهائياً"
            : "تم إنهاء خدمة الموظف (يمكن الحذف النهائي لاحقاً)"
        );
        await fetchEmployees();
      } catch (error) {
        console.error("Error deleting employee:", error);
        toast.error("فشل في حذف الموظف");
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
                <Skeleton className="h-8 w-16 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
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
              <CardTitle>الموظفون</CardTitle>
              <CardDescription>إدارة بيانات الموظفين</CardDescription>
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
                استيراد CSV
              </Button>
              <Button variant="outline" size="icon" onClick={fetchEmployees} aria-label="تحديث" title="تحديث">
                <IconRefresh className="h-4 w-4" />
              </Button>
              <Button onClick={handleAdd}>
                <IconPlus className="ms-2 h-4 w-4" />
                إضافة موظف
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
            onView={(emp) => setViewingEmployee(emp)}
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
        form={form}
        saving={saving}
        onSubmit={onSubmit}
      />

      <EmployeeViewDialog
        employee={viewingEmployee}
        onClose={() => setViewingEmployee(null)}
        onEdit={handleEdit}
        getDeptName={getDeptName}
        getJobName={getJobName}
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
