"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import { ArrowUpDown, CheckIcon, ChevronDown, MoreHorizontal, PlusCircle } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export type User = {
  id: string;
  name: string;
  image?: string | null;
  status: string;
  role: string;
  email: string;
  lastLoginAt?: string | null;
};

export default function UsersDataTable({ data }: { data: User[] }) {
  const locale = useClientLocale();
  const t = getText(locale);
  const router = useRouter();
  const [uiLocale, setUiLocale] = React.useState<"ar" | "en">("ar");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const lang = typeof document !== "undefined" ? document.documentElement.lang : "ar";
    setUiLocale(lang === "en" ? "en" : "ar");
  }, []);

  const isRtl = uiLocale === "ar";

  const [tableData, setTableData] = React.useState<User[]>(data);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [deletingUserId, setDeletingUserId] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const handleDelete = async (userId: string) => {
    const confirmed = window.confirm(
      isRtl ? "هل تريد حذف هذا المستخدم؟" : "Do you want to delete this user?"
    );

    if (!confirmed || deletingUserId) {
      return;
    }

    setActionError(null);
    setDeletingUserId(userId);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? (isRtl ? "تعذر حذف المستخدم" : "Failed to delete user"));
      }

      setTableData((prev) => prev.filter((user) => user.id !== userId));
      router.refresh();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : isRtl
            ? t.common.unexpectedError
            : "Unexpected error"
      );
    } finally {
      setDeletingUserId(null);
    }
  };

  const statusLabel = (value: string) => {
    if (!isRtl) return value;
    if (value === "ACTIVE") return t.common.active;
    if (value === "PENDING_VERIFICATION") return t.common.pendingActivation;
    if (value === "INACTIVE") return t.common.inactive;
    if (value === "SUSPENDED") return t.common.suspended;
    return value;
  };

  const formatLastLogin = (iso: string | null | undefined) => {
    if (!iso) return "-";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString(isRtl ? "ar-SA" : "en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const columns = React.useMemo<ColumnDef<User>[]>(() => {
    return [
      {
        accessorKey: "id",
        header: "#",
        cell: ({ row }) => row.getValue("id")
      },
      {
        accessorKey: "name",
        header: isRtl ? t.common.name : "Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={row.original.image ?? undefined} alt={row.original.name} />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="capitalize">{row.getValue("name")}</div>
          </div>
        )
      },
      {
        accessorKey: "role",
        header: ({ column }) => {
          return (
            <Button
              className="-ms-3"
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              {isRtl ? t.common.role : "Role"}
              <ArrowUpDown className="ms-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => row.getValue("role")
      },
      {
        accessorKey: "email",
        header: ({ column }) => {
          return (
            <Button
              className="-ms-3"
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              {isRtl ? "البريد" : "Email"}
              <ArrowUpDown className="ms-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => row.getValue("email")
      },
      {
        accessorKey: "status",
        header: ({ column }) => {
          return (
            <Button
              className="-ms-3"
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              {isRtl ? t.common.status : "Status"}
              <ArrowUpDown className="ms-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const status = row.original.status;
          const label = statusLabel(status);
          if (status === "ACTIVE") {
            return (
              <Badge
                className={cn("capitalize", {
                  "bg-green-100 text-green-700 hover:bg-green-100": status === "ACTIVE"
                })}>
                {label}
              </Badge>
            );
          } else if (status === "PENDING_VERIFICATION") {
            return (
              <Badge
                className={cn("capitalize", {
                  "bg-orange-100 text-orange-700 hover:bg-orange-100":
                    status === "PENDING_VERIFICATION"
                })}>
                {label}
              </Badge>
            );
          } else if (status === "INACTIVE") {
            return (
              <Badge
                className={cn("capitalize", {
                  "bg-gray-100 text-gray-700 hover:bg-gray-100": status === "INACTIVE"
                })}>
                {label}
              </Badge>
            );
          } else if (status === "SUSPENDED") {
            return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">{label}</Badge>;
          }
          return <span className="capitalize">{label}</span>;
        }
      },
      {
        accessorKey: "lastLoginAt",
        header: ({ column }) => {
          return (
            <Button
              className="-ms-3"
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              {isRtl ? "آخر دخول" : "Last login"}
              <ArrowUpDown className="ms-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => formatLastLogin(row.original.lastLoginAt)
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">{isRtl ? "فتح القائمة" : "Open menu"}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{isRtl ? t.common.actions : "Actions"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href={`/dashboard/users/${row.original.id}`}>
                    {isRtl ? "عرض المستخدم" : "View user"}
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={`/dashboard/users/${row.original.id}/edit`}>
                    {isRtl ? t.common.edit : "Edit"}
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={deletingUserId === row.original.id}
                  onSelect={(e) => {
                    e.preventDefault();
                    void handleDelete(row.original.id);
                  }}>
                  {deletingUserId === row.original.id
                    ? isRtl
                      ? t.common.deleting
                      : "Deleting..."
                    : isRtl
                      ? t.common.delete
                      : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }
      }
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletingUserId, isRtl, router, tableData]);

  const table = useReactTable({
    data: tableData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection
    }
  });

  const statuses = [
    {
      value: "active",
      label: isRtl ? t.common.active : "Active"
    },
    {
      value: "inactive",
      label: isRtl ? t.common.inactive : "Inactive"
    },
    {
      value: "pending",
      label: isRtl ? "قيد المراجعة" : "Pending"
    }
  ];

  const plans = [
    {
      value: "basic",
      label: isRtl ? t.common.basic : "Basic"
    },
    {
      value: "team",
      label: isRtl ? "فريق" : "Team"
    },
    {
      value: "enterprise",
      label: isRtl ? t.common.institutions : "Enterprise"
    }
  ];

  const roles = [
    {
      value: "construction-foreman",
      label: isRtl ? "مراقب مواقع" : "Construction Foreman"
    },
    {
      value: "project-manager",
      label: isRtl ? "مدير مشروع" : "Project Manager"
    },
    {
      value: "surveyor",
      label: isRtl ? "مسّاح" : "Surveyor"
    },
    {
      value: "architect",
      label: isRtl ? "مهندس معماري" : "Architect"
    },
    {
      value: "subcontractor",
      label: isRtl ? "مقاول فرعي" : "Subcontractor"
    },
    {
      value: "electrician",
      label: isRtl ? "كهربائي" : "Electrician"
    },
    {
      value: "estimator",
      label: isRtl ? "مُقدّر تكاليف" : "Estimator"
    }
  ];

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center gap-4">
        <div className="flex gap-2">
          <Input
            placeholder={isRtl ? "بحث عن مستخدم..." : "Search users..."}
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
            className="h-12 max-w-sm rounded-xl"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-12 rounded-xl px-4">
                <PlusCircle className="me-2 h-4 w-4" />
                {isRtl ? t.common.status : "Status"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-0">
              <Command>
                <CommandInput placeholder={isRtl ? t.common.status : "Status"} className="h-12" />
                <CommandList>
                  <CommandEmpty>{isRtl ? "لا توجد حالة." : "No status found."}</CommandEmpty>
                  <CommandGroup>
                    {statuses.map((status) => (
                      <CommandItem
                        key={status.value}
                        value={status.value}
                        onSelect={(currentValue) => {
                          // setValue(currentValue === value ? "" : currentValue);
                          // setOpen(false);
                        }}>
                        <div className="flex items-center gap-3 py-1">
                          <Checkbox id={status.value} />
                          <label
                            htmlFor={status.value}
                            className="leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {status.label}
                          </label>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-12 rounded-xl px-4">
                <PlusCircle className="me-2 h-4 w-4" />
                {isRtl ? "الخطة" : "Plan"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-0">
              <Command>
                <CommandInput placeholder={isRtl ? "الخطة" : "Plan"} className="h-12" />
                <CommandList>
                  <CommandEmpty>{isRtl ? "لا توجد خطة." : "No plan found."}</CommandEmpty>
                  <CommandGroup>
                    {plans.map((plan) => (
                      <CommandItem
                        key={plan.value}
                        value={plan.value}
                        onSelect={(currentValue) => {
                          // setValue(currentValue === value ? "" : currentValue);
                          // setOpen(false);
                        }}>
                        <div className="flex items-center gap-3 py-1">
                          <Checkbox id={plan.value} />
                          <label
                            htmlFor={plan.value}
                            className="leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {plan.label}
                          </label>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-12 rounded-xl px-4">
                <PlusCircle className="me-2 h-4 w-4" />
                {isRtl ? t.common.role : "Role"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-0">
              <Command>
                <CommandInput placeholder={isRtl ? t.common.role : "Role"} className="h-12" />
                <CommandList>
                  <CommandEmpty>{isRtl ? "لا يوجد دور." : "No role found."}</CommandEmpty>
                  <CommandGroup>
                    {roles.map((role) => (
                      <CommandItem
                        key={role.value}
                        value={role.value}
                        onSelect={(currentValue) => {
                          // setValue(currentValue === value ? "" : currentValue);
                          // setOpen(false);
                        }}>
                        <div className="flex items-center gap-3 py-1">
                          <Checkbox id={role.value} />
                          <label
                            htmlFor={role.value}
                            className="leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {role.label}
                          </label>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ms-auto">
              {isRtl ? "الأعمدة" : "Columns"} <ChevronDown className="ms-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}>
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {actionError ? <p className="text-destructive mb-4 text-sm">{actionError}</p> : null}
      <Table className="border-t">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {isRtl ? "لا توجد نتائج." : "No results."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-end gap-2 pt-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {isRtl
            ? `${table.getFilteredSelectedRowModel().rows.length} من ${table.getFilteredRowModel().rows.length} صف(وف) محدد.`
            : `${table.getFilteredSelectedRowModel().rows.length} of ${table.getFilteredRowModel().rows.length} row(s) selected.`}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}>
            {isRtl ? "السابق" : "Previous"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}>
            {isRtl ? "التالي" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
