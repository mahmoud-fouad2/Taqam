/**
 * Employees Data Hook - Centralized employee data management
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Employee, Department } from "@/lib/types/core-hr";

const INITIAL_EMPLOYEES: Employee[] = [];
const INITIAL_DEPARTMENTS: Department[] = [];

type EmployeesApiResponse = {
  data?: Array<any>;
  error?: string;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
};

type DepartmentsApiResponse = {
  data?: Array<any>;
  error?: string;
};

function mapEmploymentTypeToContractType(
  value: string | null | undefined
): Employee["contractType"] {
  switch (value) {
    case "FULL_TIME":
      return "full_time";
    case "PART_TIME":
      return "part_time";
    case "CONTRACT":
      return "contract";
    case "INTERN":
      return "intern";
    default:
      return "full_time";
  }
}

function mapEmployeeStatusToUi(value: string | null | undefined): Employee["status"] {
  switch (value) {
    case "ACTIVE":
      return "active";
    case "ON_LEAVE":
      return "on_leave";
    case "TERMINATED":
      return "terminated";
    default:
      return "active";
  }
}

function mapEmployeeFromApi(emp: any): Employee {
  return {
    id: String(emp.id),
    employeeNumber: String(emp.employeeNumber ?? ""),
    firstName: String(emp.firstName ?? ""),
    firstNameAr: emp.firstNameAr ?? undefined,
    lastName: String(emp.lastName ?? ""),
    lastNameAr: emp.lastNameAr ?? undefined,
    email: String(emp.email ?? ""),
    phone: emp.phone ?? undefined,
    nationalId: emp.nationalId ?? undefined,
    nationality: emp.nationality ?? undefined,
    dateOfBirth: emp.dateOfBirth ? new Date(emp.dateOfBirth).toISOString().slice(0, 10) : undefined,
    gender: emp.gender === "FEMALE" ? "female" : emp.gender === "MALE" ? "male" : undefined,
    maritalStatus:
      emp.maritalStatus === "SINGLE"
        ? "single"
        : emp.maritalStatus === "MARRIED"
          ? "married"
          : emp.maritalStatus === "DIVORCED"
            ? "divorced"
            : emp.maritalStatus === "WIDOWED"
              ? "widowed"
              : undefined,
    departmentId: String(emp.departmentId ?? ""),
    jobTitleId: String(emp.jobTitleId ?? ""),
    managerId: emp.managerId ?? undefined,
    branchId: undefined,
    hireDate: emp.hireDate ? new Date(emp.hireDate).toISOString().slice(0, 10) : "",
    contractType: mapEmploymentTypeToContractType(emp.employmentType),
    probationEndDate: emp.probationEndDate
      ? new Date(emp.probationEndDate).toISOString().slice(0, 10)
      : undefined,
    status: mapEmployeeStatusToUi(emp.status),
    terminationDate: emp.terminationDate
      ? new Date(emp.terminationDate).toISOString().slice(0, 10)
      : undefined,
    terminationReason: undefined,
    basicSalary: emp.baseSalary != null ? Number(emp.baseSalary) : undefined,
    currency: emp.currency ?? undefined,
    tenantId: String(emp.tenantId ?? ""),
    createdAt: emp.createdAt ? new Date(emp.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: emp.updatedAt ? new Date(emp.updatedAt).toISOString() : new Date().toISOString(),
    createdBy: emp.userId ? String(emp.userId) : ""
  };
}

function mapDepartmentFromApi(dept: any, employees: Employee[]): Department {
  const id = String(dept.id);
  return {
    id,
    name: String(dept.name ?? ""),
    nameAr: dept.nameAr ?? undefined,
    code: dept.code ?? undefined,
    description: dept.description ?? undefined,
    parentId: dept.parentId ?? undefined,
    managerId: dept.managerId ?? undefined,
    employeesCount: employees.filter((e) => e.departmentId === id).length,
    tenantId: String(dept.tenantId ?? ""),
    createdAt: dept.createdAt ? new Date(dept.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: dept.updatedAt ? new Date(dept.updatedAt).toISOString() : new Date().toISOString()
  };
}

interface UseEmployeesOptions {
  departmentId?: string;
  status?: "active" | "inactive" | "on_leave" | "terminated";
  search?: string;
}

interface UseEmployeesReturn {
  employees: Employee[];
  departments: Department[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getEmployeeById: (id: string) => Employee | undefined;
  getEmployeeFullName: (employeeId: string) => string;
  getDepartmentById: (id: string) => Department | undefined;
  getEmployeesByDepartment: (departmentId: string) => Employee[];
}

export function useEmployees(options: UseEmployeesOptions = {}): UseEmployeesReturn {
  const {
    data,
    isLoading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ["useEmployees", options.departmentId, options.status, options.search],
    queryFn: async () => {
      const [empRes, deptRes] = await Promise.all([
        fetch(
          `/api/employees?limit=1000&search=${encodeURIComponent(options.search || "")}` +
            (options.departmentId
              ? `&departmentId=${encodeURIComponent(options.departmentId)}`
              : "") +
            (options.status
              ? `&status=${encodeURIComponent(
                  options.status === "active"
                    ? "ACTIVE"
                    : options.status === "on_leave"
                      ? "ON_LEAVE"
                      : options.status === "terminated"
                        ? "TERMINATED"
                        : "ACTIVE"
                )}`
              : "")
        ),
        fetch("/api/departments")
      ]);

      const empJson = (await empRes.json()) as EmployeesApiResponse;
      const deptJson = (await deptRes.json()) as DepartmentsApiResponse;

      if (!empRes.ok) {
        throw new Error(empJson.error || "فشل تحميل الموظفين");
      }
      if (!deptRes.ok) {
        throw new Error(deptJson.error || "فشل تحميل الأقسام");
      }

      const mappedEmployees = Array.isArray(empJson.data)
        ? empJson.data.map(mapEmployeeFromApi)
        : [];
      const mappedDepartments = Array.isArray(deptJson.data)
        ? deptJson.data.map((d) => mapDepartmentFromApi(d, mappedEmployees))
        : [];

      return { employees: mappedEmployees, departments: mappedDepartments };
    }
  });

  const employees = data?.employees || INITIAL_EMPLOYEES;
  const departments = data?.departments || INITIAL_DEPARTMENTS;
  const error =
    queryError instanceof Error ? queryError.message : queryError ? "فشل تحميل البيانات" : null;

  const getEmployeeById = useCallback(
    (id: string) => employees.find((e) => e.id === id),
    [employees]
  );

  const getEmployeeFullName = useCallback(
    (employeeId: string): string => {
      const emp = employees.find((e) => e.id === employeeId);
      if (!emp) return "غير معروف";
      return `${emp.firstName} ${emp.lastName}`;
    },
    [employees]
  );

  const getDepartmentById = useCallback(
    (id: string) => departments.find((d) => d.id === id),
    [departments]
  );

  const getEmployeesByDepartment = useCallback(
    (departmentId: string) => employees.filter((e) => e.departmentId === departmentId),
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    let result = employees;

    if (options.departmentId) {
      result = result.filter((e) => e.departmentId === options.departmentId);
    }
    if (options.status) {
      result = result.filter((e) => e.status === options.status);
    }
    if (options.search) {
      const search = options.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.firstName.toLowerCase().includes(search) ||
          e.lastName.toLowerCase().includes(search) ||
          e.email.toLowerCase().includes(search) ||
          e.employeeNumber?.toLowerCase().includes(search)
      );
    }

    return result;
  }, [employees, options.departmentId, options.status, options.search]);

  return {
    employees: filteredEmployees,
    departments,
    isLoading,
    error,
    refetch: async () => {
      await refetch();
    },
    getEmployeeById,
    getEmployeeFullName,
    getDepartmentById,
    getEmployeesByDepartment
  };
}

export default useEmployees;
