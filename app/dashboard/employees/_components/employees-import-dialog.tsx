"use client";

import * as React from "react";
import { toast } from "sonner";
import { IconUpload, IconDownload } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { employeesService } from "@/lib/api";
import { csvRowsToObjects, parseCsv } from "@/lib/csv/parse";

type PreviewRow = Record<string, string>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported?: () => Promise<void> | void;
};

const TEMPLATE_HEADERS = [
  "employeeNumber",
  "firstName",
  "lastName",
  "firstNameAr",
  "lastNameAr",
  "email",
  "phone",
  "nationalId",
  "hireDate",
  "departmentId",
  "jobTitleId",
  "managerId",
  "baseSalary",
  "currency",
  "status",
  "employmentType",
  "dateOfBirth",
] as const;

function downloadTemplate() {
  const sample = {
    employeeNumber: "000100",
    firstName: "Ahmed",
    lastName: "Ali",
    firstNameAr: "أحمد",
    lastNameAr: "علي",
    email: "ahmed.ali@example.com",
    phone: "0500000000",
    nationalId: "1234567890",
    hireDate: new Date().toISOString().split("T")[0],
    departmentId: "",
    jobTitleId: "",
    managerId: "",
    baseSalary: "8000",
    currency: "SAR",
    status: "ACTIVE",
    employmentType: "FULL_TIME",
    dateOfBirth: "1995-01-01",
  };

  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return /[\n\r",]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };

  const header = TEMPLATE_HEADERS.join(",");
  const row = TEMPLATE_HEADERS.map((h) => escape((sample as any)[h])).join(",");
  const csv = "\uFEFF" + header + "\n" + row + "\n";

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "employees_import_template.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function validateRow(row: PreviewRow, rowIndex: number): string[] {
  const errs: string[] = [];
  const rowNo = rowIndex + 2; // header + 1

  const firstName = (row.firstname || row.first_name || row["firstName"] || "").trim();
  const lastName = (row.lastname || row.last_name || row["lastName"] || "").trim();
  const email = (row.email || "").trim();
  const hireDate = (row.hiredate || row.hire_date || row["hireDate"] || "").trim();

  if (!firstName) errs.push(`Row ${rowNo}: firstName is required`);
  if (!lastName) errs.push(`Row ${rowNo}: lastName is required`);
  if (!email) errs.push(`Row ${rowNo}: email is required`);
  if (!hireDate) errs.push(`Row ${rowNo}: hireDate is required (yyyy-mm-dd)`);

  return errs;
}

export function EmployeesImportDialog({ open, onOpenChange, onImported }: Props) {
  const [file, setFile] = React.useState<File | null>(null);
  const [parsing, setParsing] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [preview, setPreview] = React.useState<PreviewRow[]>([]);
  const [errors, setErrors] = React.useState<string[]>([]);

  const reset = React.useCallback(() => {
    setFile(null);
    setPreview([]);
    setErrors([]);
    setParsing(false);
    setImporting(false);
  }, []);

  React.useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const handleFileChange = async (f: File | null) => {
    setFile(f);
    setPreview([]);
    setErrors([]);

    if (!f) return;

    setParsing(true);
    try {
      const text = await f.text();
      const rows = parseCsv(text);
      const objects = csvRowsToObjects(rows);

      const rowErrors: string[] = [];
      objects.forEach((row, idx) => rowErrors.push(...validateRow(row, idx)));

      setPreview(objects.slice(0, 20));
      setErrors(rowErrors.slice(0, 200));
    } catch (e) {
      console.error(e);
      toast.error("فشل في قراءة ملف CSV");
    } finally {
      setParsing(false);
    }
  };

  const canImport = !!file && !parsing;

  const startImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const res = await employeesService.importCSV(file);
      if (!res.success) throw new Error(res.error || "Import failed");

      const imported = res.data?.imported ?? 0;
      const apiErrors = res.data?.errors ?? [];

      if (apiErrors.length > 0) {
        toast.warning(`تم الاستيراد جزئياً: ${imported} صف (مع أخطاء)`);
      } else {
        toast.success(`تم استيراد ${imported} موظف بنجاح`);
      }

      setErrors(apiErrors);

      await onImported?.();
    } catch (e) {
      console.error(e);
      toast.error("فشل في استيراد الموظفين");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>استيراد الموظفين (CSV)</DialogTitle>
          <DialogDescription>
            ارفع ملف CSV مطابقاً للقالب. سيتم استيراد الصفوف الصحيحة وتسجيل الأخطاء للصفوف غير الصالحة.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                disabled={parsing || importing}
              />
            </div>
            <Button type="button" variant="outline" onClick={downloadTemplate} disabled={parsing || importing}>
              <IconDownload className="ms-2 h-4 w-4" />
              تنزيل قالب CSV
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium mb-2">معاينة (أول 20 صف)</div>
              {preview.length === 0 ? (
                <div className="text-sm text-muted-foreground">اختر ملف CSV لعرض المعاينة</div>
              ) : (
                <ScrollArea className="h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>البريد</TableHead>
                        <TableHead>تاريخ التعيين</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.map((r, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            {(r.firstname || r.first_name || r["firstName"] || "-") +
                              " " +
                              (r.lastname || r.last_name || r["lastName"] || "-")}
                          </TableCell>
                          <TableCell>{r.email || "-"}</TableCell>
                          <TableCell>{r.hiredate || r.hire_date || r["hireDate"] || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </div>

            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium mb-2">الأخطاء</div>
              {errors.length === 0 ? (
                <div className="text-sm text-muted-foreground">لا توجد أخطاء حالياً</div>
              ) : (
                <ScrollArea className="h-64">
                  <ul className="text-sm space-y-1">
                    {errors.map((e, idx) => (
                      <li key={idx} className="text-destructive">
                        {e}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            إغلاق
          </Button>
          <Button type="button" onClick={startImport} disabled={!canImport || importing}>
            <IconUpload className="ms-2 h-4 w-4" />
            {importing ? "جاري الاستيراد..." : "بدء الاستيراد"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
