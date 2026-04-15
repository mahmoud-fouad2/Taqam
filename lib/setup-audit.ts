export function getSetupAuditStepSnapshot(
  step: number,
  stepData: Record<string, unknown>
): Record<string, unknown> {
  if (step === 1) {
    return {
      nameAr: typeof stepData.nameAr === "string" ? stepData.nameAr : undefined,
      nameEn: typeof stepData.nameEn === "string" ? stepData.nameEn : undefined,
      city: typeof stepData.city === "string" ? stepData.city : undefined,
      country: typeof stepData.country === "string" ? stepData.country : undefined,
      hasCommercialRegister: Boolean(stepData.commercialRegister),
      hasTaxNumber: Boolean(stepData.taxNumber)
    };
  }

  if (step === 2) {
    return {
      timezone: typeof stepData.timezone === "string" ? stepData.timezone : undefined,
      currency: typeof stepData.currency === "string" ? stepData.currency : undefined,
      weekStartDay: typeof stepData.weekStartDay === "number" ? stepData.weekStartDay : undefined
    };
  }

  if (step === 3) {
    return {
      departmentName:
        typeof stepData.departmentName === "string" ? stepData.departmentName : undefined,
      departmentNameAr:
        typeof stepData.departmentNameAr === "string" ? stepData.departmentNameAr : undefined,
      jobTitleName: typeof stepData.jobTitleName === "string" ? stepData.jobTitleName : undefined,
      jobTitleNameAr:
        typeof stepData.jobTitleNameAr === "string" ? stepData.jobTitleNameAr : undefined
    };
  }

  if (step === 4) {
    return {
      action: typeof stepData.action === "string" ? stepData.action : undefined,
      email: typeof stepData.email === "string" ? stepData.email : undefined,
      firstName: typeof stepData.firstName === "string" ? stepData.firstName : undefined,
      lastName: typeof stepData.lastName === "string" ? stepData.lastName : undefined
    };
  }

  if (step === 5) {
    return {
      leaveDaysPerYear:
        typeof stepData.leaveDaysPerYear === "number" ? stepData.leaveDaysPerYear : undefined,
      annualLeaveEnabled:
        typeof stepData.annualLeaveEnabled === "boolean" ? stepData.annualLeaveEnabled : undefined,
      sickLeaveEnabled:
        typeof stepData.sickLeaveEnabled === "boolean" ? stepData.sickLeaveEnabled : undefined,
      payrollEnabled:
        typeof stepData.payrollEnabled === "boolean" ? stepData.payrollEnabled : undefined,
      seedSampleData:
        typeof stepData.seedSampleData === "boolean" ? stepData.seedSampleData : undefined
    };
  }

  return {};
}
