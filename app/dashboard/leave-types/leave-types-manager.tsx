"use client";

import { useEffect, useState } from "react";
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
    if (!formData.name?.trim()) errors.name = "الاسم بالعربية مطلوب";
    if (!formData.nameEn?.trim()) errors.nameEn = "الاسم بالإنجليزية مطلوب";
    if (!formData.maxDaysPerYear || Number(formData.maxDaysPerYear) < 1)
      errors.maxDaysPerYear = "يجب أن يكون الحد الأقصى يوماً واحداً على الأقل";
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

  const loadLeaveTypes = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const res = await leavesApi.types.getAll();
      if (!res.success) {
        throw new Error(res.error || "فشل تحميل أنواع الإجازات");
      }

      const mapped = Array.isArray(res.data) ? (res.data as any[]).map(mapLeaveTypeFromApi) : [];
      setLeaveTypes(mapped);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "فشل تحميل أنواع الإجازات");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadLeaveTypes();
  }, []);

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
        throw new Error(res.error || "فشل إنشاء نوع الإجازة");
      }

      toast.success("تم إنشاء نوع الإجازة");
      setIsAddDialogOpen(false);
      resetForm();
      await loadLeaveTypes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل إنشاء نوع الإجازة");
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
        throw new Error(res.error || "فشل تعديل نوع الإجازة");
      }

      toast.success("تم تعديل نوع الإجازة");
      setIsEditDialogOpen(false);
      setSelectedType(null);
      resetForm();
      await loadLeaveTypes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل تعديل نوع الإجازة");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSaving(true);
    try {
      const res = await leavesApi.types.delete(id);
      if (!res.success) {
        throw new Error(res.error || "فشل حذف نوع الإجازة");
      }
      toast.success("تم حذف نوع الإجازة");
      await loadLeaveTypes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل حذف نوع الإجازة");
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
        throw new Error(res.error || "فشل تحديث الحالة");
      }
      await loadLeaveTypes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل تحديث الحالة");
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
          <h2 className="text-2xl font-bold">أنواع الإجازات</h2>
          <p className="text-muted-foreground">إدارة وتكوين أنواع الإجازات المتاحة</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <IconPlus className="ms-2 h-4 w-4" />
          إضافة نوع إجازة
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>إجمالي الأنواع</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>أنواع نشطة</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>إجازات مدفوعة</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.paid}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>باستحقاق دوري</CardDescription>
            <CardTitle className="text-3xl text-purple-600">{stats.withAccrual}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs and Table */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">الكل ({leaveTypes.length})</TabsTrigger>
              <TabsTrigger value="active">
                نشط ({leaveTypes.filter((t) => t.isActive).length})
              </TabsTrigger>
              <TabsTrigger value="inactive">
                معطل ({leaveTypes.filter((t) => !t.isActive).length})
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
            <div className="py-10 text-center text-muted-foreground">جارٍ التحميل...</div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>النوع</TableHead>
                <TableHead>التصنيف</TableHead>
                <TableHead>الأيام المسموحة</TableHead>
                <TableHead>الاستحقاق</TableHead>
                <TableHead>الراتب</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-[100px]">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTypes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    لا توجد أنواع إجازات مطابقة
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
                      <div>{type.maxDaysPerYear} يوم/سنة</div>
                      <div className="text-muted-foreground">
                        {type.minDaysPerRequest}-{type.maxDaysPerRequest} يوم/طلب
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {type.accrualType === "none" ? (
                        <span className="text-muted-foreground">بدون استحقاق</span>
                      ) : (
                        <>
                          <div>{type.accrualRate} يوم/{accrualTypeLabels[type.accrualType]}</div>
                          {type.carryOverAllowed && (
                            <div className="text-muted-foreground">
                              ترحيل: {type.maxCarryOverDays} يوم
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
                      <Badge variant="secondary">بدون راتب</Badge>
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
                        <Button variant="ghost" size="icon" aria-label="خيارات">
                          <IconDots className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(type)}>
                          <IconEdit className="ms-2 h-4 w-4" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(type.id)}
                          disabled={type.isDefault}
                        >
                          <IconTrash className="ms-2 h-4 w-4" />
                          حذف
                        </DropdownMenuItem>
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
              {isEditDialogOpen ? "تعديل نوع الإجازة" : "إضافة نوع إجازة جديد"}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? "تعديل إعدادات نوع الإجازة"
                : "إنشاء نوع إجازة جديد مع تحديد الإعدادات"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="font-medium">المعلومات الأساسية</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>الاسم بالعربية *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formErrors.name) setFormErrors((p) => ({ ...p, name: undefined }));
                    }}
                    placeholder="إجازة سنوية"
                    className={formErrors.name ? "border-destructive" : ""}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-destructive">{formErrors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>الاسم بالإنجليزية *</Label>
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
                  <Label>التصنيف *</Label>
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
                  <Label>لون التمييز</Label>
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
                <Label>الوصف</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف نوع الإجازة..."
                  rows={2}
                />
              </div>
            </div>

            {/* Days Settings */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">إعدادات الأيام</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>الحد الأقصى سنوياً *</Label>
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
                  <Label>الحد الأدنى للطلب</Label>
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
                  <Label>الحد الأقصى للطلب</Label>
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
              <h4 className="font-medium">إعدادات الاستحقاق</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>نوع الاستحقاق</Label>
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
                    <Label>معدل الاستحقاق (يوم)</Label>
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
                  <Label>السماح بترحيل الرصيد</Label>
                </div>
                {formData.carryOverAllowed && (
                  <div className="flex items-center gap-2">
                    <Label>الحد الأقصى للترحيل:</Label>
                    <Input
                      type="number"
                      value={formData.maxCarryOverDays}
                      onChange={(e) =>
                        setFormData({ ...formData, maxCarryOverDays: Number(e.target.value) })
                      }
                      className="w-20"
                      min={0}
                    />
                    <span className="text-sm text-muted-foreground">يوم</span>
                  </div>
                )}
              </div>
            </div>

            {/* Salary Settings */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">إعدادات الراتب</h4>
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
                  <Label>إجازة مدفوعة</Label>
                </div>
                {formData.isPaid && (
                  <div className="flex items-center gap-2">
                    <Label>نسبة الراتب:</Label>
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
              <h4 className="font-medium">إعدادات أخرى</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>الحد الأدنى لأشهر الخدمة</Label>
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
                  <Label>قيود الجنس</Label>
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
                      <SelectItem value="all">الجميع</SelectItem>
                      <SelectItem value="male">ذكور فقط</SelectItem>
                      <SelectItem value="female">إناث فقط</SelectItem>
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
                  <Label>يتطلب مرفقات</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.allowHalfDay}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, allowHalfDay: checked })
                    }
                  />
                  <Label>السماح بنصف يوم</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label>نوع نشط</Label>
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
              <IconX className="ms-2 h-4 w-4" />
              إلغاء
            </Button>
            <Button onClick={isEditDialogOpen ? handleEdit : handleAdd} disabled={isSaving}>
              <IconCheck className="ms-2 h-4 w-4" />
              {isEditDialogOpen ? "حفظ التعديلات" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
