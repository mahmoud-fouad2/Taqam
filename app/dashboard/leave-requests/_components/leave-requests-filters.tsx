"use client";

import type { LeaveRequestStatus } from "@/lib/types/leave";

import { IconSearch } from "@tabler/icons-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function LeaveRequestsFilters({
  activeTab,
  onActiveTabChange,
  searchQuery,
  onSearchQueryChange,
  filterDepartment,
  onFilterDepartmentChange,
  departments
}: {
  activeTab: LeaveRequestStatus | "all";
  onActiveTabChange: (value: LeaveRequestStatus | "all") => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  filterDepartment: string;
  onFilterDepartmentChange: (value: string) => void;
  departments: Array<{ id: string; name: string }>;
}) {
  const locale = useClientLocale();
  const t = getText(locale);
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <Tabs
        value={activeTab}
        onValueChange={(v) => onActiveTabChange(v as LeaveRequestStatus | "all")}>
        <TabsList>
          <TabsTrigger value="all">{t.common.all}</TabsTrigger>
          <TabsTrigger value="pending">{t.common.pending}</TabsTrigger>
          <TabsTrigger value="approved">{t.common.accepted}</TabsTrigger>
          <TabsTrigger value="rejected">{t.common.rejected}</TabsTrigger>
          <TabsTrigger value="taken">{t.leaveBalances.taken}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex gap-2">
        <div className="relative">
          <IconSearch className="text-muted-foreground absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t.common.searchDots}
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-[200px] ps-9"
          />
        </div>

        <Select value={filterDepartment} onValueChange={onFilterDepartmentChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t.common.allDepartments} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.common.allDepartments}</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
