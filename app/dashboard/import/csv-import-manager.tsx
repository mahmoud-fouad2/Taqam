"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  IconDownload,
  IconUpload,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconFileSpreadsheet,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// CSV Template columns
const employeeCSVColumns = [
  { key: "employeeNumber", label: "رقم الموظف", labelEn: "Employee Number", required: true, example: "EMP001" },
  { key: "firstNameAr", label: "الاسم الأول (عربي)", labelEn: "First Name (AR)", required: true, example: "أحمد" },
  { key: "lastNameAr", label: "اسم العائلة (عربي)", labelEn: "Last Name (AR)", required: true, example: "محمد" },
  { key: "firstNameEn", label: "الاسم الأول (إنجليزي)", labelEn: "First Name (EN)", required: false, example: "Ahmed" },
  { key: "lastNameEn", label: "اسم العائلة (إنجليزي)", labelEn: "Last Name (EN)", required: false, example: "Mohammed" },
  { key: "email", label: "البريد الإلكتروني", labelEn: "Email", required: true, example: "ahmed@company.com" },
  { key: "phone", label: "رقم الهاتف", labelEn: "Phone", required: false, example: "+966501234567" },
  { key: "nationalId", label: "رقم الهوية", labelEn: "National ID", required: true, example: "1234567890" },
  { key: "dateOfBirth", label: "تاريخ الميلاد", labelEn: "Date of Birth", required: false, example: "1990-01-15" },
  { key: "gender", label: "الجنس", labelEn: "Gender", required: true, example: "male / female" },
  { key: "hireDate", label: "تاريخ التعيين", labelEn: "Hire Date", required: true, example: "2024-01-01" },
  { key: "departmentCode", label: "كود القسم", labelEn: "Department Code", required: true, example: "IT" },
  { key: "jobTitleCode", label: "كود المسمى الوظيفي", labelEn: "Job Title Code", required: true, example: "DEV" },
  { key: "branchCode", label: "كود الفرع", labelEn: "Branch Code", required: false, example: "RYD" },
  { key: "basicSalary", label: "الراتب الأساسي", labelEn: "Basic Salary", required: true, example: "10000" },
];

interface ImportRow {
  rowNumber: number;
  data: Record<string, string>;
  status: "valid" | "error" | "warning";
  errors: string[];
  warnings: string[];
  importState?: "pending" | "success" | "error";
  importMessage?: string | null;
}

