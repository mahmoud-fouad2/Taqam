"use client";

import { IconUser } from "@tabler/icons-react";
import { formatCurrency } from "@/lib/types/payroll";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Employee } from "@/lib/types/core-hr";
import { getEmployeeFullName } from "@/lib/types/core-hr";

import { EmployeeStatusBadge } from "./employee-status-badge";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function EmployeeViewDialog({
  employee,
  onClose,
  onEdit,
  getDeptName,
  getJobName,
}: {
  employee: Employee | null;
  onClose: () => void;
  onEdit: (employee: Employee) => void;
  getDeptName: (departmentId: string) => string;
  getJobName: (jobTitleId: string) => string;
}) {
  const locale = useClientLocale();
  const t = getText(locale);
  return (
    <Dialog open={!!employee} onOpenChange={() => onClose()}>
      <DialogContent className="w-full sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t.employees.pEmployeeDetails}</DialogTitle>
        </DialogHeader>

        {employee && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-full bg-muted flex items-center justify-center">
                <IconUser className="size-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{getEmployeeFullName(employee, "ar")}</h3>
                <p className="text-sm text-muted-foreground">{employee.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t.employees.pEmployeeNumber}</span>
                <p className="font-medium">{employee.employeeNumber}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t.employees.pStatus}</span>
                <p>
                  <EmployeeStatusBadge status={employee.status} />
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">{t.employees.pDepartment}</span>
                <p className="font-medium">{getDeptName(employee.departmentId)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t.employees.pJobTitle}</span>
                <p className="font-medium">{getJobName(employee.jobTitleId)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t.employees.pHireDate}</span>
                <p className="font-medium">{employee.hireDate}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t.employees.pPhone}</span>
                <p className="font-medium">{employee.phone || "-"}</p>
              </div>
              {employee.basicSalary && (
                <div>
                  <span className="text-muted-foreground">{t.employees.pSalary}</span>
                  <p className="font-medium">{formatCurrency(employee.basicSalary)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t.common.close}</Button>
          <Button
            onClick={() => {
              if (!employee) return;
              onEdit(employee);
              onClose();
            }}
            disabled={!employee}
          >{t.common.edit}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
