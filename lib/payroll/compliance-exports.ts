import { buildCsv, sanitizeFilename } from "@/lib/payroll/export";
import type { Payslip } from "@/lib/types/payroll";

type ComplianceExportPeriod = {
  id: string;
  name?: string | null;
  nameAr?: string | null;
  paymentDate?: Date | null;
};

export type BankFileFormat = "csv" | "wps" | "sarie";

export function buildGosiReportExport(input: {
  period: ComplianceExportPeriod;
  payslips: Payslip[];
}) {
  const periodLabel = input.period.name || input.period.id;
  const csv = buildCsv(
    [
      "employeeNumber",
      "employeeName",
      "department",
      "basicSalary",
      "gosiEmployee",
      "gosiEmployer",
      "totalGosi"
    ],
    input.payslips.map((payslip) => [
      payslip.employeeNumber,
      payslip.employeeName,
      payslip.department,
      payslip.basicSalary,
      payslip.gosiEmployee,
      payslip.gosiEmployer,
      payslip.gosiEmployee + payslip.gosiEmployer
    ])
  );

  return {
    csv,
    fileName: `${sanitizeFilename(`gosi-report-${periodLabel}`)}.csv`,
    rowCount: input.payslips.length
  };
}

export function resolveBankFileFormat(value: string | null | undefined): BankFileFormat {
  const normalized = (value || "csv").toLowerCase();
  return normalized === "wps" || normalized === "sarie" || normalized === "csv"
    ? normalized
    : "csv";
}

export function getBankFileMissingAccountNumbers(payslips: Payslip[]) {
  return payslips
    .filter((payslip) => payslip.paymentMethod === "bank_transfer" && !(payslip.accountNumber || "").trim())
    .map((payslip) => payslip.employeeNumber);
}

export function buildBankFileExport(input: {
  period: ComplianceExportPeriod;
  payslips: Payslip[];
  format: BankFileFormat;
}) {
  const paymentDate = input.period.paymentDate
    ? (input.period.paymentDate.toISOString().split("T")[0] ?? "")
    : "";
  const periodLabel = input.period.name || input.period.id;

  const csv =
    input.format === "wps"
      ? buildCsv(
          ["employeeNumber", "employeeName", "accountNumber", "netSalary", "paymentDate"],
          input.payslips.map((payslip) => [
            payslip.employeeNumber,
            payslip.employeeName,
            payslip.accountNumber || "",
            payslip.netSalary,
            paymentDate
          ])
        )
      : input.format === "sarie"
        ? buildCsv(
            [
              "beneficiaryName",
              "beneficiaryAccount",
              "amount",
              "currency",
              "paymentDate",
              "reference"
            ],
            input.payslips.map((payslip) => [
              payslip.employeeName,
              payslip.accountNumber || "",
              payslip.netSalary,
              payslip.currency,
              paymentDate,
              periodLabel
            ])
          )
        : buildCsv(
            [
              "employeeNumber",
              "employeeName",
              "bankName",
              "accountNumber",
              "paymentMethod",
              "netSalary",
              "currency",
              "paymentDate"
            ],
            input.payslips.map((payslip) => [
              payslip.employeeNumber,
              payslip.employeeName,
              payslip.bankName || "",
              payslip.accountNumber || "",
              payslip.paymentMethod,
              payslip.netSalary,
              payslip.currency,
              paymentDate
            ])
          );

  return {
    csv,
    fileName: `${sanitizeFilename(`bank-file-${periodLabel}-${input.format}`)}.csv`,
    rowCount: input.payslips.length
  };
}