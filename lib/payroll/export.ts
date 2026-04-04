export function escapeCsvValue(value: string | number | null | undefined): string {
  const normalized = String(value ?? "");
  if (normalized.includes(",") || normalized.includes("\n") || normalized.includes('"')) {
    return `"${normalized.replaceAll('"', '""')}"`;
  }

  return normalized;
}

export function buildCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>): string {
  return [headers, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\n");
}

export function sanitizeFilename(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9\u0600-\u06FF\s_-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildPayslipHtmlDocument(input: {
  title: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  jobTitle: string;
  periodLabel: string;
  paymentDate?: string;
  earningsRows: string;
  deductionsRows: string;
  totalEarnings: string;
  totalDeductions: string;
  netSalary: string;
}) {
  const { title, employeeName, employeeNumber, department, jobTitle, periodLabel, paymentDate } = input;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: "Segoe UI", Tahoma, sans-serif; background: #f5f5f5; color: #111827; margin: 0; padding: 24px; }
      .sheet { max-width: 860px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px; }
      .header { border-bottom: 2px solid #111827; padding-bottom: 20px; margin-bottom: 24px; }
      .header h1 { margin: 0 0 8px; font-size: 28px; }
      .muted { color: #6b7280; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
      .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; background: #fafafa; }
      .label { color: #6b7280; font-size: 13px; margin-bottom: 6px; }
      .value { font-weight: 600; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
      th, td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; }
      th { font-size: 13px; color: #6b7280; background: #f9fafb; }
      .summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
      .summary .card { background: #f9fafb; }
      .net { background: #ecfdf5; border-color: #a7f3d0; }
      @media print {
        body { background: #ffffff; padding: 0; }
        .sheet { border: 0; border-radius: 0; padding: 0; max-width: none; }
      }
    </style>
  </head>
  <body>
    <main class="sheet">
      <section class="header">
        <h1>${escapeHtml(title)}</h1>
        <div class="muted">${escapeHtml(periodLabel)}${paymentDate ? ` • تاريخ الصرف: ${escapeHtml(paymentDate)}` : ""}</div>
      </section>

      <section class="grid">
        <div class="card"><div class="label">الموظف</div><div class="value">${escapeHtml(employeeName)}</div></div>
        <div class="card"><div class="label">الرقم الوظيفي</div><div class="value">${escapeHtml(employeeNumber)}</div></div>
        <div class="card"><div class="label">القسم</div><div class="value">${escapeHtml(department)}</div></div>
        <div class="card"><div class="label">المسمى الوظيفي</div><div class="value">${escapeHtml(jobTitle)}</div></div>
      </section>

      <section>
        <table>
          <thead>
            <tr><th>الاستحقاقات</th><th>القيمة</th></tr>
          </thead>
          <tbody>
            ${input.earningsRows}
            <tr><td><strong>إجمالي الاستحقاقات</strong></td><td><strong>${escapeHtml(input.totalEarnings)}</strong></td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <table>
          <thead>
            <tr><th>الخصومات</th><th>القيمة</th></tr>
          </thead>
          <tbody>
            ${input.deductionsRows}
            <tr><td><strong>إجمالي الخصومات</strong></td><td><strong>${escapeHtml(input.totalDeductions)}</strong></td></tr>
          </tbody>
        </table>
      </section>

      <section class="summary">
        <div class="card"><div class="label">إجمالي الاستحقاقات</div><div class="value">${escapeHtml(input.totalEarnings)}</div></div>
        <div class="card"><div class="label">إجمالي الخصومات</div><div class="value">${escapeHtml(input.totalDeductions)}</div></div>
        <div class="card net"><div class="label">صافي الراتب</div><div class="value">${escapeHtml(input.netSalary)}</div></div>
      </section>
    </main>
  </body>
</html>`;
}