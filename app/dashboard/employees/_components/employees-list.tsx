"use client";

import Link from "next/link";
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
  EmptyTitle
} from "@/components/ui/empty";
import { useVirtualizer } from "@tanstack/react-virtual";
import * as React from "react";

import type { Employee } from "@/lib/types/core-hr";
import { getEmployeeFullName } from "@/lib/types/core-hr";

import { EmployeeStatusBadge } from "./employee-status-badge";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function EmployeesList({
  employees,
  getDeptName,
  getJobName,
  onAdd,
  onEdit,
  onDelete
}: {
  employees: Employee[];
  getDeptName: (departmentId: string) => string;
  getJobName: (jobTitleId: string) => string;
  onAdd: () => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}) {
  const locale = useClientLocale();
  const t = getText(locale);
  const parentRef = React.useRef<HTMLDivElement | null>(null);
  const spacerRef = React.useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: employees.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 10
  });

  const totalSize = rowVirtualizer.getTotalSize();

  React.useEffect(() => {
    if (!spacerRef.current) return;
    spacerRef.current.style.height = `${totalSize}px`;
  }, [totalSize]);

  return (
    <>
      <div className="space-y-3 md:hidden">
        {employees.length === 0 ? (
          <Empty className="rounded-lg border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconUser className="size-5" />
              </EmptyMedia>
              <EmptyTitle>{t.documents.noEmployees}</EmptyTitle>
              <EmptyDescription>{t.employees.emptyState}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={onAdd}>
                <IconPlus className="ms-2 h-4 w-4" />
                {t.employees.add}
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
                      <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full">
                        <IconUser className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/dashboard/employees/${emp.id}`}
                          className="truncate font-medium transition-colors hover:text-primary hover:underline">
                          {getEmployeeFullName(emp, locale)}
                        </Link>
                        <div className="text-muted-foreground truncate text-sm">{emp.email}</div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                      <div className="text-muted-foreground">{t.common.number}</div>
                      <div className="text-start">
                        <Badge variant="outline">{emp.employeeNumber}</Badge>
                      </div>

                      <div className="text-muted-foreground">{t.common.department}</div>
                      <div className="truncate text-start">{getDeptName(emp.departmentId)}</div>

                      <div className="text-muted-foreground">{t.common.jobTitle}</div>
                      <div className="truncate text-start">{getJobName(emp.jobTitleId)}</div>

                      <div className="text-muted-foreground">{t.workflows.directManager}</div>
                      <div className="truncate text-start">
                        {emp.manager ? getEmployeeFullName(emp.manager, locale) : "-"}
                      </div>

                      <div className="text-muted-foreground">{t.common.status}</div>
                      <div className="text-start">
                        <EmployeeStatusBadge status={emp.status} />
                      </div>

                      <div className="text-muted-foreground">{t.common.hireDate}</div>
                      <div className="text-start">{emp.hireDate}</div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-center gap-1">
                    <Button variant="ghost" size="icon" aria-label={t.common.viewProfile} asChild>
                      <Link href={`/dashboard/employees/${emp.id}`} title={t.common.viewProfile}>
                        <IconEye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t.common.edit}
                      onClick={() => onEdit(emp)}
                      title={t.common.edit}>
                      <IconPencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t.common.delete}
                      onClick={() => onDelete(emp)}
                      title={t.common.delete}>
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="hidden rounded-md border md:block">
        <div className="bg-muted/50 border-b">
          <div className="grid grid-cols-[140px_2fr_1fr_1fr_1fr_140px_160px_140px] items-center gap-2 px-3 py-2 text-sm font-medium">
            <div className="text-start">{t.common.number}</div>
            <div className="text-start">{t.common.name}</div>
            <div className="text-start">{t.common.department}</div>
            <div className="text-start">{t.common.jobTitle}</div>
            <div className="text-start">{t.workflows.directManager}</div>
            <div className="text-start">{t.common.status}</div>
            <div className="text-start">{t.common.hireDate}</div>
            <div className="text-start">{t.common.actions}</div>
          </div>
        </div>

        {employees.length === 0 ? (
          <div className="p-3">
            <Empty className="rounded-lg border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IconUser className="size-5" />
                </EmptyMedia>
                <EmptyTitle>{t.documents.noEmployees}</EmptyTitle>
                <EmptyDescription>{t.employees.emptyState}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={onAdd}>
                  <IconPlus className="ms-2 h-4 w-4" />
                  {t.employees.add}
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
                    className="absolute start-0 top-0 w-full border-b will-change-transform"
                    ref={(el) => {
                      if (!el) return;
                      el.style.transform = `translateY(${virtualRow.start}px)`;
                    }}
                    data-index={virtualRow.index}>
                    <div className="hover:bg-muted/50 grid grid-cols-[140px_2fr_1fr_1fr_1fr_140px_160px_140px] items-center gap-2 px-3 py-2 text-sm">
                      <div>
                        <Badge variant="outline">{emp.employeeNumber}</Badge>
                      </div>
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full">
                            <IconUser className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/dashboard/employees/${emp.id}`}
                              className="truncate font-medium transition-colors hover:text-primary hover:underline">
                              {getEmployeeFullName(emp, locale)}
                            </Link>
                            <div className="text-muted-foreground truncate text-xs">
                              {emp.email}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="truncate">{getDeptName(emp.departmentId)}</div>
                      <div className="truncate">{getJobName(emp.jobTitleId)}</div>
                      <div className="truncate">
                        {emp.manager ? getEmployeeFullName(emp.manager, locale) : "-"}
                      </div>
                      <div>
                        <EmployeeStatusBadge status={emp.status} />
                      </div>
                      <div className="truncate">{emp.hireDate}</div>
                      <div>
                        <div className="flex items-center justify-start gap-1">
                          <Button variant="ghost" size="icon" aria-label={t.common.viewProfile} asChild>
                            <Link href={`/dashboard/employees/${emp.id}`} title={t.common.viewProfile}>
                              <IconEye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t.common.edit}
                            onClick={() => onEdit(emp)}
                            title={t.common.edit}>
                            <IconPencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t.common.delete}
                            onClick={() => onDelete(emp)}
                            title={t.common.delete}>
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
