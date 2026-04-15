/**
 * Smart Alerts — Automated HR Notifications
 *
 * Computes upcoming HR events that require attention:
 * - Documents expiring within the next 30 days
 * - Employee contracts ending within 30 days
 * - Probation periods ending within 14 days
 * - Work anniversaries today (±1 day for timezone tolerance)
 * - Birthdays today (±1 day)
 */
import prisma from "@/lib/db";

export type AlertSeverity = "info" | "warning" | "urgent";

export type SmartAlert = {
  id: string;
  type: "document_expiry" | "contract_end" | "probation_end" | "work_anniversary" | "birthday";
  severity: AlertSeverity;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  employeeId: string;
  employeeName: string;
  daysUntil: number | null; // null for anniversary/birthday (already today)
  referenceDate: Date;
};

function getEmployeeNames(employee: {
  firstName: string;
  lastName: string;
  firstNameAr: string | null;
  lastNameAr: string | null;
}) {
  return {
    ar:
      employee.firstNameAr && employee.lastNameAr
        ? `${employee.firstNameAr} ${employee.lastNameAr}`
        : `${employee.firstName} ${employee.lastName}`,
    en: `${employee.firstName} ${employee.lastName}`.trim()
  };
}

function formatYearsWorkedEn(yearsWorked: number) {
  return yearsWorked === 1 ? "1 year" : `${yearsWorked} years`;
}

