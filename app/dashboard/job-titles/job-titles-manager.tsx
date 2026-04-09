"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
import { IconPlus, IconPencil, IconTrash, IconSearch } from "@tabler/icons-react";

import type { JobTitle } from "@/lib/types/core-hr";
import { getLevelLabelAr } from "@/lib/types/core-hr";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

// Validation schema
const jobTitleSchema = z.object({
  name: z.string().min(2, t.common.nameRequired),
  nameAr: z.string().optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  level: z.string().optional(),
  minSalary: z.string().optional(),
  maxSalary: z.string().optional(),
});

type JobTitleFormData = z.infer<typeof jobTitleSchema>;

// Initial data
const initialJobTitles: JobTitle[] = [
  {
    id: "job-1",
    name: "Software Engineer",
    nameAr: t.common.jobTitleExample,
    code: "SE",
    level: 2,
    minSalary: 12000,
    maxSalary: 20000,
    employeesCount: 8,
    tenantId: "tenant-1",
    createdAt: "2026-01-01T10:00:00Z",
    updatedAt: "2026-01-01T10:00:00Z",
  },
  {
    id: "job-2",
    name: "Senior Software Engineer",
    nameAr: "مهندس برمجيات أول",
    code: "SSE",
    level: 3,
    minSalary: 18000,
    maxSalary: 28000,
    employeesCount: 4,
    tenantId: "tenant-1",
    createdAt: "2026-01-01T10:00:00Z",
    updatedAt: "2026-01-01T10:00:00Z",
  },
  {
    id: "job-3",
    name: "HR Specialist",
    nameAr: "أخصائي موارد بشرية",
    code: "HRS",
    level: 2,
    minSalary: 8000,
    maxSalary: 14000,
    employeesCount: 3,
    tenantId: "tenant-1",
    createdAt: "2026-01-01T10:00:00Z",
    updatedAt: "2026-01-01T10:00:00Z",
  },
  {
    id: "job-4",
    name: "Accountant",
    nameAr: "محاسب",
    code: "ACC",
    level: 2,
    minSalary: 7000,
    maxSalary: 12000,
    employeesCount: 4,
    tenantId: "tenant-1",
    createdAt: "2026-01-01T10:00:00Z",
    updatedAt: "2026-01-01T10:00:00Z",
  },
  {
    id: "job-5",
    name: "Department Manager",
    nameAr: "مدير قسم",
    code: "MGR",
    level: 4,
    minSalary: 20000,
    maxSalary: 35000,
    employeesCount: 5,
    tenantId: "tenant-1",
    createdAt: "2026-01-01T10:00:00Z",
    updatedAt: "2026-01-01T10:00:00Z",
  },
  {
    id: "job-6",
    name: "Sales Representative",
    nameAr: "مندوب مبيعات",
    code: "SR",
    level: 1,
    minSalary: 5000,
    maxSalary: 9000,
    employeesCount: 12,
    tenantId: "tenant-1",
    createdAt: "2026-01-01T10:00:00Z",
    updatedAt: "2026-01-01T10:00:00Z",
  },
];

const levels = [
  { value: "1", label: t.jobTitles.entryLevel },
  { value: "2", label: t.jobTitles.midLevel },
  { value: "3", label: t.jobTitles.senior },
  { value: "4", label: t.jobTitles.managerLevel },
  { value: "5", label: t.jobTitles.director },
  { value: "6", label: t.jobTitles.executive },
];

