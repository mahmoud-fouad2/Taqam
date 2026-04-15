import { describe, expect, it } from "vitest";

import { getSetupAuditStepSnapshot } from "@/lib/setup-audit";
import { buildSetupDefaultLeaveTypes } from "@/lib/setup-defaults";

describe("buildSetupDefaultLeaveTypes", () => {
  it("always includes emergency leave", () => {
    expect(
      buildSetupDefaultLeaveTypes({
        annualLeaveEnabled: false,
        sickLeaveEnabled: false,
        leaveDaysPerYear: 21
      }).map((leaveType) => leaveType.code)
    ).toEqual(["emergency"]);
  });

  it("uses the configured annual leave days when annual leave is enabled", () => {
    const annualLeave = buildSetupDefaultLeaveTypes({
      annualLeaveEnabled: true,
      sickLeaveEnabled: true,
      leaveDaysPerYear: 28
    }).find((leaveType) => leaveType.code === "annual");

    expect(annualLeave?.defaultDays).toBe(28);
  });

  it("redacts raw registration identifiers from the company-profile audit snapshot", () => {
    expect(
      getSetupAuditStepSnapshot(1, {
        nameAr: "شركة المثال",
        commercialRegister: "1234567890",
        taxNumber: "3000000000"
      })
    ).toEqual({
      nameAr: "شركة المثال",
      nameEn: undefined,
      city: undefined,
      country: undefined,
      hasCommercialRegister: true,
      hasTaxNumber: true
    });
  });
});