/** Get smart alerts for a tenant within the next `horizonDays` days */
export async function getSmartAlerts(tenantId: string, horizonDays = 30): Promise<SmartAlert[]> {
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const horizonDate = new Date(todayUTC.getTime() + horizonDays * 24 * 60 * 60 * 1000);

  const alerts: SmartAlert[] = [];

  // ── 1. Expiring documents ─────────────────────────────────────────────────
  const expiringDocs = await prisma.document.findMany({
    where: {
      tenantId,
      expiryDate: { gte: todayUTC, lte: horizonDate },
      status: "APPROVED"
    },
    select: {
      id: true,
      expiryDate: true,
      category: true,
      titleAr: true,
      title: true,
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          firstNameAr: true,
          lastNameAr: true
        }
      }
    }
  });

  for (const doc of expiringDocs) {
    const daysUntil = Math.ceil(
      (doc.expiryDate!.getTime() - todayUTC.getTime()) / (1000 * 60 * 60 * 24)
    );
    const employeeNames = getEmployeeNames(doc.employee);
    const docNameAr = doc.titleAr ?? doc.title ?? doc.category;
    const docNameEn = doc.title ?? doc.titleAr ?? doc.category;

    alerts.push({
      id: `doc-${doc.id}`,
      type: "document_expiry",
      severity: daysUntil <= 7 ? "urgent" : daysUntil <= 14 ? "warning" : "info",
      titleAr:
        daysUntil === 0 ? `وثيقة تنتهي اليوم: ${docNameAr}` : `وثيقة تنتهي خلال ${daysUntil} يوم`,
      titleEn:
        daysUntil === 0
          ? `Document expires today: ${docNameEn}`
          : `Document expires in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`,
      descriptionAr: `${employeeNames.ar} — ${docNameAr}`,
      descriptionEn: `${employeeNames.en} — ${docNameEn}`,
      employeeId: doc.employee.id,
      employeeName: employeeNames.en || employeeNames.ar,
      daysUntil,
      referenceDate: doc.expiryDate!
    });
  }

  // ── 2. Contracts ending soon ──────────────────────────────────────────────
  const expiringContracts = await prisma.employee.findMany({
    where: {
      tenantId,
      status: "ACTIVE",
      contractEndDate: { gte: todayUTC, lte: horizonDate }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      firstNameAr: true,
      lastNameAr: true,
      contractEndDate: true
    }
  });

  for (const emp of expiringContracts) {
    const daysUntil = Math.ceil(
      (emp.contractEndDate!.getTime() - todayUTC.getTime()) / (1000 * 60 * 60 * 24)
    );
    const employeeNames = getEmployeeNames(emp);

    alerts.push({
      id: `contract-${emp.id}`,
      type: "contract_end",
      severity: daysUntil <= 7 ? "urgent" : "warning",
      titleAr: `عقد ينتهي خلال ${daysUntil} يوم`,
      titleEn: `Contract ends in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`,
      descriptionAr: `${employeeNames.ar} — ينتهي في ${emp.contractEndDate!.toLocaleDateString("ar-SA")}`,
      descriptionEn: `${employeeNames.en} — ends on ${emp.contractEndDate!.toLocaleDateString("en-US")}`,
      employeeId: emp.id,
      employeeName: employeeNames.en || employeeNames.ar,
      daysUntil,
      referenceDate: emp.contractEndDate!
    });
  }

  // ── 3. Probation ending soon (14-day horizon) ─────────────────────────────
  const probationHorizon = new Date(
    todayUTC.getTime() + Math.min(horizonDays, 14) * 24 * 60 * 60 * 1000
  );

  const expiringProbation = await prisma.employee.findMany({
    where: {
      tenantId,
      status: "ACTIVE",
      probationEndDate: { gte: todayUTC, lte: probationHorizon }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      firstNameAr: true,
      lastNameAr: true,
      probationEndDate: true
    }
  });

  for (const emp of expiringProbation) {
    const daysUntil = Math.ceil(
      (emp.probationEndDate!.getTime() - todayUTC.getTime()) / (1000 * 60 * 60 * 24)
    );
    const employeeNames = getEmployeeNames(emp);

    alerts.push({
      id: `probation-${emp.id}`,
      type: "probation_end",
      severity: daysUntil <= 3 ? "urgent" : "warning",
      titleAr: `نهاية فترة التجربة خلال ${daysUntil} يوم`,
      titleEn: `Probation ends in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`,
      descriptionAr: `${employeeNames.ar} — تنتهي في ${emp.probationEndDate!.toLocaleDateString("ar-SA")}`,
      descriptionEn: `${employeeNames.en} — ends on ${emp.probationEndDate!.toLocaleDateString("en-US")}`,
      employeeId: emp.id,
      employeeName: employeeNames.en || employeeNames.ar,
      daysUntil,
      referenceDate: emp.probationEndDate!
    });
  }

  // ── 4. Birthdays today ────────────────────────────────────────────────────
  const allActiveEmployees = await prisma.employee.findMany({
    where: { tenantId, status: "ACTIVE", dateOfBirth: { not: null } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      firstNameAr: true,
      lastNameAr: true,
      dateOfBirth: true,
      hireDate: true
    }
  });

  for (const emp of allActiveEmployees) {
    // Birthday check
    if (emp.dateOfBirth) {
      const dob = emp.dateOfBirth;
      if (
        dob.getUTCMonth() === todayUTC.getUTCMonth() &&
        dob.getUTCDate() === todayUTC.getUTCDate()
      ) {
        const employeeNames = getEmployeeNames(emp);
        alerts.push({
          id: `birthday-${emp.id}`,
          type: "birthday",
          severity: "info",
          titleAr: `🎂 عيد ميلاد اليوم`,
          titleEn: "Birthday today",
          descriptionAr: `${employeeNames.ar}`,
          descriptionEn: `${employeeNames.en}`,
          employeeId: emp.id,
          employeeName: employeeNames.en || employeeNames.ar,
          daysUntil: 0,
          referenceDate: todayUTC
        });
      }
    }

    // Work anniversary check
    const hireDate = emp.hireDate;
    const yearsWorked = todayUTC.getUTCFullYear() - hireDate.getUTCFullYear();
    if (
      yearsWorked > 0 &&
      hireDate.getUTCMonth() === todayUTC.getUTCMonth() &&
      hireDate.getUTCDate() === todayUTC.getUTCDate()
    ) {
      const employeeNames = getEmployeeNames(emp);
      alerts.push({
        id: `anniversary-${emp.id}`,
        type: "work_anniversary",
        severity: "info",
        titleAr: `🏅 ذكرى التوظيف`,
        titleEn: "Work anniversary",
        descriptionAr: `${employeeNames.ar} — ${yearsWorked} ${yearsWorked === 1 ? "سنة" : "سنوات"} في الشركة`,
        descriptionEn: `${employeeNames.en} — ${formatYearsWorkedEn(yearsWorked)} with the company`,
        employeeId: emp.id,
        employeeName: employeeNames.en || employeeNames.ar,
        daysUntil: 0,
        referenceDate: todayUTC
      });
    }
  }

  // Sort: urgent first, then by daysUntil asc (nulls last)
  alerts.sort((a, b) => {
    const severityOrder = { urgent: 0, warning: 1, info: 2 };
    const so = severityOrder[a.severity] - severityOrder[b.severity];
    if (so !== 0) return so;
    const da = a.daysUntil ?? 999;
    const db = b.daysUntil ?? 999;
    return da - db;
  });

  return alerts;
}
