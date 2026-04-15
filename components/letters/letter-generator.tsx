"use client";

import * as React from "react";
import { IconFileCertificate, IconDownload, IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useEmployees } from "@/hooks/use-employees";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

type LetterType = "introductory" | "salary" | "experience";

export function LetterGenerator() {
  const locale = useClientLocale();
  const t = getText(locale);
  const { employees } = useEmployees();

  const [open, setOpen] = React.useState(false);
  const [employeeId, setEmployeeId] = React.useState("");
  const [letterType, setLetterType] = React.useState<LetterType>("introductory");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleGenerate = async () => {
    if (!employeeId) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, type: letterType })
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? t.letters.errorMsg);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const disp = res.headers.get("Content-Disposition") ?? "";
      const match = disp.match(/filename\*=UTF-8''([^;]+)/i) ?? disp.match(/filename="([^"]+)"/i);
      const filename = match ? decodeURIComponent(match[1]) : `letter_${Date.now()}.pdf`;

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.letters.errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const letterTypes: { value: LetterType; label: string; desc: string }[] = [
    { value: "introductory", label: t.letters.introductory, desc: t.letters.introductoryDesc },
    { value: "salary", label: t.letters.salary, desc: t.letters.salaryDesc },
    { value: "experience", label: t.letters.experience, desc: t.letters.experienceDesc }
  ];

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
            <IconFileCertificate className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-base">{t.letters.title}</CardTitle>
            <CardDescription className="text-sm">{t.letters.subtitle}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {letterTypes.map((lt) => (
            <Dialog
              key={lt.value}
              open={open && letterType === lt.value}
              onOpenChange={(v) => {
                setOpen(v);
                if (v) {
                  setLetterType(lt.value);
                  setEmployeeId("");
                  setError(null);
                }
              }}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="group bg-muted/40 hover:bg-muted/70 focus-visible:ring-ring flex flex-col items-start gap-1.5 rounded-xl border p-4 text-start transition-colors focus-visible:ring-2 focus-visible:outline-none">
                  <span className="font-medium">{lt.label}</span>
                  <span className="text-muted-foreground text-xs">{lt.desc}</span>
                </button>
              </DialogTrigger>

              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{lt.label}</DialogTitle>
                  <DialogDescription>{lt.desc}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="letter-employee">{t.letters.selectEmployee}</Label>
                    <Select value={employeeId} onValueChange={setEmployeeId}>
                      <SelectTrigger id="letter-employee" className="w-full">
                        <SelectValue placeholder={t.letters.selectEmployee} />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.length === 0 && (
                          <SelectItem value="__none__" disabled>
                            {t.letters.noEmployees}
                          </SelectItem>
                        )}
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.firstNameAr && emp.lastNameAr
                              ? `${emp.firstNameAr} ${emp.lastNameAr}`
                              : `${emp.firstName} ${emp.lastName}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {error && <p className="text-destructive text-sm">{error}</p>}
                </div>

                <DialogFooter>
                  <Button
                    onClick={handleGenerate}
                    disabled={!employeeId || isGenerating}
                    className="gap-2">
                    {isGenerating ? (
                      <IconLoader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <IconDownload className="h-4 w-4" />
                    )}
                    {isGenerating ? t.letters.generating : t.letters.generate}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
