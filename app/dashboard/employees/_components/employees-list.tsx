import { IconEye, IconPencil, IconPlus, IconTrash, IconUser } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useVirtualizer } from "@tanstack/react-virtual";
import * as React from "react";

import type { Employee } from "@/lib/types/core-hr";
import { getEmployeeFullName } from "@/lib/types/core-hr";

import { EmployeeStatusBadge } from "./employee-status-badge";

export function EmployeesList({
  employees,
  getDeptName,
  getJobName,
  onAdd,
  onView,
  onEdit,
  onDelete,
}: {
  employees: Employee[];
  getDeptName: (departmentId: string) => string;
  getJobName: (jobTitleId: string) => string;
  onAdd: () => void;
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}) {
  const parentRef = React.useRef<HTMLDivElement | null>(null);
  const spacerRef = React.useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: employees.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 10,
  });

  const totalSize = rowVirtualizer.getTotalSize();

  React.useEffect(() => {
    if (!spacerRef.current) return;
    spacerRef.current.style.height = `${totalSize}px`;
  }, [totalSize]);

  return (
    <>
      <div className="md:hidden space-y-3">
        {employees.length === 0 ? (
          <Empty className="border rounded-lg">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconUser className="size-5" />
              </EmptyMedia>
              <EmptyTitle>لا يوجد موظفون</EmptyTitle>
              <EmptyDescription>ابدأ بإضافة أول موظف لعرض البيانات هنا.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={onAdd}>
                <IconPlus className="ms-2 h-4 w-4" />
                إضافة موظف
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          employees.map((emp) => (
            <Card key={emp.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <IconUser className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{getEmployeeFullName(emp, "ar")}</div>
                        <div className="text-sm text-muted-foreground truncate">{emp.email}</div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                      <div className="text-muted-foreground">الرقم</div>
                      <div className="text-start">
                        <Badge variant="outline">{emp.employeeNumber}</Badge>
                      </div>

                      <div className="text-muted-foreground">القسم</div>
                      <div className="text-start truncate">{getDeptName(emp.departmentId)}</div>

                      <div className="text-muted-foreground">المسمى</div>
                      <div className="text-start truncate">{getJobName(emp.jobTitleId)}</div>

                      <div className="text-muted-foreground">الحالة</div>
                      <div className="text-start">
                        <EmployeeStatusBadge status={emp.status} />
                      </div>

                      <div className="text-muted-foreground">تاريخ التعيين</div>
                      <div className="text-start">{emp.hireDate}</div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" aria-label="عرض" onClick={() => onView(emp)} title="عرض">
                      <IconEye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="تعديل" onClick={() => onEdit(emp)} title="تعديل">
                      <IconPencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="حذف" onClick={() => onDelete(emp)} title="حذف">
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="hidden md:block rounded-md border">
        <div className="border-b bg-muted/50">
          <div className="grid grid-cols-[140px_2fr_1fr_1fr_140px_160px_140px] items-center gap-2 px-3 py-2 text-sm font-medium">
            <div className="text-start">الرقم</div>
            <div className="text-start">الاسم</div>
            <div className="text-start">القسم</div>
            <div className="text-start">المسمى</div>
            <div className="text-start">الحالة</div>
            <div className="text-start">تاريخ التعيين</div>
            <div className="text-start">إجراءات</div>
          </div>
        </div>

        {employees.length === 0 ? (
          <div className="p-3">
            <Empty className="border rounded-lg">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IconUser className="size-5" />
                </EmptyMedia>
                <EmptyTitle>لا يوجد موظفون</EmptyTitle>
                <EmptyDescription>ابدأ بإضافة أول موظف لعرض البيانات هنا.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={onAdd}>
                  <IconPlus className="ms-2 h-4 w-4" />
                  إضافة موظف
                </Button>
              </EmptyContent>
            </Empty>
          </div>
        ) : (
          <div ref={parentRef} className="max-h-[520px] overflow-auto">
            <div ref={spacerRef} className="relative">
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const emp = employees[virtualRow.index];
                return (
                  <div
                    key={emp.id}
                    className="absolute top-0 start-0 w-full border-b will-change-transform"
                    ref={(el) => {
                      if (!el) return;
                      el.style.transform = `translateY(${virtualRow.start}px)`;
                    }}
                    data-index={virtualRow.index}
                  >
                    <div className="grid grid-cols-[140px_2fr_1fr_1fr_140px_160px_140px] items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50">
                      <div>
                        <Badge variant="outline">{emp.employeeNumber}</Badge>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <IconUser className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{getEmployeeFullName(emp, "ar")}</div>
                            <div className="text-xs text-muted-foreground truncate">{emp.email}</div>
                          </div>
                        </div>
                      </div>
                      <div className="truncate">{getDeptName(emp.departmentId)}</div>
                      <div className="truncate">{getJobName(emp.jobTitleId)}</div>
                      <div>
                        <EmployeeStatusBadge status={emp.status} />
                      </div>
                      <div className="truncate">{emp.hireDate}</div>
                      <div>
                        <div className="flex items-center gap-1 justify-start">
                          <Button variant="ghost" size="icon" aria-label="عرض" onClick={() => onView(emp)} title="عرض">
                            <IconEye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label="تعديل" onClick={() => onEdit(emp)} title="تعديل">
                            <IconPencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label="حذف" onClick={() => onDelete(emp)} title="حذف">
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