export function JobTitlesManager() {
  const locale = useClientLocale("ar");
  const numLocale = locale === "en" ? "en-US" : "ar-SA";
  const [jobTitles, setJobTitles] = useState<JobTitle[]>(initialJobTitles);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJobTitle, setEditingJobTitle] = useState<JobTitle | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobTitleToDelete, setJobTitleToDelete] = useState<JobTitle | null>(null);

  const form = useForm<JobTitleFormData>({
    resolver: zodResolver(jobTitleSchema),
    defaultValues: {
      name: "",
      nameAr: "",
      code: "",
      description: "",
      level: "",
      minSalary: "",
      maxSalary: "",
    },
  });

  // Filter
  const filteredJobTitles = jobTitles.filter((job) => {
    const query = searchQuery.toLowerCase();
    return (
      job.name.toLowerCase().includes(query) ||
      job.nameAr?.toLowerCase().includes(query) ||
      job.code?.toLowerCase().includes(query)
    );
  });

  // Add
  const handleAdd = () => {
    setEditingJobTitle(null);
    form.reset({
      name: "",
      nameAr: "",
      code: "",
      description: "",
      level: "",
      minSalary: "",
      maxSalary: "",
    });
    setIsDialogOpen(true);
  };

  // Edit
  const handleEdit = (job: JobTitle) => {
    setEditingJobTitle(job);
    form.reset({
      name: job.name,
      nameAr: job.nameAr || "",
      code: job.code || "",
      description: job.description || "",
      level: job.level?.toString() || "",
      minSalary: job.minSalary?.toString() || "",
      maxSalary: job.maxSalary?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  // Submit
  const onSubmit = (data: JobTitleFormData) => {
    if (editingJobTitle) {
      setJobTitles((prev) =>
        prev.map((j) =>
          j.id === editingJobTitle.id
            ? {
                ...j,
                name: data.name,
                nameAr: data.nameAr,
                code: data.code,
                description: data.description,
                level: data.level ? parseInt(data.level) : undefined,
                minSalary: data.minSalary ? parseFloat(data.minSalary) : undefined,
                maxSalary: data.maxSalary ? parseFloat(data.maxSalary) : undefined,
                updatedAt: new Date().toISOString(),
              }
            : j
        )
      );
    } else {
      setJobTitles((prev) => {
        const nextNum =
          prev.reduce((max, j) => {
            const n = Number.parseInt(j.id.replace(/^job-/, ""), 10);
            return Number.isFinite(n) ? Math.max(max, n) : max;
          }, 0) + 1;

        const newJob: JobTitle = {
          id: `job-${nextNum}`,
          name: data.name,
          nameAr: data.nameAr,
          code: data.code,
          description: data.description,
          level: data.level ? parseInt(data.level) : undefined,
          minSalary: data.minSalary ? parseFloat(data.minSalary) : undefined,
          maxSalary: data.maxSalary ? parseFloat(data.maxSalary) : undefined,
          employeesCount: 0,
          tenantId: "tenant-1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return [...prev, newJob];
      });
    }
    setIsDialogOpen(false);
    form.reset();
  };

  // Delete
  const handleDeleteClick = (job: JobTitle) => {
    setJobTitleToDelete(job);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (jobTitleToDelete) {
      setJobTitles((prev) => prev.filter((j) => j.id !== jobTitleToDelete.id));
      setDeleteDialogOpen(false);
      setJobTitleToDelete(null);
    }
  };

  // Stats
  const totalEmployees = jobTitles.reduce((sum, j) => sum + j.employeesCount, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.jobTitles.totalTitles}</CardDescription>
            <CardTitle className="text-3xl">{jobTitles.length}</CardTitle>
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
            <CardDescription>{t.jobTitles.adminTitles}</CardDescription>
            <CardTitle className="text-3xl">
              {jobTitles.filter((j) => j.level && j.level >= 4).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t.jobTitles.title}</CardTitle>
              <CardDescription>{t.jobTitles.subtitle}</CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <IconPlus className="ms-2 h-4 w-4" />
              {t.jobTitles.pAddTitle}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <IconSearch className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t.common.searchDots}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{t.common.jobTitle}</TableHead>
                  <TableHead className="text-start">{t.common.code}</TableHead>
                  <TableHead className="text-start">{t.jobTitles.level}</TableHead>
                  <TableHead className="text-start">{t.jobTitles.salaryRange}</TableHead>
                  <TableHead className="text-start">{t.common.employees}</TableHead>
                  <TableHead className="text-start w-[100px]">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobTitles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {t.jobTitles.pNoJobTitlesFound}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobTitles.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{job.nameAr || job.name}</div>
                          {job.nameAr && (
                            <div className="text-sm text-muted-foreground">{job.name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.code && <Badge variant="outline">{job.code}</Badge>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getLevelLabelAr(job.level)}</Badge>
                      </TableCell>
                      <TableCell>
                        {job.minSalary || job.maxSalary ? (
                          <span className="text-sm">
                            {job.minSalary?.toLocaleString(numLocale)} - {job.maxSalary?.toLocaleString(numLocale)} {t.jobTitles.sar}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{job.employeesCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t.common.edit}
                            onClick={() => handleEdit(job)}
                          >
                            <IconPencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t.common.delete}
                            onClick={() => handleDeleteClick(job)}
                            disabled={job.employeesCount > 0}
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

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingJobTitle ? t.jobTitles.editJobTitle : t.jobTitles.addJobTitle}
            </DialogTitle>
            <DialogDescription>
              {editingJobTitle
                ? t.jobTitles.editDesc
                : t.jobTitles.addDesc}
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
                      <Input placeholder="Software Engineer" {...field} />
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
                      <Input placeholder={t.common.jobTitleExample} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.common.code}</FormLabel>
                      <FormControl>
                        <Input placeholder="SE" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.jobTitles.level}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t.common.selectLevel} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {levels.map((lvl) => (
                            <SelectItem key={lvl.value} value={lvl.value}>
                              {lvl.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.jobPostings.minSalary}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="8000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.jobPostings.maxSalary}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="15000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.common.description}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t.jobTitles.responsibilitiesPlaceholder}
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
                >{t.common.cancel}</Button>
                <Button type="submit">
                  {editingJobTitle ? t.common.saveChanges : t.common.add}
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
              {t.jobTitles.pTheJobTitleWillBePermanentlyDe} &quot;{jobTitleToDelete?.nameAr || jobTitleToDelete?.name}&quot; {t.jobTitles.pPermanently}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">{t.common.delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