function normalizeCsvValue(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeCsvEnum(value: string | undefined) {
  return normalizeCsvValue(value)?.toUpperCase().replace(/[-\s]+/g, "_");
}

function buildEmployeeImportPayload(row: ImportRow) {
  const firstNameAr = normalizeCsvValue(row.data.firstNameAr);
  const lastNameAr = normalizeCsvValue(row.data.lastNameAr);
  const firstNameEn = normalizeCsvValue(row.data.firstNameEn);
  const lastNameEn = normalizeCsvValue(row.data.lastNameEn);
  const salary = normalizeCsvValue(row.data.basicSalary);

  return {
    firstName: firstNameEn ?? firstNameAr ?? "",
    lastName: lastNameEn ?? lastNameAr ?? "",
    firstNameAr,
    lastNameAr,
    email: normalizeCsvValue(row.data.email) ?? "",
    phone: normalizeCsvValue(row.data.phone),
    nationalId: normalizeCsvValue(row.data.nationalId),
    dateOfBirth: normalizeCsvValue(row.data.dateOfBirth),
    gender: normalizeCsvEnum(row.data.gender),
    hireDate: normalizeCsvValue(row.data.hireDate) ?? "",
    departmentCode: normalizeCsvValue(row.data.departmentCode),
    jobTitleCode: normalizeCsvValue(row.data.jobTitleCode),
    branchCode: normalizeCsvValue(row.data.branchCode),
    baseSalary: salary ? Number(salary) : undefined,
  };
}

export function CSVImportManager() {
  const router = useRouter();
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [importProgress, setImportProgress] = React.useState(0);
  const [importStatus, setImportStatus] = React.useState<"idle" | "validating" | "importing" | "complete" | "imported" | "error">("idle");
  const [parsedRows, setParsedRows] = React.useState<ImportRow[]>([]);
  const [importSummary, setImportSummary] = React.useState<{ succeeded: number; failed: number } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Generate CSV template
  const downloadTemplate = () => {
    const headers = employeeCSVColumns.map((col) => col.key).join(",");
    const exampleRow = employeeCSVColumns.map((col) => col.example).join(",");
    const csvContent = `${headers}\n${exampleRow}`;
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "employees_template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportStatus("idle");
      setParsedRows([]);
    }
  };

  // Parse and validate CSV
  const validateCSV = async () => {
    if (!importFile) return;

    setImportStatus("validating");
    setImportProgress(0);
    setImportSummary(null);

    const text = await importFile.text();
    const lines = text.split("\n").filter((line) => line.trim());
    
    if (lines.length < 2) {
      setImportStatus("error");
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim());
    const rows: ImportRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const data: Record<string, string> = {};
      const errors: string[] = [];
      const warnings: string[] = [];

      headers.forEach((header, index) => {
        data[header] = values[index] || "";
      });

      // Validate required fields
      employeeCSVColumns.forEach((col) => {
        if (col.required && !data[col.key]) {
          errors.push(`الحقل "${col.label}" مطلوب`);
        }
      });

      // Validate email format
      if (data.email && !data.email.includes("@")) {
        errors.push("صيغة البريد الإلكتروني غير صحيحة");
      }

      // Validate dates
      ["dateOfBirth", "hireDate"].forEach((dateField) => {
        if (data[dateField] && isNaN(Date.parse(data[dateField]))) {
          errors.push(`صيغة تاريخ ${dateField === "dateOfBirth" ? "الميلاد" : "التعيين"} غير صحيحة`);
        }
      });

      // Validate gender
      if (data.gender && !["male", "female"].includes(data.gender.toLowerCase())) {
        errors.push("قيمة الجنس يجب أن تكون male أو female");
      }

      // Validate salary
      if (data.basicSalary && isNaN(parseFloat(data.basicSalary))) {
        errors.push("الراتب الأساسي يجب أن يكون رقماً");
      }

      rows.push({
        rowNumber: i,
        data,
        status: errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "valid",
        errors,
        warnings,
        importState: "pending",
        importMessage: null,
      });

      setImportProgress(Math.round((i / (lines.length - 1)) * 100));
    }

    setParsedRows(rows);
    setImportStatus("complete");
  };

  const performImport = async () => {
    if (importStatus === "importing") return;

    setImportStatus("importing");
    setImportProgress(0);
    setImportSummary(null);

    const importableRows = parsedRows.filter((row) => row.status !== "error");
    const nextRows = parsedRows.map((row) => ({
      ...row,
      importState: row.status === "error" ? row.importState : "pending",
      importMessage: row.status === "error" ? row.importMessage : null,
    }));

    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < importableRows.length; i++) {
      const row = importableRows[i];
      const rowIndex = nextRows.findIndex((candidate) => candidate.rowNumber === row.rowNumber);

      try {
        const response = await fetch("/api/employees", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildEmployeeImportPayload(row)),
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error ?? "فشل استيراد هذا الصف");
        }

        nextRows[rowIndex] = {
          ...nextRows[rowIndex],
          importState: "success",
          importMessage: "تم الاستيراد بنجاح",
        };
        succeeded += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "حدث خطأ أثناء الاستيراد";
        nextRows[rowIndex] = {
          ...nextRows[rowIndex],
          importState: "error",
          importMessage: message,
          errors: nextRows[rowIndex].errors.includes(message)
            ? nextRows[rowIndex].errors
            : [...nextRows[rowIndex].errors, message],
        };
        failed += 1;
      }

      setParsedRows([...nextRows]);
      setImportProgress(Math.round(((i + 1) / importableRows.length) * 100));
    }

    setImportSummary({ succeeded, failed });
    setImportStatus("imported");
    router.refresh();
  };

  // Stats
  const stats = {
    total: parsedRows.length,
    valid: parsedRows.filter((r) => r.status === "valid").length,
    warnings: parsedRows.filter((r) => r.status === "warning").length,
    errors: parsedRows.filter((r) => r.status === "error").length,
    ready: parsedRows.filter((r) => r.status !== "error").length,
    imported: parsedRows.filter((r) => r.importState === "success").length,
    importFailures: parsedRows.filter((r) => r.importState === "error").length,
  };

  const resetImport = () => {
    setImportFile(null);
    setImportProgress(0);
    setImportStatus("idle");
    setParsedRows([]);
    setImportSummary(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconDownload className="h-5 w-5" />
              تحميل القالب
            </CardTitle>
            <CardDescription>
              قم بتحميل قالب CSV لملء بيانات الموظفين
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={downloadTemplate} variant="outline" className="w-full">
              <IconFileSpreadsheet className="ms-2 h-4 w-4" />
              تحميل قالب CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUpload className="h-5 w-5" />
              استيراد البيانات
            </CardTitle>
            <CardDescription>
              قم برفع ملف CSV يحتوي على بيانات الموظفين
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isImportOpen} onOpenChange={(open) => {
              setIsImportOpen(open);
              if (!open) resetImport();
            }}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <IconUpload className="ms-2 h-4 w-4" />
                  استيراد من CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>استيراد الموظفين من CSV</DialogTitle>
                  <DialogDescription>
                    قم برفع ملف CSV يحتوي على بيانات الموظفين للاستيراد الجماعي
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">رفع الملف</TabsTrigger>
                    <TabsTrigger value="preview" disabled={parsedRows.length === 0}>
                      معاينة ({stats.total})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-4">
                    {/* File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".csv"
                      onChange={handleFileSelect}
                      aria-label="رفع ملف CSV"
                    />
                    <button
                      type="button"
                      className="w-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {importFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <IconFileSpreadsheet className="h-8 w-8 text-green-500" />
                          <div>
                            <p className="font-medium">{importFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(importFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <IconUpload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-lg font-medium">اسحب ملف CSV هنا</p>
                          <p className="text-sm text-muted-foreground">
                            أو اضغط لاختيار ملف
                          </p>
                        </>
                      )}
                    </button>

                    {/* Progress */}
                    {importStatus === "validating" && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">جاري التحقق من البيانات...</p>
                        <Progress value={importProgress} />
                      </div>
                    )}

                    {importStatus === "importing" && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">جاري استيراد الموظفين...</p>
                        <Progress value={importProgress} />
                      </div>
                    )}

                    {/* Validation Results */}
                    {importStatus === "complete" && parsedRows.length > 0 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div className="p-2 bg-muted rounded">
                            <p className="text-2xl font-bold">{stats.total}</p>
                            <p className="text-xs text-muted-foreground">إجمالي</p>
                          </div>
                          <div className="p-2 bg-green-50 rounded">
                            <p className="text-2xl font-bold text-green-600">{stats.valid}</p>
                            <p className="text-xs text-green-600">صحيح</p>
                          </div>
                          <div className="p-2 bg-yellow-50 rounded">
                            <p className="text-2xl font-bold text-yellow-600">{stats.warnings}</p>
                            <p className="text-xs text-yellow-600">تحذيرات</p>
                          </div>
                          <div className="p-2 bg-red-50 rounded">
                            <p className="text-2xl font-bold text-red-600">{stats.errors}</p>
                            <p className="text-xs text-red-600">أخطاء</p>
                          </div>
                        </div>

                        {stats.errors > 0 && (
                          <Alert variant="destructive">
                            <IconAlertTriangle className="h-4 w-4" />
                            <AlertTitle>يوجد أخطاء في البيانات</AlertTitle>
                            <AlertDescription>
                              {stats.errors} صف يحتوي على أخطاء ولن يتم استيراده. راجع تبويب المعاينة للتفاصيل.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}

                    {importStatus === "imported" && importSummary && (
                      <Alert variant={importSummary.failed > 0 ? "destructive" : "default"}>
                        {importSummary.failed > 0 ? (
                          <IconAlertTriangle className="h-4 w-4" />
                        ) : (
                          <IconCheck className="h-4 w-4" />
                        )}
                        <AlertTitle>
                          {importSummary.failed > 0 ? "اكتمل الاستيراد مع بعض الإخفاقات" : "تم استيراد الموظفين بنجاح"}
                        </AlertTitle>
                        <AlertDescription>
                          تم استيراد {importSummary.succeeded} صف بنجاح، وفشل {importSummary.failed} صف.
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>

                  <TabsContent value="preview">
                    <div className="max-h-[400px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[60px]">الصف</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>رقم الموظف</TableHead>
                            <TableHead>الاسم</TableHead>
                            <TableHead>البريد</TableHead>
                            <TableHead>الأخطاء/التحذيرات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedRows.map((row) => (
                            <TableRow key={row.rowNumber}>
                              <TableCell className="font-mono">{row.rowNumber}</TableCell>
                              <TableCell>
                                {row.importState === "success" ? (
                                  <Badge variant="default" className="bg-emerald-600">
                                    <IconCheck className="h-3 w-3 ms-1" />
                                    تم الاستيراد
                                  </Badge>
                                ) : row.importState === "error" && importStatus === "imported" ? (
                                  <Badge variant="destructive">
                                    <IconX className="h-3 w-3 ms-1" />
                                    فشل الاستيراد
                                  </Badge>
                                ) : row.status === "valid" ? (
                                  <Badge variant="default" className="bg-green-500">
                                    <IconCheck className="h-3 w-3 ms-1" />
                                    صحيح
                                  </Badge>
                                ) : null}
                                {row.importState !== "success" && row.status === "warning" && (
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                                    <IconAlertTriangle className="h-3 w-3 ms-1" />
                                    تحذير
                                  </Badge>
                                )}
                                {row.importState !== "success" && row.status === "error" && (
                                  <Badge variant="destructive">
                                    <IconX className="h-3 w-3 ms-1" />
                                    خطأ
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="font-mono">
                                {row.data.employeeNumber || "-"}
                              </TableCell>
                              <TableCell>
                                {row.data.firstNameAr} {row.data.lastNameAr}
                              </TableCell>
                              <TableCell className="text-sm">
                                {row.data.email || "-"}
                              </TableCell>
                              <TableCell className="text-xs max-w-[200px]">
                                {row.errors.length > 0 && (
                                  <p className="text-red-600">{row.errors.join(", ")}</p>
                                )}
                                {row.warnings.length > 0 && (
                                  <p className="text-yellow-600">{row.warnings.join(", ")}</p>
                                )}
                                {row.importState === "success" && row.importMessage ? (
                                  <p className="text-emerald-600">{row.importMessage}</p>
                                ) : null}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>

                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setIsImportOpen(false)}>
                    إلغاء
                  </Button>
                  {importStatus === "idle" && importFile && (
                    <Button onClick={validateCSV}>
                      التحقق من البيانات
                    </Button>
                  )}
                  {importStatus === "complete" && stats.ready > 0 && (
                    <Button onClick={performImport}>
                      استيراد {stats.ready} موظف
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* CSV Columns Reference */}
      <Card>
        <CardHeader>
          <CardTitle>دليل حقول CSV</CardTitle>
          <CardDescription>
            قائمة بجميع الحقول المطلوبة والاختيارية لملف CSV
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم الحقل</TableHead>
                <TableHead>الوصف (عربي)</TableHead>
                <TableHead>الوصف (إنجليزي)</TableHead>
                <TableHead>مطلوب</TableHead>
                <TableHead>مثال</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeCSVColumns.map((col) => (
                <TableRow key={col.key}>
                  <TableCell className="font-mono text-sm">{col.key}</TableCell>
                  <TableCell>{col.label}</TableCell>
                  <TableCell className="text-muted-foreground">{col.labelEn}</TableCell>
                  <TableCell>
                    {col.required ? (
                      <Badge variant="default">مطلوب</Badge>
                    ) : (
                      <Badge variant="outline">اختياري</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {col.example}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
