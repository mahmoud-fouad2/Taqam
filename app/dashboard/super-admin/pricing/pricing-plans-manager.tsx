"use client";

/**
 * Pricing Plans Manager Component
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Star, DollarSign } from "lucide-react";
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

interface PricingPlan {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  priceMonthly: number | null;
  priceYearly: number | null;
  currency: string;
  maxEmployees: number | null;
  employeesLabel: string | null;
  employeesLabelEn: string | null;
  featuresAr: string[];
  featuresEn: string[];
  planType: string;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
}

const PLAN_TYPES = [
  { value: "TRIAL", label: "تجريبي" },
  { value: "BASIC", label: "أساسي" },
  { value: "PROFESSIONAL", label: "احترافي" },
  { value: "ENTERPRISE", label: "مؤسسات" },
];

const DEFAULT_PLAN: Partial<PricingPlan> = {
  name: "",
  nameAr: "",
  slug: "",
  priceMonthly: null,
  priceYearly: null,
  currency: "SAR",
  maxEmployees: null,
  employeesLabel: "",
  employeesLabelEn: "",
  featuresAr: [],
  featuresEn: [],
  planType: "BASIC",
  isPopular: false,
  isActive: true,
  sortOrder: 0,
};

export function PricingPlansManager() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<PricingPlan> | null>(null);
  const [newFeatureAr, setNewFeatureAr] = useState("");
  const [newFeatureEn, setNewFeatureEn] = useState("");
  const [planToDelete, setPlanToDelete] = useState<PricingPlan | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const res = await fetch("/api/super-admin/pricing-plans");
      const json = await res.json();
      if (json.data) {
        setPlans(json.data.map((p: any) => ({
          ...p,
          priceMonthly: p.priceMonthly ? parseFloat(p.priceMonthly) : null,
          priceYearly: p.priceYearly ? parseFloat(p.priceYearly) : null,
        })));
      }
    } catch (err) {
      console.error(err);
      toast.error("فشل في تحميل الباقات");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!editingPlan) return;
    
    if (!editingPlan.name || !editingPlan.nameAr || !editingPlan.slug) {
      toast.error("يرجى ملء الحقول المطلوبة");
      return;
    }

    setSaving(true);
    try {
      const isUpdate = !!editingPlan.id;
      const url = isUpdate
        ? `/api/super-admin/pricing-plans/${editingPlan.id}`
        : "/api/super-admin/pricing-plans";
      
      const res = await fetch(url, {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPlan),
      });

      if (res.ok) {
        toast.success(isUpdate ? "تم تحديث الباقة" : "تم إنشاء الباقة");
        setDialogOpen(false);
        setEditingPlan(null);
        fetchPlans();
      } else {
        const json = await res.json();
        toast.error(json.error || "فشل في حفظ الباقة");
      }
    } catch (err) {
      console.error(err);
      toast.error("خطأ في الاتصال");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!planToDelete) return;
    const id = planToDelete.id;
    setPlanToDelete(null);
    try {
      const res = await fetch(`/api/super-admin/pricing-plans/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("تم حذف الباقة");
        fetchPlans();
      } else {
        toast.error("فشل في حذف الباقة");
      }
    } catch (err) {
      console.error(err);
      toast.error("خطأ في الاتصال");
    }
  }

  function openEditDialog(plan?: PricingPlan) {
    setEditingPlan(plan ? { ...plan } : { ...DEFAULT_PLAN });
    setNewFeatureAr("");
    setNewFeatureEn("");
    setDialogOpen(true);
  }

  function addFeature() {
    if (!editingPlan || !newFeatureAr.trim() || !newFeatureEn.trim()) return;
    setEditingPlan({
      ...editingPlan,
      featuresAr: [...(editingPlan.featuresAr || []), newFeatureAr.trim()],
      featuresEn: [...(editingPlan.featuresEn || []), newFeatureEn.trim()],
    });
    setNewFeatureAr("");
    setNewFeatureEn("");
  }

  function removeFeature(index: number) {
    if (!editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      featuresAr: (editingPlan.featuresAr || []).filter((_, i) => i !== index),
      featuresEn: (editingPlan.featuresEn || []).filter((_, i) => i !== index),
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {plans.length} باقات
        </p>
        <Button onClick={() => openEditDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          باقة جديدة
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={plan.isPopular ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {plan.nameAr}
                    {plan.isPopular && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                  </CardTitle>
                  <CardDescription>{plan.name}</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="تعديل"
                    onClick={() => openEditDialog(plan)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="حذف"
                    onClick={() => setPlanToDelete(plan)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">
                  {plan.priceMonthly != null ? plan.priceMonthly : "تواصل معنا"}
                </span>
                {plan.priceMonthly != null && (
                  <span className="text-muted-foreground">
                    {plan.currency}/شهر
                  </span>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                {plan.employeesLabel || "—"}
              </p>

              <div className="flex flex-wrap gap-2">
                <Badge variant={plan.isActive ? "default" : "secondary"}>
                  {plan.isActive ? "نشط" : "معطل"}
                </Badge>
                <Badge variant="outline">
                  {PLAN_TYPES.find((t) => t.value === plan.planType)?.label}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  المميزات ({plan.featuresAr?.length || 0})
                </p>
                <ul className="text-sm space-y-1">
                  {(plan.featuresAr || []).slice(0, 3).map((f, i) => (
                    <li key={i} className="truncate">✓ {f}</li>
                  ))}
                  {(plan.featuresAr?.length || 0) > 3 && (
                    <li className="text-muted-foreground">
                      +{plan.featuresAr.length - 3} أخرى
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}

        {plans.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <DollarSign className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>لا توجد باقات حتى الآن</p>
            <p className="text-sm">أنشئ أول باقة لتظهر في صفحة التسعير</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan?.id ? "تعديل الباقة" : "باقة جديدة"}
            </DialogTitle>
            <DialogDescription>
              أدخل تفاصيل الباقة التي ستظهر في صفحة التسعير
            </DialogDescription>
          </DialogHeader>

          {editingPlan && (
            <div className="space-y-4 py-4">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>الاسم (إنجليزي) *</Label>
                  <Input
                    value={editingPlan.name || ""}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, name: e.target.value })
                    }
                    placeholder="Starter"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الاسم (عربي) *</Label>
                  <Input
                    value={editingPlan.nameAr || ""}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, nameAr: e.target.value })
                    }
                    placeholder="الأساسية"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug *</Label>
                  <Input
                    value={editingPlan.slug || ""}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })
                    }
                    placeholder="starter"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>السعر الشهري</Label>
                  <Input
                    type="number"
                    value={editingPlan.priceMonthly ?? ""}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        priceMonthly: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    placeholder="اتركه فارغاً لـ 'تواصل معنا'"
                  />
                </div>
                <div className="space-y-2">
                  <Label>السعر السنوي</Label>
                  <Input
                    type="number"
                    value={editingPlan.priceYearly ?? ""}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        priceYearly: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>العملة</Label>
                  <Select
                    value={editingPlan.currency || "SAR"}
                    onValueChange={(value) =>
                      setEditingPlan({ ...editingPlan, currency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                      <SelectItem value="USD">دولار (USD)</SelectItem>
                      <SelectItem value="EUR">يورو (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Employees */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>الحد الأقصى للموظفين</Label>
                  <Input
                    type="number"
                    value={editingPlan.maxEmployees ?? ""}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        maxEmployees: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="اتركه فارغاً لغير محدود"
                  />
                </div>
                <div className="space-y-2">
                  <Label>نص الموظفين (عربي)</Label>
                  <Input
                    value={editingPlan.employeesLabel || ""}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, employeesLabel: e.target.value })
                    }
                    placeholder="حتى 25 موظف"
                  />
                </div>
                <div className="space-y-2">
                  <Label>نص الموظفين (إنجليزي)</Label>
                  <Input
                    value={editingPlan.employeesLabelEn || ""}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, employeesLabelEn: e.target.value })
                    }
                    placeholder="Up to 25 employees"
                  />
                </div>
              </div>

              {/* Plan Type & Options */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>نوع الباقة</Label>
                  <Select
                    value={editingPlan.planType || "BASIC"}
                    onValueChange={(value) =>
                      setEditingPlan({ ...editingPlan, planType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAN_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ترتيب العرض</Label>
                  <Input
                    type="number"
                    value={editingPlan.sortOrder ?? 0}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        sortOrder: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="flex flex-col gap-4 pt-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editingPlan.isPopular || false}
                      onCheckedChange={(checked) =>
                        setEditingPlan({ ...editingPlan, isPopular: checked })
                      }
                    />
                    <Label>الأكثر طلباً</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editingPlan.isActive ?? true}
                      onCheckedChange={(checked) =>
                        setEditingPlan({ ...editingPlan, isActive: checked })
                      }
                    />
                    <Label>نشط</Label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Features */}
              <div className="space-y-4">
                <Label>المميزات</Label>

                {/* Add Feature */}
                <div className="flex gap-2">
                  <Input
                    value={newFeatureAr}
                    onChange={(e) => setNewFeatureAr(e.target.value)}
                    placeholder="ميزة بالعربي"
                    className="flex-1"
                  />
                  <Input
                    value={newFeatureEn}
                    onChange={(e) => setNewFeatureEn(e.target.value)}
                    placeholder="Feature in English"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={addFeature}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Features List */}
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(editingPlan.featuresAr || []).map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded"
                    >
                      <div className="flex-1 text-sm">
                        <span>{f}</span>
                        <span className="text-muted-foreground mx-2">|</span>
                        <span className="text-muted-foreground">
                          {editingPlan.featuresEn?.[i]}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="حذف"
                        className="h-6 w-6"
                        onClick={() => removeFeature(i)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                "حفظ"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={planToDelete !== null} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الباقة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف باقة &quot;{planToDelete?.nameAr}&quot;؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDelete()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
