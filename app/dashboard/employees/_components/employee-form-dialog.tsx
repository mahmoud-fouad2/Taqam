"use client";

import { useState } from "react";

import type { UseFormReturn } from "react-hook-form";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
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
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  getEmployeeFullName,
  type Department,
  type Employee,
  type JobTitle
} from "@/lib/types/core-hr";

import { contractTypes, statusOptions } from "./employee-constants";
import type { EmployeeFormData } from "./employee-form-schema";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";
import { cn } from "@/lib/utils";

const t = getText("ar");

export function EmployeeFormDialog({
  open,
  onOpenChange,
  editingEmployee,
  departments,
  jobTitles,
  employees,
  form,
  saving,
  onSubmit
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEmployee: Employee | null;
  departments: Department[];
  jobTitles: JobTitle[];
  employees: Employee[];
  form: UseFormReturn<EmployeeFormData>;
  saving: boolean;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
}) {
  const locale = useClientLocale();
  const t = getText(locale);
  const [jobTitlePickerOpen, setJobTitlePickerOpen] = useState(false);
  const managerOptions = employees.filter(
    (employee) => employee.id !== editingEmployee?.id && employee.status !== "terminated"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {editingEmployee ? t.employeeForm.editTitle : t.employeeForm.addTitle}
          </DialogTitle>
          <DialogDescription>
            {editingEmployee ? t.employeeForm.editDesc : t.employeeForm.addDesc}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="flex h-auto w-full flex-wrap justify-start">
                <TabsTrigger value="personal" className="flex-1 min-w-[140px]">
                  {t.employees.personalInfo}
                </TabsTrigger>
                <TabsTrigger value="employment" className="flex-1 min-w-[140px]">
                  {t.employees.employmentInfo}
                </TabsTrigger>
                <TabsTrigger value="salary" className="flex-1 min-w-[140px]">
                  {t.leaveTypes.salary}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.employees.firstNameEn}</FormLabel>
                        <FormControl>
                          <Input placeholder="Ahmed" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="firstNameAr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.employees.firstNameAr}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.employeeForm.firstNamePlaceholder} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.employees.lastNameEn}</FormLabel>
                        <FormControl>
                          <Input placeholder="Al-Saud" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastNameAr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.employees.lastNameAr}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.employeeForm.lastNamePlaceholder} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="managerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.workflows.directManager}</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                          value={field.value || "none"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  locale === "ar" ? "اختر المدير المباشر" : "Choose direct manager"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">-</SelectItem>
                            {managerOptions.map((manager) => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {getEmployeeFullName(manager, locale)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.employeeForm.emailLabel}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="ahmed@company.sa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.common.phone}</FormLabel>
                        <FormControl>
                          <Input placeholder="+966501234567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nationalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.employees.nationalId}</FormLabel>
                        <FormControl>
                          <Input placeholder="1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="employment" className="mt-4 space-y-4">
                <FormField
                  control={form.control}
                  name="employeeNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.employees.employeeNumber}</FormLabel>
                      <FormControl>
                        <Input placeholder="EMP001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.employeeForm.departmentLabel}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t.jobPostings.chooseDept} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((d) => (
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
                    name="jobTitleId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t.employeeForm.jobTitleLabel}</FormLabel>
                        <Popover open={jobTitlePickerOpen} onOpenChange={setJobTitlePickerOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}>
                                <span className="truncate">
                                  {jobTitles.find((jobTitle) => jobTitle.id === field.value)
                                    ? jobTitles.find((jobTitle) => jobTitle.id === field.value)?.nameAr ||
                                      jobTitles.find((jobTitle) => jobTitle.id === field.value)?.name
                                    : t.employeeForm.selectJobTitle}
                                </span>
                                <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                            <Command>
                              <CommandInput
                                placeholder={
                                  locale === "ar"
                                    ? "ابحث في المسميات الوظيفية"
                                    : "Search job titles"
                                }
                              />
                              <CommandList>
                                <CommandEmpty>
                                  {locale === "ar"
                                    ? "لا توجد مسميات مطابقة"
                                    : "No matching job titles"}
                                </CommandEmpty>
                                <CommandGroup>
                                  {jobTitles.map((jobTitle) => (
                                    <CommandItem
                                      key={jobTitle.id}
                                      value={`${jobTitle.nameAr || ""} ${jobTitle.name} ${jobTitle.code || ""}`}
                                      onSelect={() => {
                                        field.onChange(jobTitle.id);
                                        setJobTitlePickerOpen(false);
                                      }}>
                                      <Check
                                        className={cn(
                                          "h-4 w-4",
                                          jobTitle.id === field.value ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex min-w-0 flex-col">
                                        <span className="truncate">{jobTitle.nameAr || jobTitle.name}</span>
                                        {jobTitle.nameAr && jobTitle.nameAr !== jobTitle.name ? (
                                          <span className="text-muted-foreground truncate text-xs">
                                            {jobTitle.name}
                                          </span>
                                        ) : null}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <p className="text-muted-foreground text-xs">
                          {locale === "ar"
                            ? "المسميات تُدار مركزيًا من المنصة وتظهر هنا تلقائيًا لكل شركة."
                            : "Job titles are managed centrally by the platform and appear here automatically."}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="hireDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.employeeForm.hireDateLabel}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contractType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.employeeForm.contractType}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t.employeeForm.selectContractType} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contractTypes.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.common.status}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t.employeeForm.selectStatus} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="salary" className="mt-4 space-y-4">
                <FormField
                  control={form.control}
                  name="overtimeEligible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4">
                      <div className="space-y-1">
                        <FormLabel>
                          {locale === "ar"
                            ? "مؤهل لحساب الأوفر تايم"
                            : "Eligible for overtime calculation"}
                        </FormLabel>
                        <p className="text-muted-foreground text-sm">
                          {locale === "ar"
                            ? "لن يدخل هذا الموظف في الحساب التلقائي إلا إذا كان هذا الخيار مفعلاً مع سياسة الحضور وتفعيل الأوفر تايم في الوردية."
                            : "This employee is included in automatic overtime only when attendance policy and shift overtime are enabled."}
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="basicSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.employeeForm.baseSalary}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="10000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className="text-muted-foreground text-sm">{t.employees.salaryNote}</p>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}>
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t.common.saving : editingEmployee ? t.common.saveChanges : t.common.add}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
