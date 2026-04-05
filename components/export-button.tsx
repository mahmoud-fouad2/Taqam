"use client";

import * as React from "react";
import {
  IconDownload,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconFileTypeCsv,
  IconLoader,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ExportButtonProps {
  type: "employees" | "attendance" | "payroll" | "loans";
  filters?: Record<string, string>;
  disabled?: boolean;
}

interface ExportColumn {
  key: string;
  label: string;
}

interface ExportData {
  filename: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
  metadata?: {
    exportDate: string;
    totalRecords: number;
    type: string;
  };
}

const typeLabels: Record<string, string> = {
  employees: "الموظفين",
  attendance: "الحضور والانصراف",
  payroll: "الرواتب",
  loans: "القروض",
};

export function ExportButton({ type, filters = {}, disabled }: ExportButtonProps) {
  const [exporting, setExporting] = React.useState(false);

  const buildQueryString = (format: string) => {
    const params = new URLSearchParams({ type, format });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return params.toString();
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const response = await fetch(`/api/export?${buildQueryString("csv")}`);
      
      if (!response.ok) {
        throw new Error("فشل في تصدير البيانات");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("تم تصدير البيانات بنجاح");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("حدث خطأ في تصدير البيانات");
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const response = await fetch(`/api/export?${buildQueryString("excel-json")}`);
      
      if (!response.ok) {
        throw new Error("فشل في تصدير البيانات");
      }

      const exportData: ExportData = await response.json();
      
      // Generate Excel using simple XML format (compatible with Excel)
      const generateExcelXML = (data: ExportData) => {
        const worksheet = data.data.map((row) => {
          return data.columns.map((col) => row[col.key] || "").join("\t");
        });

        const headers = data.columns.map((col) => col.label).join("\t");
        const content = [headers, ...worksheet].join("\n");

        return content;
      };

      const excelContent = generateExcelXML(exportData);
      const blob = new Blob(["\uFEFF" + excelContent], { type: "application/vnd.ms-excel;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = exportData.filename.replace(".xlsx", ".xls");
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("تم تصدير البيانات بنجاح");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("حدث خطأ في تصدير البيانات");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const response = await fetch(`/api/export?${buildQueryString("json")}`);
      
      if (!response.ok) {
        throw new Error("فشل في جلب البيانات");
      }

      const exportData: ExportData = await response.json();
      
      // Generate printable HTML for PDF
      const generatePrintableHTML = (data: ExportData) => {
        const title = typeLabels[type] || type;
        const date = new Date().toLocaleDateString("ar-SA");

        return `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <title>تقرير ${title}</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                direction: rtl;
                padding: 20px;
                max-width: 100%;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
              }
              .header h1 {
                margin: 0 0 10px 0;
                color: #1a1a1a;
              }
              .header .date {
                color: #666;
                font-size: 14px;
              }
              .stats {
                display: flex;
                justify-content: center;
                gap: 40px;
                margin-bottom: 30px;
                background: #f5f5f5;
                padding: 15px;
                border-radius: 8px;
              }
              .stat-item {
                text-align: center;
              }
              .stat-value {
                font-size: 24px;
                font-weight: bold;
                color: #1a1a1a;
              }
              .stat-label {
                font-size: 12px;
                color: #666;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                font-size: 12px;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 10px 8px;
                text-align: right;
              }
              th {
                background-color: #1a1a1a;
                color: white;
                font-weight: 600;
              }
              tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              tr:hover {
                background-color: #f1f1f1;
              }
              .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 11px;
                color: #999;
                border-top: 1px solid #ddd;
                padding-top: 15px;
              }
              @media print {
                body { padding: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>تقرير ${title}</h1>
              <div class="date">تاريخ التصدير: ${date}</div>
            </div>
            <div class="stats">
              <div class="stat-item">
                <div class="stat-value">${data.data.length}</div>
                <div class="stat-label">إجمالي السجلات</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  ${data.columns.map((col) => `<th>${col.label}</th>`).join("")}
                </tr>
              </thead>
              <tbody>
                ${data.data
                  .map(
                    (row) =>
                      `<tr>${data.columns.map((col) => `<td>${row[col.key] || "-"}</td>`).join("")}</tr>`
                  )
                  .join("")}
              </tbody>
            </table>
            <div class="footer">
              تم إنشاء هذا التقرير بواسطة منصة طاقم لإدارة الموارد البشرية
            </div>
          </body>
          </html>
        `;
      };

      const html = generatePrintableHTML(exportData);
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }

      toast.success("تم فتح نافذة الطباعة");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("حدث خطأ في تصدير البيانات");
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || exporting}>
          {exporting ? (
            <IconLoader className="h-4 w-4 ms-2 animate-spin" />
          ) : (
            <IconDownload className="h-4 w-4 ms-2" />
          )}
          تصدير
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>تصدير {typeLabels[type]}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportExcel}>
          <IconFileSpreadsheet className="h-4 w-4 ms-2 text-green-600" />
          <span>Excel (.xls)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportCSV}>
          <IconFileTypeCsv className="h-4 w-4 ms-2 text-blue-600" />
          <span>CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          <IconFileTypePdf className="h-4 w-4 ms-2 text-red-600" />
          <span>PDF (طباعة)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
