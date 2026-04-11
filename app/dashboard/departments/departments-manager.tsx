"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { TableEmptyRow } from "@/components/empty-states/table-empty-row";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IconPlus, IconPencil, IconTrash, IconSearch, IconRefresh } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

import type { Department, DepartmentCreateInput } from "@/lib/types/core-hr";

function createDepartmentSchema(nameRequiredMessage: string) {
  return z.object({
    name: z.string().min(2, nameRequiredMessage),
    nameAr: z.string().optional(),
    code: z.string().optional(),
    description: z.string().optional(),
    parentId: z.string().optional()
  });
}

type DepartmentFormData = z.infer<ReturnType<typeof createDepartmentSchema>>;

export function DepartmentsManager() {
  const locale = useClientLocale();
  const t = getText(locale);
  const departmentSchema = useMemo(
    () => createDepartmentSchema(t.common.nameRequired),
    [t.common.nameRequired]
  );
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);

  // Fetch departments from API using React Query
  const {
    data: departments = [],
    isLoading: loading,
    refetch: fetchDepartments
  } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await fetch("/api/departments");
      if (!res.ok) throw new Error("Failed to fetch departments");
      const data = await res.json();
      return data.data || [];
    }
  });

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
      nameAr: "",
      code: "",
      description: "",
      parentId: ""
    }
  });

  // Filter departments
  const filteredDepartments = departments.filter((dept) => {
    const query = searchQuery.toLowerCase();
    return (
      dept.name?.toLowerCase().includes(query) ||
      dept.nameAr?.toLowerCase().includes(query) ||
      dept.code?.toLowerCase().includes(query)
    );
  });

  // Open dialog for new department
  const handleAdd = () => {
    setEditingDepartment(null);
    form.reset({
      name: "",
      nameAr: "",
      code: "",
      description: "",
      parentId: ""
    });
    setIsDialogOpen(true);
  };

  // Open dialog for editing
  const handleEdit = (dept: Department) => {
    setEditingDepartment(dept);
    form.reset({
      name: dept.name,
      nameAr: dept.nameAr || "",
      code: dept.code || "",
      description: dept.description || "",
      parentId: dept.parentId || ""
    });
    setIsDialogOpen(true);
  };

  // Handle form submit
  const onSubmit = async (data: DepartmentFormData) => {
    setSaving(true);
    try {
      // Convert "none" to undefined for parentId
      const payload = {
        ...data,
        parentId: data.parentId === "none" || data.parentId === "" ? undefined : data.parentId
      };

      if (editingDepartment) {
        // Update existing
        const res = await fetch(`/api/departments/${editingDepartment.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Failed to update department");
        toast.success(t.departments.updatedSuccess);
        await fetchDepartments();
      } else {
        // Create new
        const res = await fetch("/api/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Failed to create department");
        toast.success(t.departments.addedSuccess);
        await fetchDepartments();
      }
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error saving department:", error);
      toast.error(editingDepartment ? t.departments.updateFailed : t.departments.addFailed);
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDeleteClick = (dept: Department) => {
    setDepartmentToDelete(dept);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (departmentToDelete) {
      try {
        const res = await fetch(`/api/departments/${departmentToDelete.id}`, {
          method: "DELETE"
        });
        if (!res.ok) throw new Error("Failed to delete department");
        toast.success(t.departments.deletedSuccess);
        await fetchDepartments();
      } catch (error) {
        console.error("Error deleting department:", error);
        toast.error(t.departments.deleteFailed);
      } finally {
        setDeleteDialogOpen(false);
        setDepartmentToDelete(null);
      }
    }
  };

  // Stats
  const totalEmployees = departments.reduce((sum, d) => sum + (d.employeesCount || 0), 0);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-2 h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.departments.totalDepartments}</CardDescription>
            <CardTitle className="text-3xl">{departments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.departments.totalEmployees}</CardDescription>
            <CardTitle className="text-3xl">{totalEmployees}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.departments.avgEmployees}</CardDescription>
            <CardTitle className="text-3xl">
              {departments.length > 0 ? Math.round(totalEmployees / departments.length) : 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t.departments.title}</CardTitle>
              <CardDescription>{t.departments.subtitle}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label={t.common.refresh}
                onClick={() => fetchDepartments()}
                title={t.common.refresh}>
                <IconRefresh className="h-4 w-4" />
              </Button>
              <Button onClick={handleAdd}>
                <IconPlus className="ms-2 h-4 w-4" />
                {t.departments.addDepartment}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4 flex items-center gap-2">
            <div className="relative max-w-sm flex-1">
              <IconSearch className="text-muted-foreground absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder={t.common.searchDots}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9"
              />
            </div>
          </div>

          {/* Mobile: Cards */}
          <div className="space-y-3 md:hidden">
            {filteredDepartments.length === 0 ? (
              <Empty className="rounded-lg border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconPlus className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>{t.departments.noDepartments}</EmptyTitle>
                  <EmptyDescription>{t.departments.noDepartmentsDesc}</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={handleAdd}>
                    <IconPlus className="ms-2 h-4 w-4" />
                    {t.departments.addDepartment}
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              filteredDepartments.map((dept) => (
                <Card key={dept.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{dept.nameAr || dept.name}</div>
                        {dept.nameAr ? (
                          <div className="text-muted-foreground truncate text-sm">{dept.name}</div>
                        ) : null}

                        <div className="mt-3 grid grid-cols-1 gap-x-3 gap-y-2 text-sm md:grid-cols-2">
                          <div className="text-muted-foreground">{t.common.code}</div>
                          <div className="text-start">
                            {dept.code ? (
                              <Badge variant="outline">{dept.code}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>

                          <div className="text-muted-foreground">{t.common.employees}</div>
                          <div className="text-start">
                            <Badge variant="secondary">{dept.employeesCount}</Badge>
                          </div>

                          <div className="text-muted-foreground">{t.common.description}</div>
                          <div className="line-clamp-2 text-start">{dept.description || "-"}</div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t.common.edit}
                          onClick={() => handleEdit(dept)}>
                          <IconPencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t.common.delete}
                          onClick={() => handleDeleteClick(dept)}
                          disabled={dept.employeesCount > 0}>
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Desktop: Table */}
          <div className="hidden overflow-x-auto rounded-md border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{t.common.name}</TableHead>
                  <TableHead className="text-start">{t.common.code}</TableHead>
                  <TableHead className="text-start">{t.common.description}</TableHead>
                  <TableHead className="text-start">{t.common.employees}</TableHead>
                  <TableHead className="w-[100px] text-start">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.length === 0 ? (
                  <TableEmptyRow
                    colSpan={5}
                    title={t.departments.noDepartments}
                    description={t.departments.noDepartmentsDesc}
                    icon={<IconPlus className="size-5" />}
                    actionLabel={t.departments.addDepartment}
                    onAction={handleAdd}
                  />
                ) : (
                  filteredDepartments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{dept.nameAr || dept.name}</div>
                          {dept.nameAr && (
                            <div className="text-muted-foreground text-sm">{dept.name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {dept.code && <Badge variant="outline">{dept.code}</Badge>}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {dept.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{dept.employeesCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t.common.edit}
                            onClick={() => handleEdit(dept)}>
                            <IconPencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t.common.delete}
                            onClick={() => handleDeleteClick(dept)}
                            disabled={dept.employeesCount > 0}>
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? t.departments.editDepartment : t.departments.addNewDepartment}
            </DialogTitle>
            <DialogDescription>
              {editingDepartment ? t.departments.editDesc : t.departments.addDesc}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.common.nameEn} *</FormLabel>
                    <FormControl>
                      <Input placeholder="Human Resources" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nameAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.common.nameAr}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.departments.pHumanResources} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.departments.departmentCode}</FormLabel>
                    <FormControl>
                      <Input placeholder="HR" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.common.parentDepartment}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.common.selectParentOptional} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{t.common.noParentDepartment}</SelectItem>
                        {departments
                          .filter((d) => d.id !== editingDepartment?.id)
                          .map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.nameAr || d.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.common.description}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t.common.shortDesc}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={saving}>
                  {t.common.cancel}
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving
                    ? t.common.saving
                    : editingDepartment
                      ? t.common.saveChanges
                      : t.common.add}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.common.areYouSure}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.departments.deleteConfirmPrefix} &quot;
              {departmentToDelete?.nameAr || departmentToDelete?.name}&quot;{" "}
              {t.departments.deleteConfirmSuffix} {t.common.cannotUndo}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground">
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
