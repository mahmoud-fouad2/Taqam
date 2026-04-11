import * as z from "zod";

export const employeeSchema = z.object({
  employeeNumber: z.string().optional(),
  firstName: z.string().min(2, "الاسم الأول مطلوب"),
  firstNameAr: z.string().optional(),
  lastName: z.string().min(2, "اسم العائلة مطلوب"),
  lastNameAr: z.string().optional(),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  phone: z.string().optional(),
  nationalId: z.string().optional(),
  departmentId: z.string().min(1, "القسم مطلوب"),
  jobTitleId: z.string().min(1, "المسمى الوظيفي مطلوب"),
  managerId: z.string().optional(),
  hireDate: z.string().min(1, "تاريخ التعيين مطلوب"),
  contractType: z.string().min(1, "نوع العقد مطلوب"),
  basicSalary: z.string().optional(),
  status: z.string().optional()
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;
