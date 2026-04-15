import prisma from "@/lib/db";
import {
  buildBankFileExport,
  buildGosiReportExport,
  getBankFileMissingAccountNumbers
} from "@/lib/payroll/compliance-exports";
import { listPayslipsForPeriod } from "@/lib/payroll/payslips";

export const SUPPORTED_INTEGRATION_PROVIDER_SYNC_ADAPTERS = ["gosi", "wps"] as const;

export type IntegrationProviderSyncArtifact = {
  providerKey: string;
  exportType: "gosi-report" | "bank-file";
  periodId: string;
  periodName: string;
  rowCount: number;
  fileName: string;
  downloadPath: string;
};

export function supportsIntegrationProviderSyncAdapter(providerKey: string) {
  return SUPPORTED_INTEGRATION_PROVIDER_SYNC_ADAPTERS.includes(
    providerKey as (typeof SUPPORTED_INTEGRATION_PROVIDER_SYNC_ADAPTERS)[number]
  );
}

export async function runIntegrationProviderSyncAdapter({
  tenantId,
  providerKey
}: {
  tenantId: string;
  providerKey: string;
}): Promise<
  | {
      ok: true;
      summary: string;
      artifact: IntegrationProviderSyncArtifact;
    }
  | {
      ok: false;
      status: number;
      error: string;
    }
  | null
> {
  if (!supportsIntegrationProviderSyncAdapter(providerKey)) {
    return null;
  }

  const period = await prisma.payrollPeriod.findFirst({
    where: {
      tenantId,
      status: {
        in: ["APPROVED", "PAID"]
      }
    },
    orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      nameAr: true,
      paymentDate: true
    }
  });

  if (!period) {
    return {
      ok: false,
      status: 409,
      error: "لا توجد فترة رواتب معتمدة أو مدفوعة لتجهيز ملف التكامل"
    };
  }

  const result = await listPayslipsForPeriod(tenantId, period.id);
  if (!result.period || result.payslips.length === 0) {
    return {
      ok: false,
      status: 409,
      error: "لا توجد قسائم رواتب جاهزة لتجهيز ملف التكامل"
    };
  }

  const periodName = result.period.nameAr || result.period.name || result.period.id;

  if (providerKey === "gosi") {
    const exported = buildGosiReportExport({
      period: result.period,
      payslips: result.payslips
    });

    return {
      ok: true,
      summary: `تم تجهيز تقرير GOSI لفترة ${periodName} بعدد ${exported.rowCount} موظف`,
      artifact: {
        providerKey,
        exportType: "gosi-report",
        periodId: result.period.id,
        periodName,
        rowCount: exported.rowCount,
        fileName: exported.fileName,
        downloadPath: `/api/payroll/periods/${result.period.id}/gosi-report`
      }
    };
  }

  const missingAccounts = getBankFileMissingAccountNumbers(result.payslips);
  if (missingAccounts.length > 0) {
    return {
      ok: false,
      status: 409,
      error: `لا يمكن تجهيز ملف WPS قبل استكمال أرقام الحسابات البنكية للموظفين: ${missingAccounts.join("، ")}`
    };
  }

  const exported = buildBankFileExport({
    period: result.period,
    payslips: result.payslips,
    format: "wps"
  });

  return {
    ok: true,
    summary: `تم تجهيز ملف WPS لفترة ${periodName} بعدد ${exported.rowCount} موظف`,
    artifact: {
      providerKey,
      exportType: "bank-file",
      periodId: result.period.id,
      periodName,
      rowCount: exported.rowCount,
      fileName: exported.fileName,
      downloadPath: `/api/payroll/periods/${result.period.id}/bank-file?format=wps`
    }
  };
}
