"use client";

import { useCallback, useEffect, useState } from "react";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconBeach,
  IconFirstAidKit,
  IconBabyCarriage,
  IconHeart,
  IconMoodSad,
  IconBuildingChurch,
  IconBook,
  IconAlertTriangle,
  IconCalendarTime,
  IconDots,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LeaveType,
  LeaveCategory,
  AccrualType,
  leaveCategoryLabels,
  accrualTypeLabels,
  leaveTypeColors,
} from "@/lib/types/leave";
import { toast } from "sonner";
import { leavesApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { getLeaveTheme } from "@/lib/ui/leave-color";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

function mapApplicableGendersToRestriction(value: unknown): LeaveType["genderRestriction"] {
  if (!Array.isArray(value) || value.length === 0) return "all";
  const genders = value.map(String);
  const hasMale = genders.includes("MALE");
  const hasFemale = genders.includes("FEMALE");
  if (hasMale && !hasFemale) return "male";
  if (!hasMale && hasFemale) return "female";
  return "all";
}

function mapRestrictionToApplicableGenders(value: LeaveType["genderRestriction"] | undefined): Array<"MALE" | "FEMALE"> {
  if (value === "male") return ["MALE"];
  if (value === "female") return ["FEMALE"];
  return [];
}

function toCode(value: string): string {
  const raw = value.trim();
  const normalized = raw
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
  return normalized || `LT_${Date.now()}`;
}

function toIso(value: any): string {
  if (!value) return new Date().toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function mapLeaveTypeFromApi(t: any): LeaveType {
  const maxDays = t.maxDays != null ? Number(t.maxDays) : null;
  const defaultDays = t.defaultDays != null ? Number(t.defaultDays) : 0;
  const carryOverDays = t.carryOverDays != null ? Number(t.carryOverDays) : 0;

  const annualMax = Number.isFinite(maxDays as any) && maxDays != null ? maxDays : defaultDays || 30;
  const accrualType: AccrualType = defaultDays > 0 ? "yearly" : "none";

  return {
    id: String(t.id),
    tenantId: String(t.tenantId ?? ""),
    name: String(t.nameAr ?? t.name ?? ""),
    nameEn: String(t.name ?? ""),
    category: "other",
    description: t.description ?? undefined,
    color: String(t.color ?? leaveTypeColors.other),

    maxDaysPerYear: annualMax,
    minDaysPerRequest: 1,
    maxDaysPerRequest: annualMax,
    requiresAttachment: Boolean(t.requiresAttachment),
    allowHalfDay: true,
    isPaid: Boolean(t.isPaid),
    affectsSalary: false,
    salaryPercentage: Boolean(t.isPaid) ? 100 : 0,

    accrualType,
    accrualRate: accrualType === "none" ? 0 : Math.round((defaultDays / 12) * 10) / 10,
    carryOverAllowed: carryOverDays > 0,
    maxCarryOverDays: carryOverDays,

    minServiceMonths: t.minServiceMonths != null ? Number(t.minServiceMonths) : 0,
    genderRestriction: mapApplicableGendersToRestriction(t.applicableGenders),

    isActive: Boolean(t.isActive),
    isDefault: false,
    createdAt: toIso(t.createdAt),
    updatedAt: toIso(t.updatedAt),
  };
}

// أيقونات أنواع الإجازات
const categoryIcons: Record<LeaveCategory, React.ReactNode> = {
  annual: <IconBeach className="h-5 w-5" />,
  sick: <IconFirstAidKit className="h-5 w-5" />,
  unpaid: <IconCalendarTime className="h-5 w-5" />,
  maternity: <IconBabyCarriage className="h-5 w-5" />,
  paternity: <IconBabyCarriage className="h-5 w-5" />,
  marriage: <IconHeart className="h-5 w-5" />,
  bereavement: <IconMoodSad className="h-5 w-5" />,
  hajj: <IconBuildingChurch className="h-5 w-5" />,
  study: <IconBook className="h-5 w-5" />,
  emergency: <IconAlertTriangle className="h-5 w-5" />,
  compensatory: <IconCalendarTime className="h-5 w-5" />,
  other: <IconDots className="h-5 w-5" />,
};

export function LeaveTypesManager() {
  const locale = useClientLocale();
  const t = getText(locale);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<LeaveType | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<{ name?: string; nameEn?: string; maxDaysPerYear?: string }>({});

  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};
    if (!formData.name?.trim()) errors.name = t.leaveTypes.nameArRequired;
    if (!formData.nameEn?.trim()) errors.nameEn = t.leaveTypes.nameEnRequired;
    if (!formData.maxDaysPerYear || Number(formData.maxDaysPerYear) < 1)
      errors.maxDaysPerYear = t.leaveTypes.minOneDay;
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form state
  const [formData, setFormData] = useState<Partial<LeaveType>>({
    name: "",
    nameEn: "",
    category: "annual",
    description: "",
    color: leaveTypeColors.annual,
    maxDaysPerYear: 30,
    minDaysPerRequest: 1,
    maxDaysPerRequest: 21,
    requiresAttachment: false,
    allowHalfDay: true,
    isPaid: true,
    affectsSalary: false,
    salaryPercentage: 100,
    accrualType: "monthly",
    accrualRate: 2.5,
    carryOverAllowed: true,
    maxCarryOverDays: 15,
    minServiceMonths: 0,
    genderRestriction: "all",
    isActive: true,
  });

  const resetForm = () => {
    setFormErrors({});
    setFormData({
      name: "",
      nameEn: "",
      category: "annual",
      description: "",
      color: leaveTypeColors.annual,
      maxDaysPerYear: 30,
      minDaysPerRequest: 1,
      maxDaysPerRequest: 21,
      requiresAttachment: false,
      allowHalfDay: true,
      isPaid: true,
      affectsSalary: false,
      salaryPercentage: 100,
      accrualType: "monthly",
      accrualRate: 2.5,
      carryOverAllowed: true,
      maxCarryOverDays: 15,
      minServiceMonths: 0,
      genderRestriction: "all",
      isActive: true,
    });
  };

  const loadLeaveTypes = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const res = await leavesApi.types.getAll();
      if (!res.success) {
        throw new Error(res.error || t.leaveTypes.loadFailed);
      }

      const mapped = Array.isArray(res.data) ? (res.data as any[]).map(mapLeaveTypeFromApi) : [];
      setLeaveTypes(mapped);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : t.leaveTypes.loadFailed);
    } finally {
      setIsLoading(false);
    }
  }, [t.leaveTypes.loadFailed]);

  useEffect(() => {
    void loadLeaveTypes();
  }, [loadLeaveTypes]);

  const handleAdd = async () => {
    if (!validateForm()) return;

    const englishName = formData.nameEn?.trim();
    const arabicName = formData.name?.trim();
    if (!englishName || !arabicName) return;

    setIsSaving(true);
    try {
      const res = await leavesApi.types.createBackend({
        name: englishName,
        nameAr: arabicName,
        code: toCode(englishName),
        description: formData.description || undefined,
        defaultDays: Number(formData.maxDaysPerYear ?? 0),
        maxDays: Number(formData.maxDaysPerYear ?? 0),
        carryOverDays: formData.carryOverAllowed ? Number(formData.maxCarryOverDays ?? 0) : 0,
        isPaid: Boolean(formData.isPaid),
        requiresApproval: true,
        requiresAttachment: Boolean(formData.requiresAttachment),
        minServiceMonths: Number(formData.minServiceMonths ?? 0),
        applicableGenders: mapRestrictionToApplicableGenders(formData.genderRestriction),
        color: formData.color,
        isActive: Boolean(formData.isActive),
      });

      if (!res.success) {
        throw new Error(res.error || t.leaveTypes.createFailed);
      }

      toast.success(t.leaveTypes.createdSuccess);
      setIsAddDialogOpen(false);
      resetForm();
      await loadLeaveTypes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.leaveTypes.createFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedType) return;
    if (!validateForm()) return;

    const englishName = formData.nameEn?.trim();
    const arabicName = formData.name?.trim();
    if (!englishName || !arabicName) return;

    setIsSaving(true);
    try {
      const res = await leavesApi.types.updateBackend(selectedType.id, {
        name: englishName,
        nameAr: arabicName,
        code: toCode(englishName),
        description: formData.description || undefined,
        defaultDays: Number(formData.maxDaysPerYear ?? 0),
        maxDays: Number(formData.maxDaysPerYear ?? 0),
        carryOverDays: formData.carryOverAllowed ? Number(formData.maxCarryOverDays ?? 0) : 0,
        isPaid: Boolean(formData.isPaid),
        requiresApproval: true,
        requiresAttachment: Boolean(formData.requiresAttachment),
        minServiceMonths: Number(formData.minServiceMonths ?? 0),
        applicableGenders: mapRestrictionToApplicableGenders(formData.genderRestriction),
        color: formData.color,
        isActive: Boolean(formData.isActive),
      });

      if (!res.success) {
        throw new Error(res.error || t.leaveTypes.updateFailed);
      }

      toast.success(t.leaveTypes.updatedSuccess);
      setIsEditDialogOpen(false);
      setSelectedType(null);
      resetForm();
      await loadLeaveTypes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.leaveTypes.updateFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSaving(true);
    try {
      const res = await leavesApi.types.delete(id);
      if (!res.success) {
        throw new Error(res.error || t.leaveTypes.deleteFailed);
      }
      toast.success(t.leaveTypes.deletedSuccess);
      await loadLeaveTypes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.leaveTypes.deleteFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    const type = leaveTypes.find((t) => t.id === id);
    if (!type) return;

    setIsSaving(true);
    try {
      const res = await leavesApi.types.updateBackend(id, {
        name: type.nameEn,
        nameAr: type.name,
        code: toCode(type.nameEn),
        description: type.description,
        defaultDays: Number(type.maxDaysPerYear ?? 0),
        maxDays: Number(type.maxDaysPerYear ?? 0),
        carryOverDays: type.carryOverAllowed ? Number(type.maxCarryOverDays ?? 0) : 0,
        isPaid: Boolean(type.isPaid),
        requiresApproval: true,
        requiresAttachment: Boolean(type.requiresAttachment),
        minServiceMonths: Number(type.minServiceMonths ?? 0),
        applicableGenders: mapRestrictionToApplicableGenders(type.genderRestriction),
        color: type.color,
        isActive: !type.isActive,
      });
      if (!res.success) {
        throw new Error(res.error || t.leaveTypes.statusUpdateFailed);
      }
      await loadLeaveTypes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.leaveTypes.statusUpdateFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const openEditDialog = (type: LeaveType) => {
    setSelectedType(type);
    setFormData(type);
    setIsEditDialogOpen(true);
  };

  const filteredTypes = activeTab === "all"
    ? leaveTypes
    : activeTab === "active"
    ? leaveTypes.filter((t) => t.isActive)
    : leaveTypes.filter((t) => !t.isActive);

  // Stats
  const stats = {
    total: leaveTypes.length,
    active: leaveTypes.filter((t) => t.isActive).length,
    paid: leaveTypes.filter((t) => t.isPaid).length,
    withAccrual: leaveTypes.filter((t) => t.accrualType !== "none").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t.leaveTypes.title}</h2>
          <p className="text-muted-foreground">{t.leaveTypes.subtitle}</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <IconPlus className="ms-2 h-4 w-4" />
          {t.leaveTypes.pAddLeaveType}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.leaveTypes.totalTypes}</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.leaveTypes.activeTypes}</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.leaveTypes.paidLeaves}</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.paid}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.leaveTypes.periodicAccrual}</CardDescription>
            <CardTitle className="text-3xl text-purple-600">{stats.withAccrual}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs and Table */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">{t.leaveTypes.all} ({leaveTypes.length})</TabsTrigger>
              <TabsTrigger value="active">
                {t.leaveTypes.activeTab} ({leaveTypes.filter((lt) => lt.isActive).length})
              </TabsTrigger>
              <TabsTrigger value="inactive">
                {t.leaveTypes.inactiveTab} ({leaveTypes.filter((lt) => !lt.isActive).length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loadError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {loadError}
            </div>
          )}

          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">{t.common.loading}</div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.common.type}</TableHead>
                <TableHead>{t.common.category}</TableHead>
                <TableHead>{t.leaveTypes.allowedDays}</TableHead>
                <TableHead>{t.leaveTypes.accrual}</TableHead>
                <TableHead>{t.leaveTypes.salary}</TableHead>
                <TableHead>{t.common.status}</TableHead>
                <TableHead className="w-[100px]">{t.common.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTypes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    {t.leaveTypes.pNoMatchingLeaveTypesFound}
                  </TableCell>
                </TableRow>
              )}
              {filteredTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg text-white",
                          getLeaveTheme(type.color).bg
                        )}
                      >
                        {categoryIcons[type.category]}
                      </div>
                      <div>
                        <div className="font-medium">{type.name}</div>
                        <div className="text-sm text-muted-foreground">{type.nameEn}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{leaveCategoryLabels[type.category]}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{type.maxDaysPerYear} {t.leaveTypes.daysPerYear}</div>
                      <div className="text-muted-foreground">
                        {type.minDaysPerRequest}-{type.maxDaysPerRequest} {t.leaveTypes.daysPerRequest}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {type.accrualType === "none" ? (
                        <span className="text-muted-foreground">{t.leaveTypes.noAccrual}</span>
                      ) : (
                        <>
                          <div>{type.accrualRate} {t.leaveTypes.pDay}/{accrualTypeLabels[type.accrualType]}</div>
                          {type.carryOverAllowed && (
                            <div className="text-muted-foreground">
                              {t.leaveTypes.pCarryOver} {type.maxCarryOverDays} {t.leaveTypes.pDay}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {type.isPaid ? (
                      <Badge className="bg-green-100 text-green-800">
                        {type.salaryPercentage}%
                      </Badge>
                    ) : (
                      <Badge variant="secondary">{t.leaveTypes.unpaid}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={type.isActive}
                      onCheckedChange={() => handleToggleActive(type.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={t.common.options}>
                          <IconDots className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(type)}>
                          <IconEdit className="ms-2 h-4 w-4" />{t.common.edit}</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(type.id)}
                          disabled={type.isDefault}
                        >
                          <IconTrash className="ms-2 h-4 w-4" />{t.common.delete}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            setSelectedType(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? t.leaveTypes.editType : t.leaveTypes.addNewType}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? t.leaveTypes.editSettings
                : t.leaveTypes.createNewType}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="font-medium">{t.leaveTypes.basicInfo}</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t.leaveTypes.nameArRequired}</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formErrors.name) setFormErrors((p) => ({ ...p, name: undefined }));
                    }}
                    placeholder={t.leaveTypes.annualLeaveExample}
                    className={formErrors.name ? "border-destructive" : ""}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-destructive">{formErrors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t.leaveTypes.nameEnRequired}</Label>
                  <Input
                    value={formData.nameEn}
                    onChange={(e) => {
                      setFormData({ ...formData, nameEn: e.target.value });
                      if (formErrors.nameEn) setFormErrors((p) => ({ ...p, nameEn: undefined }));
                    }}
                    placeholder="Annual Leave"
                    dir="ltr"
                    className={formErrors.nameEn ? "border-destructive" : ""}
                  />
                  {formErrors.nameEn && (
                    <p className="text-xs text-destructive">{formErrors.nameEn}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t.leaveTypes.categoryRequired}</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: LeaveCategory) => {
                      setFormData({
                        ...formData,
                        category: value,
                        color: leaveTypeColors[value],
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(leaveCategoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "h-3 w-3 rounded-full",
                                getLeaveTheme(leaveTypeColors[key as LeaveCategory]).dot
                              )}
                            />
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t.leaveTypes.highlightColor}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="h-10 w-20 p-1"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      dir="ltr"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.common.description}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t.leaveTypes.leaveTypeDesc}
                  rows={2}
                />
              </div>
            </div>

            {/* Days Settings */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">{t.leaveTypes.daysSettings}</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>{t.leaveTypes.maxPerYear}</Label>
                  <Input
                    type="number"
                    value={formData.maxDaysPerYear}
                    onChange={(e) => {
                      setFormData({ ...formData, maxDaysPerYear: Number(e.target.value) });
                      if (formErrors.maxDaysPerYear) setFormErrors((p) => ({ ...p, maxDaysPerYear: undefined }));
                    }}
                    min={1}
                    className={formErrors.maxDaysPerYear ? "border-destructive" : ""}
                  />
                  {formErrors.maxDaysPerYear && (
                    <p className="text-xs text-destructive">{formErrors.maxDaysPerYear}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t.leaveTypes.minPerRequest}</Label>
                  <Input
                    type="number"
                    value={formData.minDaysPerRequest}
                    onChange={(e) =>
                      setFormData({ ...formData, minDaysPerRequest: Number(e.target.value) })
                    }
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.leaveTypes.maxPerRequest}</Label>
                  <Input
                    type="number"
                    value={formData.maxDaysPerRequest}
                    onChange={(e) =>
                      setFormData({ ...formData, maxDaysPerRequest: Number(e.target.value) })
                    }
                    min={1}
                  />
                </div>
              </div>
            </div>

            {/* Accrual Settings */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">{t.leaveTypes.accrualSettings}</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t.leaveTypes.accrualType}</Label>
                  <Select
                    value={formData.accrualType}
                    onValueChange={(value: AccrualType) =>
                      setFormData({ ...formData, accrualType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(accrualTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.accrualType !== "none" && (
                  <div className="space-y-2">
                    <Label>{t.leaveTypes.accrualRate}</Label>
                    <Input
                      type="number"
                      value={formData.accrualRate}
                      onChange={(e) =>
                        setFormData({ ...formData, accrualRate: Number(e.target.value) })
                      }
                      step={0.5}
                      min={0}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.carryOverAllowed}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, carryOverAllowed: checked })
                    }
                  />
                  <Label>{t.leaveTypes.allowCarryOver}</Label>
                </div>
                {formData.carryOverAllowed && (
                  <div className="flex items-center gap-2">
                    <Label>{t.leaveTypes.maxCarryOver}</Label>
                    <Input
                      type="number"
                      value={formData.maxCarryOverDays}
                      onChange={(e) =>
                        setFormData({ ...formData, maxCarryOverDays: Number(e.target.value) })
                      }
                      className="w-20"
                      min={0}
                    />
                    <span className="text-sm text-muted-foreground">{t.attendance.day}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Salary Settings */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">{t.leaveTypes.salarySettings}</h4>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isPaid}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        isPaid: checked,
                        salaryPercentage: checked ? 100 : 0,
                      })
                    }
                  />
                  <Label>{t.leaveTypes.paidLeave}</Label>
                </div>
                {formData.isPaid && (
                  <div className="flex items-center gap-2">
                    <Label>{t.leaveTypes.salaryPercentage}</Label>
                    <Input
                      type="number"
                      value={formData.salaryPercentage}
                      onChange={(e) =>
                        setFormData({ ...formData, salaryPercentage: Number(e.target.value) })
                      }
                      className="w-20"
                      min={0}
                      max={100}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Other Settings */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">{t.leaveTypes.otherSettings}</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t.leaveTypes.minServiceMonths}</Label>
                  <Input
                    type="number"
                    value={formData.minServiceMonths}
                    onChange={(e) =>
                      setFormData({ ...formData, minServiceMonths: Number(e.target.value) })
                    }
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.leaveTypes.genderRestrictions}</Label>
                  <Select
                    value={formData.genderRestriction}
                    onValueChange={(value: "all" | "male" | "female") =>
                      setFormData({ ...formData, genderRestriction: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.leaveTypes.everyone}</SelectItem>
                      <SelectItem value="male">{t.leaveTypes.malesOnly}</SelectItem>
                      <SelectItem value="female">{t.leaveTypes.femalesOnly}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.requiresAttachment}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, requiresAttachment: checked })
                    }
                  />
                  <Label>{t.leaveTypes.requiresAttachments}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.allowHalfDay}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, allowHalfDay: checked })
                    }
                  />
                  <Label>{t.leaveTypes.allowHalfDay}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label>{t.leaveTypes.activeType}</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setIsEditDialogOpen(false);
                setSelectedType(null);
                resetForm();
              }}
            >
              <IconX className="ms-2 h-4 w-4" />{t.common.cancel}</Button>
            <Button onClick={isEditDialogOpen ? handleEdit : handleAdd} disabled={isSaving}>
              <IconCheck className="ms-2 h-4 w-4" />
              {isEditDialogOpen ? t.common.saveChanges : t.common.add}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
