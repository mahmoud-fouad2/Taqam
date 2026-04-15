export type SetupLeavePoliciesSnapshot = {
  leaveDaysPerYear?: number;
  annualLeaveEnabled?: boolean;
  sickLeaveEnabled?: boolean;
};

export type SetupDefaultLeaveType = {
  name: string;
  nameAr: string;
  code: string;
  defaultDays: number;
  isActive: boolean;
};

export function buildSetupDefaultLeaveTypes(
  step5?: SetupLeavePoliciesSnapshot
): SetupDefaultLeaveType[] {
  const annualDays = step5?.leaveDaysPerYear ?? 21;
  const annualEnabled = step5?.annualLeaveEnabled ?? true;
  const sickEnabled = step5?.sickLeaveEnabled ?? true;

  return [
    ...(annualEnabled
      ? [
          {
            name: "Annual Leave",
            nameAr: "إجازة سنوية",
            code: "annual",
            defaultDays: annualDays,
            isActive: true
          }
        ]
      : []),
    ...(sickEnabled
      ? [
          {
            name: "Sick Leave",
            nameAr: "إجازة مرضية",
            code: "sick",
            defaultDays: 30,
            isActive: true
          }
        ]
      : []),
    {
      name: "Emergency Leave",
      nameAr: "إجازة طارئة",
      code: "emergency",
      defaultDays: 3,
      isActive: true
    }
  ];
}
