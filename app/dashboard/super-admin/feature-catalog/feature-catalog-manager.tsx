"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type Locale = "ar" | "en";

type FeatureCatalogRow = {
  id: string;
  featureId: string;
  family: string;
  nameAr: string;
  nameEn: string;
  summaryAr: string;
  summaryEn: string;
  status: string;
  commercialTier: string;
  availability: string[];
  evidencePaths: string[];
  owner: string;
  sortOrder: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

const FAMILY_OPTIONS = [
  "core-hr",
  "attendance",
  "payroll-compliance",
  "mobile",
  "recruitment",
  "performance",
  "learning",
  "analytics",
  "integrations",
  "automation",
  "platform"
] as const;

const STATUS_OPTIONS = ["live", "beta", "gated", "planned"] as const;
const TIER_OPTIONS = ["core", "advanced", "differentiator", "add-on"] as const;
const PLAN_OPTIONS = ["starter", "business", "enterprise", "add-on"] as const;

type EditableFeature = Omit<FeatureCatalogRow, "createdAt" | "updatedAt" | "isDefault"> & {
  evidencePathsText: string;
};

const DEFAULT_EDITABLE_FEATURE: EditableFeature = {
  id: "",
  featureId: "",
  family: "core-hr",
  nameAr: "",
  nameEn: "",
  summaryAr: "",
  summaryEn: "",
  status: "live",
  commercialTier: "core",
  availability: ["starter"],
  evidencePaths: [],
  evidencePathsText: "",
  owner: "",
  sortOrder: 0,
  isActive: true
};

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function rowToEditable(row: FeatureCatalogRow): EditableFeature {
  return {
    ...row,
    evidencePathsText: row.evidencePaths.join("\n")
  };
}

export function FeatureCatalogManager({
  initialRows,
  locale
}: {
  initialRows: FeatureCatalogRow[];
  locale: Locale;
}) {
  const isAr = locale === "ar";
  const [rows, setRows] = useState<FeatureCatalogRow[]>(initialRows);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<EditableFeature | null>(null);
  const [featureToDelete, setFeatureToDelete] = useState<FeatureCatalogRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const text = useMemo(
    () => ({
      title: isAr ? "إدارة الكاتالوج" : "Catalog management",
      description: isAr
        ? "تحكم في حالة كل ميزة تجارياً، الباقات المتاحة، ومسارات evidence التي تثبت التنفيذ."
        : "Manage commercial status, plan availability, and implementation evidence for each feature.",
      total: isAr ? "إجمالي العناصر" : "Total items",
      newFeature: isAr ? "ميزة جديدة" : "New feature",
      noRows: isAr ? "لا توجد ميزات بعد" : "No features yet",
      createFirst: isAr ? "أضف أول feature لتبدأ إدارة الكاتالوج." : "Add your first feature to start managing the catalog.",
      save: isAr ? "حفظ" : "Save",
      cancel: isAr ? "إلغاء" : "Cancel",
      create: isAr ? "إنشاء" : "Create",
      update: isAr ? "تحديث" : "Update",
      created: isAr ? "تم إنشاء الميزة" : "Feature created",
      updated: isAr ? "تم تحديث الميزة" : "Feature updated",
      deleted: isAr ? "تم حذف الميزة" : "Feature deleted",
      loadFailed: isAr ? "تعذر تحميل الكاتالوج" : "Failed to load catalog",
      saveFailed: isAr ? "تعذر حفظ الميزة" : "Failed to save feature",
      deleteFailed: isAr ? "تعذر حذف الميزة" : "Failed to delete feature",
      connectionError: isAr ? "حدث خطأ في الاتصال" : "Connection error",
      fillRequired: isAr ? "أكمل الحقول المطلوبة" : "Fill required fields",
      availabilityRequired: isAr ? "اختر باقة واحدة على الأقل" : "Select at least one plan",
      defaultFeature: isAr ? "افتراضي" : "Default",
      active: isAr ? "نشط" : "Active",
      disabled: isAr ? "معطّل" : "Disabled",
      featureId: isAr ? "Feature ID" : "Feature ID",
      family: isAr ? "العائلة" : "Family",
      status: isAr ? "الحالة" : "Status",
      tier: isAr ? "الطبقة التجارية" : "Commercial tier",
      owner: isAr ? "المالك" : "Owner",
      sortOrder: isAr ? "الترتيب" : "Sort order",
      availability: isAr ? "الباقات" : "Availability",
      evidencePaths: isAr ? "مسارات الـ evidence" : "Evidence paths",
      nameAr: isAr ? "الاسم بالعربية" : "Arabic name",
      nameEn: isAr ? "الاسم بالإنجليزية" : "English name",
      summaryAr: isAr ? "الملخص بالعربية" : "Arabic summary",
      summaryEn: isAr ? "الملخص بالإنجليزية" : "English summary",
      actions: isAr ? "الإجراءات" : "Actions",
      updatedAt: isAr ? "آخر تحديث" : "Updated",
      deleteTitle: isAr ? "حذف الميزة" : "Delete feature",
      deleteDesc: isAr ? "سيتم حذف الميزة نهائياً إذا لم تكن مربوطة بأي surfaces تجارية." : "The feature will be deleted permanently if it is not linked to any commercial surfaces.",
      defaultDeleteHint: isAr ? "الميزات الافتراضية لا تُحذف. عطّلها بدلاً من ذلك." : "Default features cannot be deleted. Disable them instead.",
      manageHint: isAr ? "يمكنك تعديل الحالة أو التعطيل، لكن الـ default feature IDs لا تتغير ولا تُحذف." : "You can edit status or disable entries, but default feature IDs cannot be changed or deleted."
    }),
    [isAr]
  );

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/feature-catalog");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error ?? text.loadFailed);
      }
      setRows(json.data ?? []);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : text.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [text.loadFailed]);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  function openDialog(feature?: FeatureCatalogRow) {
    setEditingFeature(feature ? rowToEditable(feature) : { ...DEFAULT_EDITABLE_FEATURE });
    setDialogOpen(true);
  }

  function toggleAvailability(plan: string, checked: boolean) {
    if (!editingFeature) return;

    const current = new Set(editingFeature.availability);
    if (checked) current.add(plan);
    else current.delete(plan);

    setEditingFeature({
      ...editingFeature,
      availability: Array.from(current)
    });
  }

  async function handleSave() {
    if (!editingFeature) return;

    if (
      !editingFeature.featureId.trim() ||
      !editingFeature.nameAr.trim() ||
      !editingFeature.nameEn.trim() ||
      !editingFeature.summaryAr.trim() ||
      !editingFeature.summaryEn.trim() ||
      !editingFeature.owner.trim()
    ) {
      toast.error(text.fillRequired);
      return;
    }

    if (editingFeature.availability.length === 0) {
      toast.error(text.availabilityRequired);
      return;
    }

    const payload = {
      featureId: editingFeature.featureId.trim(),
      family: editingFeature.family,
      nameAr: editingFeature.nameAr.trim(),
      nameEn: editingFeature.nameEn.trim(),
      summaryAr: editingFeature.summaryAr.trim(),
      summaryEn: editingFeature.summaryEn.trim(),
      status: editingFeature.status,
      commercialTier: editingFeature.commercialTier,
      availability: editingFeature.availability,
      evidencePaths: editingFeature.evidencePathsText
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean),
      owner: editingFeature.owner.trim(),
      sortOrder: Number(editingFeature.sortOrder) || 0,
      isActive: editingFeature.isActive
    };

    setSaving(true);
    try {
      const isUpdate = Boolean(editingFeature.id);
      const url = isUpdate
        ? `/api/super-admin/feature-catalog/${editingFeature.id}`
        : "/api/super-admin/feature-catalog";

      const res = await fetch(url, {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(json?.error ?? text.saveFailed);
        return;
      }

      toast.success(isUpdate ? text.updated : text.created);
      setDialogOpen(false);
      setEditingFeature(null);
      await fetchRows();
    } catch (error) {
      console.error(error);
      toast.error(text.connectionError);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!featureToDelete) return;

    const current = featureToDelete;
    setDeleteError(null);
    try {
      const res = await fetch(`/api/super-admin/feature-catalog/${current.id}`, {
        method: "DELETE"
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const errorMessage =
          json?.references?.length > 0
            ? `${json.error}: ${json.references.join(", ")}`
            : json?.error ?? text.deleteFailed;
        setDeleteError(errorMessage);
        return;
      }

      toast.success(text.deleted);
      setFeatureToDelete(null);
      await fetchRows();
    } catch (error) {
      console.error(error);
      setDeleteError(text.connectionError);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>{text.title}</CardTitle>
            <CardDescription>{text.description}</CardDescription>
            <p className="text-muted-foreground mt-2 text-xs">{text.manageHint}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">
              {rows.length} {text.total}
            </Badge>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              {text.newFeature}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-muted-foreground py-10 text-center">
              <p>{text.noRows}</p>
              <p className="text-sm">{text.createFirst}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{text.featureId}</TableHead>
                    <TableHead>{text.nameAr}</TableHead>
                    <TableHead>{text.family}</TableHead>
                    <TableHead>{text.status}</TableHead>
                    <TableHead>{text.availability}</TableHead>
                    <TableHead>{text.owner}</TableHead>
                    <TableHead>{text.updatedAt}</TableHead>
                    <TableHead className="text-right">{text.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-xs">{row.featureId}</span>
                          <div className="flex gap-1">
                            {row.isDefault ? <Badge variant="outline">{text.defaultFeature}</Badge> : null}
                            <Badge variant={row.isActive ? "default" : "secondary"}>
                              {row.isActive ? text.active : text.disabled}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{row.nameAr}</div>
                          <div className="text-muted-foreground text-xs">{row.nameEn}</div>
                        </div>
                      </TableCell>
                      <TableCell>{row.family}</TableCell>
                      <TableCell>
                        <Badge variant={row.status === "live" ? "default" : row.status === "beta" ? "secondary" : "outline"}>
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {row.availability.map((plan) => (
                            <Badge key={plan} variant="outline">
                              {plan}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{row.owner}</TableCell>
                      <TableCell>{formatDate(row.updatedAt, locale)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDialog(row)}
                            aria-label={text.update}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeleteError(null);
                              setFeatureToDelete(row);
                            }}
                            aria-label={text.deleteTitle}
                            disabled={row.isDefault}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingFeature?.id ? text.update : text.create}</DialogTitle>
            <DialogDescription>{text.description}</DialogDescription>
          </DialogHeader>

          {editingFeature ? (
            <div className="grid gap-4 py-2 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>{text.featureId}</Label>
                <Input
                  value={editingFeature.featureId}
                  onChange={(e) =>
                    setEditingFeature({ ...editingFeature, featureId: e.target.value })
                  }
                  disabled={rows.find((row) => row.id === editingFeature.id)?.isDefault}
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label>{text.family}</Label>
                <Select
                  value={editingFeature.family}
                  onValueChange={(value) => setEditingFeature({ ...editingFeature, family: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FAMILY_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{text.status}</Label>
                <Select
                  value={editingFeature.status}
                  onValueChange={(value) => setEditingFeature({ ...editingFeature, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{text.nameAr}</Label>
                <Input
                  value={editingFeature.nameAr}
                  onChange={(e) => setEditingFeature({ ...editingFeature, nameAr: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>{text.nameEn}</Label>
                <Input
                  value={editingFeature.nameEn}
                  onChange={(e) => setEditingFeature({ ...editingFeature, nameEn: e.target.value })}
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label>{text.summaryAr}</Label>
                <Textarea
                  value={editingFeature.summaryAr}
                  onChange={(e) => setEditingFeature({ ...editingFeature, summaryAr: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>{text.summaryEn}</Label>
                <Textarea
                  value={editingFeature.summaryEn}
                  onChange={(e) => setEditingFeature({ ...editingFeature, summaryEn: e.target.value })}
                  rows={4}
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label>{text.tier}</Label>
                <Select
                  value={editingFeature.commercialTier}
                  onValueChange={(value) =>
                    setEditingFeature({ ...editingFeature, commercialTier: value })
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIER_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{text.owner}</Label>
                <Input
                  value={editingFeature.owner}
                  onChange={(e) => setEditingFeature({ ...editingFeature, owner: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>{text.sortOrder}</Label>
                <Input
                  type="number"
                  min={0}
                  max={9999}
                  value={editingFeature.sortOrder}
                  onChange={(e) =>
                    setEditingFeature({ ...editingFeature, sortOrder: Number(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <Label>{text.active}</Label>
                </div>
                <Switch
                  checked={editingFeature.isActive}
                  onCheckedChange={(checked) =>
                    setEditingFeature({ ...editingFeature, isActive: checked })
                  }
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>{text.availability}</Label>
                <div className="grid gap-3 rounded-xl border p-4 sm:grid-cols-4">
                  {PLAN_OPTIONS.map((plan) => (
                    <label key={plan} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={editingFeature.availability.includes(plan)}
                        onCheckedChange={(checked) => toggleAvailability(plan, checked === true)}
                      />
                      <span>{plan}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>{text.evidencePaths}</Label>
                <Textarea
                  value={editingFeature.evidencePathsText}
                  onChange={(e) =>
                    setEditingFeature({ ...editingFeature, evidencePathsText: e.target.value })
                  }
                  rows={5}
                  placeholder="/dashboard/employees&#10;/dashboard/attendance&#10;app/api/payroll/route.ts"
                  dir="ltr"
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {text.cancel}
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingFeature?.id ? text.update : text.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={featureToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setFeatureToDelete(null);
            setDeleteError(null);
          }
        }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{text.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{text.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          {featureToDelete?.isDefault ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{text.defaultDeleteHint}</span>
            </div>
          ) : null}
          {deleteError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {deleteError}
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>{text.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
              disabled={featureToDelete?.isDefault}>
              {text.deleteTitle}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}