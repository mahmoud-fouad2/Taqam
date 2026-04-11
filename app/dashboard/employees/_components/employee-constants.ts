import type { ContractType, EmployeeStatus } from "@/lib/types/core-hr";

export const contractTypes: { value: ContractType; label: string }[] = [
  { value: "full_time", label: "دوام كامل" },
  { value: "part_time", label: "دوام جزئي" },
  { value: "contract", label: "عقد مؤقت" },
  { value: "intern", label: "متدرب" }
];

export const statusOptions: { value: EmployeeStatus; label: string; color: string }[] = [
  { value: "active", label: "نشط", color: "bg-green-500" },
  { value: "onboarding", label: "قيد التعيين", color: "bg-blue-500" },
  { value: "on_leave", label: "في إجازة", color: "bg-yellow-500" },
  { value: "terminated", label: "منتهي الخدمة", color: "bg-red-500" }
];
