"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  IconPencil,
  IconPlus,
  IconTrash,
  IconBuilding,
  IconMapPin,
  IconRefresh
} from "@tabler/icons-react";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

// Types
interface OrganizationProfile {
  id: string;
  tenantId: string;
  name: string;
  nameAr?: string | null;
  commercialRegister?: string | null;
  taxNumber?: string | null;
  address?: string | null;
  city?: string | null;
  country: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  logo?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Branch {
  id: string;
  tenantId: string;
  name: string;
  nameAr?: string | null;
  code?: string | null;
  address?: string | null;
  city?: string | null;
  country: string;
  phone?: string | null;
  email?: string | null;
  isHeadquarters: boolean;
  isActive: boolean;
  employeesCount: number;
  createdAt: string;
  updatedAt: string;
}

// Validation
const companySchema = z.object({
  name: z.string().min(2, t.organization.companyNameRequired),
  nameAr: z.string().optional(),
  commercialRegister: z.string().optional(),
  taxNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().min(1, t.common.countryRequired),
  phone: z.string().optional(),
  email: z.string().email(t.organization.emailInvalid).optional().or(z.literal("")),
  website: z.string().optional()
});

const branchSchema = z.object({
  name: z.string().min(2, t.organization.branchNameRequired),
  nameAr: z.string().optional(),
  code: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().min(1, t.common.countryRequired),
  phone: z.string().optional(),
  email: z.string().email(t.organization.emailInvalid).optional().or(z.literal("")),
  isHeadquarters: z.boolean().optional(),
  isActive: z.boolean().optional()
});

type CompanyFormData = z.infer<typeof companySchema>;
type BranchFormData = z.infer<typeof branchSchema>;

export function OrganizationManager() {
  const locale = useClientLocale();
  const t = getText(locale);
  // State
  const [company, setCompany] = useState<OrganizationProfile | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [stats, setStats] = useState({
    branchesCount: 0,
    employeesCount: 0,
    cities: [] as string[]
  });

  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      nameAr: "",
      commercialRegister: "",
      taxNumber: "",
      address: "",
      city: "",
      country: "SA",
      phone: "",
      email: "",
      website: ""
    }
  });

  const branchForm = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: "",
      nameAr: "",
      code: "",
      address: "",
      city: "",
      country: "SA",
      phone: "",
      email: "",
      isHeadquarters: false,
      isActive: true
    }
  });

  // Fetch organization data
  const fetchOrganization = useCallback(async () => {
    try {
      const res = await fetch("/api/organization");
      if (!res.ok) throw new Error("Failed to fetch organization");
      const data = await res.json();

      if (data.profile) {
        setCompany(data.profile);
        companyForm.reset({
          name: data.profile.name || "",
          nameAr: data.profile.nameAr || "",
          commercialRegister: data.profile.commercialRegister || "",
          taxNumber: data.profile.taxNumber || "",
          address: data.profile.address || "",
          city: data.profile.city || "",
          country: data.profile.country || "SA",
          phone: data.profile.phone || "",
          email: data.profile.email || "",
          website: data.profile.website || ""
        });
      }

      if (data.stats) {
        setStats((prev) => ({
          ...prev,
          branchesCount: data.stats.branchesCount,
          employeesCount: data.stats.employeesCount
        }));
      }
    } catch (error) {
      console.error("Error fetching organization:", error);
      toast.error(t.organization.fetchCompanyError);
    }
  }, [companyForm, t.organization.fetchCompanyError]);

  // Fetch branches
  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch("/api/organization/branches");
      if (!res.ok) throw new Error("Failed to fetch branches");
      const data = await res.json();

      setBranches(data.branches || []);
      if (data.stats) {
        setStats((prev) => ({
          ...prev,
          cities: data.stats.cities || []
        }));
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      toast.error(t.organization.fetchBranchesError);
    }
  }, [t.organization.fetchBranchesError]);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchOrganization(), fetchBranches()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchOrganization, fetchBranches]);

  // Company form submit
  const onCompanySubmit = async (data: CompanyFormData) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || t.organization.genericError);
      }

      const result = await res.json();
      setCompany(result.profile);
      setIsEditingCompany(false);
      toast.success(t.organization.companyUpdated);
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error(error instanceof Error ? error.message : t.organization.updateFailed);
    } finally {
      setIsSaving(false);
    }
  };

  // Branch handlers
  const handleAddBranch = () => {
    setEditingBranch(null);
    branchForm.reset({
      name: "",
      nameAr: "",
      code: "",
      address: "",
      city: "",
      country: "SA",
      phone: "",
      email: "",
      isHeadquarters: false,
      isActive: true
    });
    setBranchDialogOpen(true);
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    branchForm.reset({
      name: branch.name,
      nameAr: branch.nameAr || "",
      code: branch.code || "",
      address: branch.address || "",
      city: branch.city || "",
      country: branch.country,
      phone: branch.phone || "",
      email: branch.email || "",
      isHeadquarters: branch.isHeadquarters,
      isActive: branch.isActive
    });
    setBranchDialogOpen(true);
  };

  const onBranchSubmit = async (data: BranchFormData) => {
    setIsSaving(true);
    try {
      const url = editingBranch
        ? `/api/organization/branches/${editingBranch.id}`
        : "/api/organization/branches";

      const res = await fetch(url, {
        method: editingBranch ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || t.organization.genericError);
      }

      await fetchBranches();
      setBranchDialogOpen(false);
      branchForm.reset();
      toast.success(editingBranch ? t.organization.branchUpdated : t.organization.branchAdded);
    } catch (error) {
      console.error("Error saving branch:", error);
      toast.error(error instanceof Error ? error.message : t.organization.genericError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBranch = (branch: Branch) => {
    setBranchToDelete(branch);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteBranch = async () => {
    if (!branchToDelete) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/organization/branches/${branchToDelete.id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || t.organization.genericError);
      }

      await fetchBranches();
      setDeleteDialogOpen(false);
      setBranchToDelete(null);
      toast.success(t.organization.branchDeleted);
    } catch (error) {
      console.error("Error deleting branch:", error);
      toast.error(error instanceof Error ? error.message : t.onboarding.deleteFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const totalEmployees = branches.reduce((sum, b) => sum + b.employeesCount, 0);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
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
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.organization.totalBranches}</CardDescription>
            <CardTitle className="text-3xl">{branches.length}</CardTitle>
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
            <CardDescription>{t.organization.cities}</CardDescription>
            <CardTitle className="text-3xl">
              {new Set(branches.map((b) => b.city).filter(Boolean)).size}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList>
          <TabsTrigger value="company">{t.organization.companySection}</TabsTrigger>
          <TabsTrigger value="branches">{t.organization.branches}</TabsTrigger>
        </TabsList>

        {/* Company Tab */}
        <TabsContent value="company" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 flex size-12 items-center justify-center rounded-lg">
                    <IconBuilding className="text-primary size-6" />
                  </div>
                  <div>
                    <CardTitle>{company?.nameAr || company?.name || t.common.company}</CardTitle>
                    <CardDescription>{company?.name || ""}</CardDescription>
                  </div>
                </div>
                <Button
                  variant={isEditingCompany ? "outline" : "default"}
                  onClick={() => {
                    if (isEditingCompany && company) {
                      companyForm.reset({
                        name: company.name,
                        nameAr: company.nameAr || "",
                        commercialRegister: company.commercialRegister || "",
                        taxNumber: company.taxNumber || "",
                        address: company.address || "",
                        city: company.city || "",
                        country: company.country,
                        phone: company.phone || "",
                        email: company.email || "",
                        website: company.website || ""
                      });
                    }
                    setIsEditingCompany(!isEditingCompany);
                  }}>
                  {isEditingCompany ? t.common.cancel : t.common.edit}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isEditingCompany ? (
                <Form {...companyForm}>
                  <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={companyForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.organization.companyNameEn}</FormLabel>
                            <FormControl>
                              <Input placeholder="Company Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={companyForm.control}
                        name="nameAr"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.organization.companyName}</FormLabel>
                            <FormControl>
                              <Input placeholder={t.organization.companyName} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={companyForm.control}
                        name="commercialRegister"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.organization.commercialReg}</FormLabel>
                            <FormControl>
                              <Input placeholder="1010123456" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={companyForm.control}
                        name="taxNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.organization.taxNumber}</FormLabel>
                            <FormControl>
                              <Input placeholder="300123456700003" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={companyForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.common.title}</FormLabel>
                            <FormControl>
                              <Input placeholder={t.organization.detailedAddress} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={companyForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.common.city}</FormLabel>
                            <FormControl>
                              <Input placeholder={t.jobPostings.riyadh} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={companyForm.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.common.country}</FormLabel>
                            <FormControl>
                              <Input placeholder="SA" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={companyForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.common.phone}</FormLabel>
                            <FormControl>
                              <Input placeholder="+966112345678" {...field} dir="ltr" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={companyForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.common.email}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="info@company.com"
                                type="email"
                                {...field}
                                dir="ltr"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={companyForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.organization.website}</FormLabel>
                            <FormControl>
                              <Input placeholder="https://company.com" {...field} dir="ltr" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? t.common.saving : t.common.saveChanges}
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-sm">{t.organization.commercialReg}</p>
                    <p className="font-medium">{company?.commercialRegister || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-sm">{t.organization.taxNumber}</p>
                    <p className="font-medium">{company?.taxNumber || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-sm">{t.common.title}</p>
                    <p className="font-medium">{company?.address || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-sm">{t.common.city}</p>
                    <p className="font-medium">{company?.city || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-sm">{t.common.phone}</p>
                    <p className="font-medium" dir="ltr">
                      {company?.phone || "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-sm">{t.common.email}</p>
                    <p className="font-medium" dir="ltr">
                      {company?.email || "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-sm">{t.organization.website}</p>
                    <p className="font-medium" dir="ltr">
                      {company?.website || "-"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branches Tab */}
        <TabsContent value="branches" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
                    <IconMapPin className="text-primary size-5" />
                  </div>
                  <div>
                    <CardTitle>{t.organization.branches}</CardTitle>
                    <CardDescription>{t.organization.manageBranches}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={t.common.refresh}
                    onClick={() => fetchBranches()}>
                    <IconRefresh className="size-4" />
                  </Button>
                  <Button onClick={handleAddBranch}>
                    <IconPlus className="ms-2 size-4" />
                    {t.organization.pAddBranch}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {branches.length === 0 ? (
                <div className="py-12 text-center">
                  <IconMapPin className="text-muted-foreground/50 mx-auto mb-4 size-12" />
                  <p className="text-muted-foreground">{t.organization.noBranches}</p>
                  <Button variant="outline" className="mt-4" onClick={handleAddBranch}>
                    {t.organization.pAddNewBranch}
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.organization.branch}</TableHead>
                      <TableHead>{t.common.code}</TableHead>
                      <TableHead>{t.common.city}</TableHead>
                      <TableHead>{t.common.employees}</TableHead>
                      <TableHead>{t.common.status}</TableHead>
                      <TableHead className="text-start">{t.common.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branches.map((branch) => (
                      <TableRow key={branch.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{branch.nameAr || branch.name}</p>
                            {branch.nameAr && (
                              <p className="text-muted-foreground text-sm">{branch.name}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="bg-muted rounded px-1.5 py-0.5 text-sm">
                            {branch.code || "-"}
                          </code>
                        </TableCell>
                        <TableCell>{branch.city || "-"}</TableCell>
                        <TableCell>{branch.employeesCount}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {branch.isHeadquarters && (
                              <Badge variant="default">{t.organization.hq}</Badge>
                            )}
                            <Badge variant={branch.isActive ? "secondary" : "outline"}>
                              {branch.isActive ? t.common.active : t.common.inactive}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t.common.edit}
                              onClick={() => handleEditBranch(branch)}>
                              <IconPencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t.common.delete}
                              onClick={() => handleDeleteBranch(branch)}
                              disabled={branch.isHeadquarters || branch.employeesCount > 0}>
                              <IconTrash className="text-destructive size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Branch Dialog */}
      <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
        <DialogContent className="w-full sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingBranch ? t.organization.editBranch : t.organization.addNewBranch}
            </DialogTitle>
            <DialogDescription>
              {editingBranch ? t.organization.editBranch : t.organization.addBranchDesc}
            </DialogDescription>
          </DialogHeader>
          <Form {...branchForm}>
            <form onSubmit={branchForm.handleSubmit(onBranchSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={branchForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.organization.branchNameEn}</FormLabel>
                      <FormControl>
                        <Input placeholder="Branch Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={branchForm.control}
                  name="nameAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.organization.branchNameAr}</FormLabel>
                      <FormControl>
                        <Input placeholder={t.organization.branchNamePlaceholder} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={branchForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.organization.branchCode}</FormLabel>
                      <FormControl>
                        <Input placeholder="JED" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={branchForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.common.city}</FormLabel>
                      <FormControl>
                        <Input placeholder={t.organization.jeddah} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={branchForm.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.common.country}</FormLabel>
                      <FormControl>
                        <Input placeholder="SA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={branchForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.common.title}</FormLabel>
                      <FormControl>
                        <Input placeholder={t.organization.detailedAddress} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={branchForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.common.phone}</FormLabel>
                      <FormControl>
                        <Input placeholder="+966122345678" {...field} dir="ltr" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={branchForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.common.email}</FormLabel>
                      <FormControl>
                        <Input placeholder="branch@company.com" type="email" {...field} dir="ltr" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center gap-6">
                <FormField
                  control={branchForm.control}
                  name="isHeadquarters"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <Label>{t.organization.hq}</Label>
                    </FormItem>
                  )}
                />
                <FormField
                  control={branchForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <Label>{t.common.active}</Label>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setBranchDialogOpen(false)}>
                  {t.common.cancel}
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? t.common.saving : editingBranch ? t.common.update : t.common.add}
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
            <AlertDialogTitle>{t.organization.deleteBranch}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.organization.pAreYouSureYouWantToDeleteTheBr} &quot;
              {branchToDelete?.nameAr || branchToDelete?.name}&quot;?
              <br />
              {t.common.cannotUndo}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteBranch}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isSaving ? t.common.deleting : t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
