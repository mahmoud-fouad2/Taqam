/**
 * Employees Service - API calls for employee management
 */

import apiClient, { ApiResponse } from "./client";
import type {
  ContractType,
  Employee,
  EmployeeCreateInput,
  EmployeeStatus,
  Gender,
  MaritalStatus
} from "@/lib/types/core-hr";

type ApiEmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN" | "TEMPORARY";
type ApiEmployeeStatus = "ACTIVE" | "ON_LEAVE" | "SUSPENDED" | "TERMINATED" | "RESIGNED";
type ApiGender = "MALE" | "FEMALE";
type ApiMaritalStatus = "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";

type ApiEmployee = {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  firstNameAr?: string | null;
  lastNameAr?: string | null;
  email: string;
  phone?: string | null;
  nationalId?: string | null;
  nationality?: string | null;
  dateOfBirth?: string | null;
  gender?: ApiGender | null;
  maritalStatus?: ApiMaritalStatus | null;
  departmentId?: string | null;
  jobTitleId?: string | null;
  managerId?: string | null;
  hireDate: string;
  employmentType?: ApiEmploymentType | null;
  status?: ApiEmployeeStatus | null;
  probationEndDate?: string | null;
  contractEndDate?: string | null;
  terminationDate?: string | null;
  baseSalary?: string | number | null;
  currency?: string | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
};

function toYmd(dateValue?: string | null): string | undefined {
  if (!dateValue) return undefined;
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().split("T")[0];
}

function mapEmploymentTypeFromApi(value?: ApiEmploymentType | null): ContractType {
  switch (value) {
    case "PART_TIME":
      return "part_time";
    case "CONTRACT":
    case "TEMPORARY":
      return "contract";
    case "INTERN":
      return "intern";
    case "FULL_TIME":
    default:
      return "full_time";
  }
}

