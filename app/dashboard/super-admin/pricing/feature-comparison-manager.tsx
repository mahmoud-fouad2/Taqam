"use client";

import { useCallback, useEffect, useState } from "react";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { getText } from "@/lib/i18n/text";
import { useClientLocale } from "@/lib/i18n/use-client-locale";

interface ComparisonFeature {
  id: string;
  featureAr: string;
  featureEn: string;
  inStarter: boolean;
  inBusiness: boolean;
  inEnterprise: boolean;
  sortOrder: number;
  isActive: boolean;
}

const DEFAULT_FEATURE: Partial<ComparisonFeature> = {
  featureAr: "",
  featureEn: "",
  inStarter: false,
  inBusiness: false,
  inEnterprise: false,
  sortOrder: 0,
  isActive: true
};

export function FeatureComparisonManager() {
  const locale = useClientLocale();
  const t = getText(locale);
  const [rows, setRows] = useState<ComparisonFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Partial<ComparisonFeature> | null>(null);
  const [featureToDelete, setFeatureToDelete] = useState<ComparisonFeature | null>(null);

  const fetchRows = useCallback(async () => {
    try {
      const res = await fetch("/api/super-admin/feature-comparison");
      const json = await res.json();

      if (json.data) {
        setRows(json.data);
      }
    } catch (error) {
      console.error(error);
      toast.error(t.pricingPlans.comparisonLoadFailed);
    } finally {
      setLoading(false);
    }
  }, [t.pricingPlans.comparisonLoadFailed]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  function openDialog(feature?: ComparisonFeature) {
    setEditingFeature(feature ? { ...feature } : { ...DEFAULT_FEATURE });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!editingFeature?.featureAr?.trim() || !editingFeature.featureEn?.trim()) {
      toast.error(t.common.fillRequired);
      return;
    }

    if (!editingFeature.inStarter && !editingFeature.inBusiness && !editingFeature.inEnterprise) {
      toast.error(t.pricingPlans.selectAtLeastOnePlan);
      return;
    }

    setSaving(true);
    try {
      const isUpdate = Boolean(editingFeature.id);
      const url = isUpdate
        ? `/api/super-admin/feature-comparison/${editingFeature.id}`
        : "/api/super-admin/feature-comparison";

      const res = await fetch(url, {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingFeature)
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        toast.error(json?.error || t.pricingPlans.comparisonSaveFailed);
        return;
      }

      toast.success(isUpdate ? t.pricingPlans.comparisonUpdated : t.pricingPlans.comparisonCreated);
      setDialogOpen(false);
      setEditingFeature(null);
      await fetchRows();
    } catch (error) {
      console.error(error);
      toast.error(t.pricingPlans.connectionError);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!featureToDelete) {
      return;
    }

    const current = featureToDelete;
    setFeatureToDelete(null);

    try {
      const res = await fetch(`/api/super-admin/feature-comparison/${current.id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        toast.error(t.pricingPlans.comparisonDeleteFailed);
        return;
      }

      toast.success(t.pricingPlans.comparisonDeleted);
      await fetchRows();
    } catch (error) {
      console.error(error);
      toast.error(t.pricingPlans.connectionError);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>{t.pricingPlans.comparisonTitle}</CardTitle>
            <CardDescription>{t.pricingPlans.comparisonDescription}</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">
              {rows.length} {t.pricingPlans.comparisonRowsCount}
            </Badge>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              {t.pricingPlans.newComparisonRow}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="text-muted-foreground py-10 text-center">
              <p>{t.pricingPlans.noComparisonRows}</p>
              <p className="text-sm">{t.pricingPlans.createFirstComparisonRow}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.common.nameAr}</TableHead>
                    <TableHead>{t.common.nameEn}</TableHead>
                    <TableHead className="text-center">Starter</TableHead>
                    <TableHead className="text-center">Business</TableHead>
                    <TableHead className="text-center">Enterprise</TableHead>
                    <TableHead className="text-center">{t.common.status}</TableHead>
                    <TableHead className="text-center">{t.pricingPlans.sortOrder}</TableHead>
                    <TableHead className="text-right">{t.common.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.featureAr}</TableCell>
                      <TableCell>{row.featureEn}</TableCell>
                      <TableCell className="text-center">
                        {row.inStarter ? t.common.yes : t.common.no}
                      </TableCell>
                      <TableCell className="text-center">
                        {row.inBusiness ? t.common.yes : t.common.no}
                      </TableCell>
                      <TableCell className="text-center">
                        {row.inEnterprise ? t.common.yes : t.common.no}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={row.isActive ? "default" : "secondary"}>
                          {row.isActive ? t.common.active : t.common.disabled}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{row.sortOrder}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t.common.edit}
                            onClick={() => openDialog(row)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t.common.delete}
                            onClick={() => setFeatureToDelete(row)}>
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingFeature?.id
                ? t.pricingPlans.editComparisonRow
                : t.pricingPlans.newComparisonRow}
            </DialogTitle>
            <DialogDescription>{t.pricingPlans.comparisonDialogDescription}</DialogDescription>
          </DialogHeader>

          {editingFeature ? (
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t.common.nameAr}</Label>
                  <Input
                    value={editingFeature.featureAr || ""}
                    onChange={(event) =>
                      setEditingFeature({ ...editingFeature, featureAr: event.target.value })
                    }
                    placeholder={t.pricingPlans.featureArPlaceholder}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.common.nameEn}</Label>
                  <Input
                    value={editingFeature.featureEn || ""}
                    onChange={(event) =>
                      setEditingFeature({ ...editingFeature, featureEn: event.target.value })
                    }
                    placeholder={t.pricingPlans.featureEnPlaceholder}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.pricingPlans.sortOrder}</Label>
                <Input
                  type="number"
                  value={editingFeature.sortOrder ?? 0}
                  onChange={(event) =>
                    setEditingFeature({
                      ...editingFeature,
                      sortOrder: Number.parseInt(event.target.value, 10) || 0
                    })
                  }
                />
              </div>

              <div className="grid gap-3 rounded-2xl border p-4 md:grid-cols-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>{t.pricingPlans.inStarter}</Label>
                  <Switch
                    checked={editingFeature.inStarter || false}
                    onCheckedChange={(checked) =>
                      setEditingFeature({ ...editingFeature, inStarter: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Label>{t.pricingPlans.inBusiness}</Label>
                  <Switch
                    checked={editingFeature.inBusiness || false}
                    onCheckedChange={(checked) =>
                      setEditingFeature({ ...editingFeature, inBusiness: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Label>{t.pricingPlans.inEnterprise}</Label>
                  <Switch
                    checked={editingFeature.inEnterprise || false}
                    onCheckedChange={(checked) =>
                      setEditingFeature({ ...editingFeature, inEnterprise: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Label>{t.common.active}</Label>
                  <Switch
                    checked={editingFeature.isActive ?? true}
                    onCheckedChange={(checked) =>
                      setEditingFeature({ ...editingFeature, isActive: checked })
                    }
                  />
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
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

      <AlertDialog
        open={featureToDelete !== null}
        onOpenChange={(open) => !open && setFeatureToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.pricingPlans.deleteComparisonRow}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.pricingPlans.deleteComparisonPrompt} &quot;{featureToDelete?.featureAr}&quot;?
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
    </>
  );
}
