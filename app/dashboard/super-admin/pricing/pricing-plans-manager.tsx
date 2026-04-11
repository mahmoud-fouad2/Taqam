"use client";

/**
 * Pricing Plans Manager Component
 */

import { useState, useEffect, useCallback, useMemo } from "react";
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
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
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
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

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
  sortOrder: 0
};

export function PricingPlansManager() {
  const locale = useClientLocale();
  const t = getText(locale);
  const planTypes = useMemo(
    () => [
      { value: "TRIAL", label: t.pricingPlans.trial },
      { value: "BASIC", label: t.common.basic },
      { value: "PROFESSIONAL", label: t.pricingPlans.professional },
      { value: "ENTERPRISE", label: t.common.institutions }
    ],
    [t.common.basic, t.common.institutions, t.pricingPlans.professional, t.pricingPlans.trial]
  );
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<PricingPlan> | null>(null);
  const [newFeatureAr, setNewFeatureAr] = useState("");
  const [newFeatureEn, setNewFeatureEn] = useState("");
  const [planToDelete, setPlanToDelete] = useState<PricingPlan | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch("/api/super-admin/pricing-plans");
      const json = await res.json();
      if (json.data) {
        setPlans(
          json.data.map((p: any) => ({
            ...p,
            priceMonthly: p.priceMonthly ? parseFloat(p.priceMonthly) : null,
            priceYearly: p.priceYearly ? parseFloat(p.priceYearly) : null
          }))
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(t.pricingPlans.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [t.pricingPlans.loadFailed]);

  useEffect(() => {
    void fetchPlans();
  }, [fetchPlans]);

  async function handleSave() {
    if (!editingPlan) return;

    if (!editingPlan.name || !editingPlan.nameAr || !editingPlan.slug) {
      toast.error(t.common.fillRequired);
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
        body: JSON.stringify(editingPlan)
      });

      if (res.ok) {
        toast.success(isUpdate ? t.pricingPlans.planUpdated : t.pricingPlans.planCreated);
        setDialogOpen(false);
        setEditingPlan(null);
        fetchPlans();
      } else {
        const json = await res.json();
        toast.error(json.error || t.pricingPlans.saveFailed);
      }
    } catch (err) {
      console.error(err);
      toast.error(t.platformSettings.connectionError);
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
        method: "DELETE"
      });

      if (res.ok) {
        toast.success(t.pricingPlans.deletedSuccess);
        fetchPlans();
      } else {
        toast.error(t.pricingPlans.deleteFailed);
      }
    } catch (err) {
      console.error(err);
      toast.error(t.platformSettings.connectionError);
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
      featuresEn: [...(editingPlan.featuresEn || []), newFeatureEn.trim()]
    });
    setNewFeatureAr("");
    setNewFeatureEn("");
  }

  function removeFeature(index: number) {
    if (!editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      featuresAr: (editingPlan.featuresAr || []).filter((_, i) => i !== index),
      featuresEn: (editingPlan.featuresEn || []).filter((_, i) => i !== index)
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {plans.length} {t.pricingPlans.packagesCount}
        </p>
        <Button onClick={() => openEditDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          {t.pricingPlans.newPlan}
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
                    {plan.isPopular && <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />}
                  </CardTitle>
                  <CardDescription>{plan.name}</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t.common.edit}
                    onClick={() => openEditDialog(plan)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t.common.delete}
                    onClick={() => setPlanToDelete(plan)}>
                    <Trash2 className="text-destructive h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">
                  {plan.priceMonthly != null ? plan.priceMonthly : t.pricingPlans.contactUs}
                </span>
                {plan.priceMonthly != null && (
                  <span className="text-muted-foreground">
                    {plan.currency}
                    {t.pricingPlans.perMonth}
                  </span>
                )}
              </div>

              <p className="text-muted-foreground text-sm">{plan.employeesLabel || "—"}</p>

              <div className="flex flex-wrap gap-2">
                <Badge variant={plan.isActive ? "default" : "secondary"}>
                  {plan.isActive ? t.common.active : t.common.disabled}
                </Badge>
                <Badge variant="outline">
                  {planTypes.find((item) => item.value === plan.planType)?.label}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium">
                  {t.pricingPlans.features} ({plan.featuresAr?.length || 0})
                </p>
                <ul className="space-y-1 text-sm">
                  {(plan.featuresAr || []).slice(0, 3).map((f, i) => (
                    <li key={i} className="truncate">
                      ✓ {f}
                    </li>
                  ))}
                  {(plan.featuresAr?.length || 0) > 3 && (
                    <li className="text-muted-foreground">
                      +{plan.featuresAr.length - 3} {t.pricingPlans.moreFeatures}
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}

        {plans.length === 0 && (
          <div className="text-muted-foreground col-span-full py-12 text-center">
            <DollarSign className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>{t.pricingPlans.noPlans}</p>
            <p className="text-sm">{t.pricingPlans.createFirstPlan}</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan?.id ? t.pricingPlans.editPlan : t.pricingPlans.newPlan}
            </DialogTitle>
            <DialogDescription>{t.pricingPlans.description}</DialogDescription>
          </DialogHeader>

          {editingPlan && (
            <div className="space-y-4 py-4">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>{t.pricingPlans.nameEnLabel}</Label>
                  <Input
                    value={editingPlan.name || ""}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    placeholder="Starter"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.pricingPlans.nameAr}</Label>
                  <Input
                    value={editingPlan.nameAr || ""}
                    onChange={(e) => setEditingPlan({ ...editingPlan, nameAr: e.target.value })}
                    placeholder={t.pricingPlans.nameArPlaceholder}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug *</Label>
                  <Input
                    value={editingPlan.slug || ""}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        slug: e.target.value.toLowerCase().replace(/\s+/g, "-")
                      })
                    }
                    placeholder="starter"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>{t.pricingPlans.monthlyPrice}</Label>
                  <Input
                    type="number"
                    value={editingPlan.priceMonthly ?? ""}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        priceMonthly: e.target.value ? parseFloat(e.target.value) : null
                      })
                    }
                    placeholder={t.pricingPlans.leaveEmptyForContact}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.pricingPlans.yearlyPrice}</Label>
                  <Input
                    type="number"
                    value={editingPlan.priceYearly ?? ""}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        priceYearly: e.target.value ? parseFloat(e.target.value) : null
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.salaryStructures.currency}</Label>
                  <Select
                    value={editingPlan.currency || "SAR"}
                    onValueChange={(value) => setEditingPlan({ ...editingPlan, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAR">{t.pricingPlans.sar}</SelectItem>
                      <SelectItem value="USD">{t.pricingPlans.usd}</SelectItem>
                      <SelectItem value="EUR">{t.pricingPlans.eur}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Employees */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>{t.platformSettings.maxEmployees}</Label>
                  <Input
                    type="number"
                    value={editingPlan.maxEmployees ?? ""}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        maxEmployees: e.target.value ? parseInt(e.target.value) : null
                      })
                    }
                    placeholder={t.pricingPlans.unlimitedHint}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.pricingPlans.employeesLabelAr}</Label>
                  <Input
                    value={editingPlan.employeesLabel || ""}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, employeesLabel: e.target.value })
                    }
                    placeholder={t.pricingPlans.employeesExample}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.pricingPlans.employeesLabelEn}</Label>
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
                  <Label>{t.pricingPlans.planType}</Label>
                  <Select
                    value={editingPlan.planType || "BASIC"}
                    onValueChange={(value) => setEditingPlan({ ...editingPlan, planType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {planTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t.pricingPlans.sortOrder}</Label>
                  <Input
                    type="number"
                    value={editingPlan.sortOrder ?? 0}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        sortOrder: parseInt(e.target.value) || 0
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
                    <Label>{t.pricingPlans.mostPopular}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editingPlan.isActive ?? true}
                      onCheckedChange={(checked) =>
                        setEditingPlan({ ...editingPlan, isActive: checked })
                      }
                    />
                    <Label>{t.common.active}</Label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Features */}
              <div className="space-y-4">
                <Label>{t.pricingPlans.pFeatures}</Label>

                {/* Add Feature */}
                <div className="flex gap-2">
                  <Input
                    value={newFeatureAr}
                    onChange={(e) => setNewFeatureAr(e.target.value)}
                    placeholder={t.pricingPlans.featureArPlaceholder}
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
                <div className="max-h-40 space-y-2 overflow-y-auto">
                  {(editingPlan.featuresAr || []).map((f, i) => (
                    <div
                      key={i}
                      className="bg-muted/50 flex items-center justify-between gap-2 rounded p-2">
                      <div className="flex-1 text-sm">
                        <span>{f}</span>
                        <span className="text-muted-foreground mx-2">|</span>
                        <span className="text-muted-foreground">{editingPlan.featuresEn?.[i]}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t.common.delete}
                        className="h-6 w-6"
                        onClick={() => removeFeature(i)}>
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
              {t.common.cancel}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.common.saving}
                </>
              ) : (
                t.common.save
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={planToDelete !== null}
        onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.pricingPlans.deletePlan}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.pricingPlans.pAreYouSureYouWantToDelete} &quot;{planToDelete?.nameAr}&quot;?{" "}
              {t.pricingPlans.deleteConfirmMsg}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDelete()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