function mapEmploymentTypeToApi(value?: ContractType | string | null): ApiEmploymentType {
  const normalized = String(value || "").toUpperCase();
  if (["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "TEMPORARY"].includes(normalized)) {
    return normalized as ApiEmploymentType;
  }
  switch (value) {
    case "part_time":
      return "PART_TIME";
    case "contract":
      return "CONTRACT";
    case "intern":
      return "INTERN";
    case "full_time":
    default:
      return "FULL_TIME";
  }
}

function mapStatusFromApi(value?: ApiEmployeeStatus | null): EmployeeStatus {
  switch (value) {
    case "ON_LEAVE":
      return "on_leave";
    case "TERMINATED":
    case "SUSPENDED":
    case "RESIGNED":
      return "terminated";
    case "ACTIVE":
    default:
      return "active";
  }
}

function mapStatusToApi(value?: EmployeeStatus | string | null): ApiEmployeeStatus {
  const normalized = String(value || "").toUpperCase();
  if (["ACTIVE", "ON_LEAVE", "SUSPENDED", "TERMINATED", "RESIGNED"].includes(normalized)) {
    return normalized as ApiEmployeeStatus;
  }
  switch (value) {
    case "on_leave":
      return "ON_LEAVE";
    case "terminated":
      return "TERMINATED";
    case "onboarding":
      return "ACTIVE";
    case "active":
    default:
      return "ACTIVE";
  }
}

function mapGenderToApi(value?: Gender | string | null): ApiGender | undefined {
  const normalized = String(value || "").toUpperCase();
  if (["MALE", "FEMALE"].includes(normalized)) return normalized as ApiGender;
  if (value === "male") return "MALE";
  if (value === "female") return "FEMALE";
  return undefined;
}

function mapGenderFromApi(value?: ApiGender | null): Gender | undefined {
  if (value === "MALE") return "male";
  if (value === "FEMALE") return "female";
  return undefined;
}

function mapMaritalStatusToApi(
  value?: MaritalStatus | string | null
): ApiMaritalStatus | undefined {
  const normalized = String(value || "").toUpperCase();
  if (["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"].includes(normalized))
    return normalized as ApiMaritalStatus;
  switch (value) {
    case "single":
      return "SINGLE";
    case "married":
      return "MARRIED";
    case "divorced":
      return "DIVORCED";
    case "widowed":
      return "WIDOWED";
    default:
      return undefined;
  }
}

function mapMaritalStatusFromApi(value?: ApiMaritalStatus | null): MaritalStatus | undefined {
  switch (value) {
    case "SINGLE":
      return "single";
    case "MARRIED":
      return "married";
    case "DIVORCED":
      return "divorced";
    case "WIDOWED":
      return "widowed";
    default:
      return undefined;
  }
}

function parseDecimal(value?: string | number | null): number | undefined {
  if (value === null || value === undefined) return undefined;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function mapEmployeeFromApi(emp: ApiEmployee): Employee {
  return {
    id: emp.id,
    employeeNumber: emp.employeeNumber,
    firstName: emp.firstName,
    firstNameAr: emp.firstNameAr ?? undefined,
    lastName: emp.lastName,
    lastNameAr: emp.lastNameAr ?? undefined,
    email: emp.email,
    phone: emp.phone ?? undefined,
    nationalId: emp.nationalId ?? undefined,
    nationality: emp.nationality ?? undefined,
    dateOfBirth: toYmd(emp.dateOfBirth) ?? undefined,
    gender: mapGenderFromApi(emp.gender ?? undefined),
    maritalStatus: mapMaritalStatusFromApi(emp.maritalStatus ?? undefined),
    departmentId: emp.departmentId ?? "",
    jobTitleId: emp.jobTitleId ?? "",
    managerId: emp.managerId ?? undefined,
    branchId: undefined,
    hireDate: toYmd(emp.hireDate) ?? emp.hireDate,
    contractType: mapEmploymentTypeFromApi(emp.employmentType ?? undefined),
    probationEndDate: toYmd(emp.probationEndDate) ?? undefined,
    status: mapStatusFromApi(emp.status ?? undefined),
    terminationDate: toYmd(emp.terminationDate) ?? undefined,
    terminationReason: undefined,
    basicSalary: parseDecimal(emp.baseSalary),
    currency: emp.currency ?? undefined,
    tenantId: emp.tenantId,
    createdAt: emp.createdAt,
    updatedAt: emp.updatedAt,
    createdBy: ""
  };
}

function mapEmployeeCreateToApi(input: EmployeeCreateInput) {
  return {
    employeeNumber: input.employeeNumber,
    firstName: input.firstName,
    firstNameAr: input.firstNameAr,
    lastName: input.lastName,
    lastNameAr: input.lastNameAr,
    email: input.email,
    phone: input.phone,
    nationalId: input.nationalId,
    departmentId: input.departmentId,
    jobTitleId: input.jobTitleId,
    managerId: input.managerId,
    hireDate: input.hireDate,
    employmentType: mapEmploymentTypeToApi(input.contractType),
    baseSalary: input.basicSalary
  };
}

function mapEmployeeUpdateToApi(input: Partial<Employee>) {
  return {
    firstName: input.firstName,
    firstNameAr: input.firstNameAr,
    lastName: input.lastName,
    lastNameAr: input.lastNameAr,
    email: input.email,
    phone: input.phone,
    nationalId: input.nationalId,
    nationality: input.nationality,
    dateOfBirth: input.dateOfBirth,
    gender: mapGenderToApi(input.gender),
    maritalStatus: mapMaritalStatusToApi(input.maritalStatus),
    departmentId: input.departmentId,
    jobTitleId: input.jobTitleId,
    managerId: input.managerId,
    hireDate: input.hireDate,
    employmentType: input.contractType ? mapEmploymentTypeToApi(input.contractType) : undefined,
    status: input.status ? mapStatusToApi(input.status) : undefined,
    baseSalary: input.basicSalary,
    currency: input.currency
  };
}

export interface EmployeeFilters {
  search?: string;
  departmentId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const employeesService = {
  /**
   * Get all employees with optional filters
   */
  async getAll(filters?: EmployeeFilters): Promise<ApiResponse<Employee[]>> {
    const res = await apiClient.get<ApiEmployee[]>("/employees", {
      params: filters as Record<string, string | number>
    });

    if (!res.success) {
      return {
        success: false,
        error: res.error,
        message: res.message,
        meta: res.meta
      };
    }
    return {
      ...res,
      data: (res.data || []).map(mapEmployeeFromApi)
    };
  },

  /**
   * Get single employee by ID
   */
  async getById(id: string): Promise<ApiResponse<Employee>> {
    const res = await apiClient.get<ApiEmployee>(`/employees/${id}`);
    if (!res.success) {
      return {
        success: false,
        error: res.error,
        message: res.message,
        meta: res.meta
      };
    }
    if (!res.data) return { success: false, error: "Employee not found" } as ApiResponse<Employee>;
    return { ...res, data: mapEmployeeFromApi(res.data) };
  },

  /**
   * Create new employee
   */
  async create(data: EmployeeCreateInput): Promise<ApiResponse<Employee>> {
    const res = await apiClient.post<ApiEmployee>("/employees", mapEmployeeCreateToApi(data));
    if (!res.success) {
      return {
        success: false,
        error: res.error,
        message: res.message,
        meta: res.meta
      };
    }
    if (!res.data)
      return { success: false, error: "Failed to create employee" } as ApiResponse<Employee>;
    return { ...res, data: mapEmployeeFromApi(res.data) };
  },

  /**
   * Update employee
   */
  async update(id: string, data: Partial<Employee>): Promise<ApiResponse<Employee>> {
    const res = await apiClient.put<ApiEmployee>(`/employees/${id}`, mapEmployeeUpdateToApi(data));
    if (!res.success) {
      return {
        success: false,
        error: res.error,
        message: res.message,
        meta: res.meta
      };
    }
    if (!res.data)
      return { success: false, error: "Failed to update employee" } as ApiResponse<Employee>;
    return { ...res, data: mapEmployeeFromApi(res.data) };
  },

  /**
   * Delete employee
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/employees/${id}`);
  },

  /**
   * Get employees by department
   */
  async getByDepartment(departmentId: string): Promise<ApiResponse<Employee[]>> {
    return apiClient.get<Employee[]>(`/departments/${departmentId}/employees`);
  },

  /**
   * Upload employee photo
   */
  async uploadPhoto(employeeId: string, file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append("photo", file);
    return apiClient.upload<{ url: string }>(`/employees/${employeeId}/photo`, formData);
  },

  /**
   * Import employees from CSV
   */
  async importCSV(file: File): Promise<ApiResponse<{ imported: number; errors: string[] }>> {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.upload(`/employees/import`, formData);
  },

  /**
   * Export employees to CSV
   */
  async exportCSV(filters?: EmployeeFilters): Promise<ApiResponse<Blob>> {
    return apiClient.get<Blob>("/employees/export", {
      params: filters as Record<string, string | number>,
      headers: { Accept: "text/csv" }
    });
  }
};

export default employeesService;
