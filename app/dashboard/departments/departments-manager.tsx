"use client";

import { useState, useEffect, useCallback } from "react";
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
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableEmptyRow } from "@/components/empty-states/table-empty-row";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IconPlus, IconPencil, IconTrash, IconSearch, IconRefresh } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";

import type { Department, DepartmentCreateInput } from "@/lib/types/core-hr";

// Validation schema
const departmentSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب (حرفين على الأقل)"),
  nameAr: z.string().optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  parentId: z.string().optional(),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

export function DepartmentsManager() {
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);

  // Fetch departments from API using React Query
  const { data: departments = [], isLoading: loading, refetch: fetchDepartments } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await fetch("/api/departments");
      if (!res.ok) throw new Error("Failed to fetch departments");
      const data = await res.json();
      return data.data || [];
    },
  });

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
      nameAr: "",
      code: "",
      description: "",
      parentId: "",
    },
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
      parentId: "",
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
      parentId: dept.parentId || "",
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
        parentId: data.parentId === "none" || data.parentId === "" ? undefined : data.parentId,
      };
      
      if (editingDepartment) {
        // Update existing
        const res = await fetch(`/api/departments/${editingDepartment.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update department");
        toast.success("تم تحديث القسم بنجاح");
        await fetchDepartments();
      } else {
        // Create new
        const res = await fetch("/api/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create department");
        toast.success("تم إضافة القسم بنجاح");
        await fetchDepartments();
      }
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error saving department:", error);
      toast.error(editingDepartment ? "فشل في تحديث القسم" : "فشل في إضافة القسم");
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
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete department");
        toast.success("تم حذف القسم بنجاح");
        await fetchDepartments();
      } catch (error) {
        console.error("Error deleting department:", error);
        toast.error("فشل في حذف القسم");
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
                <Skeleton className="h-8 w-16 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
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
            <CardDescription>إجمالي الأقسام</CardDescription>
            <CardTitle className="text-3xl">{departments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>إجمالي الموظفين</CardDescription>
            <CardTitle className="text-3xl">{totalEmployees}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>متوسط الموظفين لكل قسم</CardDescription>
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
              <CardTitle>الأقسام</CardTitle>
              <CardDescription>إدارة أقسام الشركة والهيكل التنظيمي</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" aria-label="تحديث" onClick={() => fetchDepartments()} title="تحديث">
                <IconRefresh className="h-4 w-4" />
              </Button>
              <Button onClick={handleAdd}>
                <IconPlus className="ms-2 h-4 w-4" />
                إضافة قسم
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <IconSearch className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9"
              />
            </div>
          </div>

          {/* Mobile: Cards */}
          <div className="md:hidden space-y-3">
            {filteredDepartments.length === 0 ? (
              <Empty className="border rounded-lg">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconPlus className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>لا توجد أقسام</EmptyTitle>
                  <EmptyDescription>
                    أضف قسمًا لبدء تنظيم الموظفين وهيكلة المنشأة.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={handleAdd}>
                    <IconPlus className="ms-2 h-4 w-4" />
                    إضافة قسم
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              filteredDepartments.map((dept) => (
                <Card key={dept.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{dept.nameAr || dept.name}</div>
                        {dept.nameAr ? (
                          <div className="text-sm text-muted-foreground truncate">{dept.name}</div>
                        ) : null}

                        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                          <div className="text-muted-foreground">الرمز</div>
                          <div className="text-start">
                            {dept.code ? <Badge variant="outline">{dept.code}</Badge> : <span className="text-muted-foreground">-</span>}
                          </div>

                          <div className="text-muted-foreground">الموظفين</div>
                          <div className="text-start">
                            <Badge variant="secondary">{dept.employeesCount}</Badge>
                          </div>

                          <div className="text-muted-foreground">الوصف</div>
                          <div className="text-start line-clamp-2">{dept.description || "-"}</div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" aria-label="تعديل" onClick={() => handleEdit(dept)}>
                          <IconPencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="حذف"
                          onClick={() => handleDeleteClick(dept)}
                          disabled={dept.employeesCount > 0}
                        >
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
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">الاسم</TableHead>
                  <TableHead className="text-start">الرمز</TableHead>
                  <TableHead className="text-start">الوصف</TableHead>
                  <TableHead className="text-start">الموظفين</TableHead>
                  <TableHead className="text-start w-[100px]">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.length === 0 ? (
                  <TableEmptyRow
                    colSpan={5}
                    title="لا توجد أقسام"
                    description="أضف قسمًا لبدء تنظيم الموظفين وهيكلة المنشأة."
                    icon={<IconPlus className="size-5" />}
                    actionLabel="إضافة قسم"
                    onAction={handleAdd}
                  />
                ) : (
                  filteredDepartments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{dept.nameAr || dept.name}</div>
                          {dept.nameAr && (
                            <div className="text-sm text-muted-foreground">{dept.name}</div>
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
                            aria-label="تعديل"
                            onClick={() => handleEdit(dept)}
                          >
                            <IconPencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="حذف"
                            onClick={() => handleDeleteClick(dept)}
                            disabled={dept.employeesCount > 0}
                          >
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
              {editingDepartment ? "تعديل القسم" : "إضافة قسم جديد"}
            </DialogTitle>
            <DialogDescription>
              {editingDepartment
                ? "قم بتعديل بيانات القسم"
                : "أدخل بيانات القسم الجديد"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم (بالإنجليزية) *</FormLabel>
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
                    <FormLabel>الاسم (بالعربية)</FormLabel>
                    <FormControl>
                      <Input placeholder="الموارد البشرية" {...field} />
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
                    <FormLabel>رمز القسم</FormLabel>
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
                    <FormLabel>القسم الأب</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر القسم الأب (اختياري)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">بدون (قسم رئيسي)</SelectItem>
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
                    <FormLabel>الوصف</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="وصف مختصر للقسم..."
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
                  disabled={saving}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "جاري الحفظ..." : editingDepartment ? "حفظ التعديلات" : "إضافة"}
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
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف القسم &quot;{departmentToDelete?.nameAr || departmentToDelete?.name}&quot; نهائياً.
              هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
