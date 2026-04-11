import * as z from "zod";

export const leaveRequestSchema = z
  .object({
    employeeId: z.string().min(1, "الموظف مطلوب"),
    leaveTypeId: z.string().min(1, "نوع الإجازة مطلوب"),
    startDate: z.string().min(1, "تاريخ البداية مطلوب"),
    endDate: z.string().min(1, "تاريخ النهاية مطلوب"),
    reason: z.string().optional(),
    isHalfDay: z.boolean().default(false),
    halfDayPeriod: z.enum(["morning", "afternoon"]).default("morning"),
    delegateEmployeeId: z.string().optional(),
    emergencyContact: z.string().optional(),
    emergencyPhone: z.string().optional()
  })
  .refine((data) => !data.endDate || !data.startDate || data.endDate >= data.startDate, {
    message: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية",
    path: ["endDate"]
  });

export type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;
