"use client";

import { IconSearch } from "@tabler/icons-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Department } from "@/lib/types/core-hr";

import { statusOptions } from "./employee-constants";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function EmployeesFilters({
  searchQuery,
  onSearchQueryChange,
  filterDept,
  onFilterDeptChange,
  filterStatus,
  onFilterStatusChange,
  departments,
}: {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  filterDept: string;
  onFilterDeptChange: (value: string) => void;
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  departments: Department[];
}) {
  const locale = useClientLocale();
  const t = getText(locale);
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <IconSearch className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t.employees.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="ps-9"
        />
      </div>

      <Select value={filterDept} onValueChange={onFilterDeptChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t.common.department} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t.common.allDepartments}</SelectItem>
          {departments.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.nameAr || d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filterStatus} onValueChange={onFilterStatusChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder={t.common.status} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t.attendance.allStatuses}</SelectItem>
          {statusOptions.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
