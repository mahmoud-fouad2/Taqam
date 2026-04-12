ALTER TABLE "TenantAttendancePolicy"
ADD COLUMN "autoCalculateOvertime" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Employee"
ADD COLUMN "overtimeEligible" BOOLEAN NOT NULL DEFAULT false;