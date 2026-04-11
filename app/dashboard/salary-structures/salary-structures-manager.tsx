"use client";

import * as React from "react";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconCopy,
  IconCheck,
  IconPercentage,
  IconCurrencyRiyal,
  IconBuildingBank,
  IconShieldCheck
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  type SalaryStructure,
  type SalaryComponentItem,
  type SalaryComponent,
  salaryComponentLabels,
  formatCurrency
} from "@/lib/types/payroll";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error || "Request failed");
  }
  return json as T;
}

export function SalaryStructuresManager() {
  const locale = useClientLocale();
  const t = getText(locale);
  const [structures, setStructures] = React.useState<SalaryStructure[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingStructure, setEditingStructure] = React.useState<SalaryStructure | null>(null);
  const [selectedStructure, setSelectedStructure] = React.useState<SalaryStructure | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Form state
  const [formName, setFormName] = React.useState("");
  const [formNameAr, setFormNameAr] = React.useState("");
  const [formDescription, setFormDescription] = React.useState("");
  const [formIsDefault, setFormIsDefault] = React.useState(false);
  const [formIsActive, setFormIsActive] = React.useState(true);
  const [formComponents, setFormComponents] = React.useState<SalaryComponentItem[]>([
    {
      id: "basic",
      type: "basic",
      name: "Basic Salary",
      nameAr: t.common.basicSalary,
      isPercentage: false,
      value: 0,
      isTaxable: true,
      isGOSIApplicable: true
    }
  ]);

  const filteredStructures = structures.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.nameAr.includes(searchQuery)
  );

  const resetForm = () => {
    setFormName("");
    setFormNameAr("");
    setFormDescription("");
    setFormIsDefault(false);
    setFormIsActive(true);
    setFormComponents([
      {
        id: "basic",
        type: "basic",
        name: "Basic Salary",
        nameAr: t.common.basicSalary,
        isPercentage: false,
        value: 0,
        isTaxable: true,
        isGOSIApplicable: true
      }
    ]);
    setEditingStructure(null);
  };

  const loadStructures = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await fetchJson<{ data: SalaryStructure[] }>("/api/payroll/structures");
      setStructures(data);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || t.salaryStructures.loadFailed);
    } finally {
      setIsLoading(false);
    }
  }, [t.salaryStructures.loadFailed]);

  React.useEffect(() => {
    loadStructures();
  }, [loadStructures]);

  const openEditForm = (structure: SalaryStructure) => {
    setEditingStructure(structure);
    setFormName(structure.name);
    setFormNameAr(structure.nameAr);
    setFormDescription(structure.description || "");
    setFormIsDefault(structure.isDefault);
    setFormIsActive(structure.isActive);
    setFormComponents([...structure.components]);
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName || !formNameAr) return;

    setIsSaving(true);
    try {
      if (editingStructure) {
        await fetchJson<{ data: SalaryStructure }>(
          `/api/payroll/structures/${encodeURIComponent(editingStructure.id)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: formName,
              nameAr: formNameAr,
              description: formDescription,
              isDefault: formIsDefault,
              isActive: formIsActive,
              components: formComponents
            })
          }
        );
        toast.success(t.salaryStructures.savedChanges);
      } else {
        await fetchJson<{ data: SalaryStructure }>("/api/payroll/structures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            nameAr: formNameAr,
            description: formDescription,
            isDefault: formIsDefault,
            isActive: formIsActive,
            components: formComponents
          })
        });
        toast.success(t.salaryStructures.createdSuccess);
      }

      setIsFormOpen(false);
      resetForm();
      await loadStructures();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || t.salaryStructures.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetchJson(`/api/payroll/structures/${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
      toast.success(t.salaryStructures.deletedSuccess);
      await loadStructures();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || t.salaryStructures.deleteFailed);
    }
  };

  const handleDuplicate = async (structure: SalaryStructure) => {
    try {
      await fetchJson<{ data: SalaryStructure }>("/api/payroll/structures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${structure.name} (Copy)`,
          nameAr: `${structure.nameAr} (${t.salaryStructures.copy})`,
          description: structure.description,
          isDefault: false,
          isActive: structure.isActive,
          components: structure.components
        })
      });
      toast.success(t.salaryStructures.copiedSuccess);
      await loadStructures();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || t.salaryStructures.copyFailed);
    }
  };

  const addComponent = () => {
    const newComp: SalaryComponentItem = {
      id: `comp-${Date.now()}`,
      type: "housing",
      name: "Housing Allowance",
      nameAr: t.salaryStructures.housingAllowance,
      isPercentage: true,
      value: 25,
      isTaxable: true,
      isGOSIApplicable: true
    };
    setFormComponents((prev) => [...prev, newComp]);
  };

  const updateComponent = (index: number, updates: Partial<SalaryComponentItem>) => {
    setFormComponents((prev) =>
      prev.map((comp, i) => (i === index ? { ...comp, ...updates } : comp))
    );
  };

  const removeComponent = (index: number) => {
    if (formComponents[index].type === "basic") return; // Can't remove basic
    setFormComponents((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.salaryStructures.totalStructures}
            </CardTitle>
            <IconBuildingBank className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{structures.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.salaryStructures.active}</CardTitle>
            <IconCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {structures.filter((s) => s.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.salaryStructures.default}</CardTitle>
            <IconShieldCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {structures.find((s) => s.isDefault)?.nameAr || "-"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.salaryStructures.avgComponents}
            </CardTitle>
            <IconPercentage className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                structures.reduce((sum, s) => sum + s.components.length, 0) / structures.length || 0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <IconSearch className="text-muted-foreground absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t.salaryStructures.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>

        <Dialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) resetForm();
          }}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="ms-2 h-4 w-4" />
              {t.salaryStructures.pNewStructure}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>
                {editingStructure
                  ? t.salaryStructures.editStructure
                  : t.salaryStructures.createStructure}
              </DialogTitle>
              <DialogDescription>
                {t.salaryStructures.pDefineSalaryComponentsAndTheir}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.salaryStructures.nameArabic}</Label>
                  <Input
                    value={formNameAr}
                    onChange={(e) => setFormNameAr(e.target.value)}
                    placeholder={t.salaryStructures.exampleName}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.salaryStructures.nameEnglish}</Label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Standard Package"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.common.description}</Label>
                <Textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={t.salaryStructures.shortDesc}
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
                  <Label>{t.common.active}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formIsDefault} onCheckedChange={setFormIsDefault} />
                  <Label>{t.salaryStructures.default}</Label>
                </div>
              </div>

              {/* Components */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">{t.salaryStructures.components}</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addComponent}>
                    <IconPlus className="ms-1 h-4 w-4" />
                    {t.salaryStructures.pAddComponent}
                  </Button>
                </div>

                <div className="space-y-3">
                  {formComponents.map((comp, index) => (
                    <div key={comp.id} className="bg-muted/30 space-y-3 rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{comp.nameAr}</span>
                        {comp.type !== "basic" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={t.salaryStructures.deleteComponent}
                            className="text-destructive h-8 w-8"
                            onClick={() => removeComponent(index)}>
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className="space-y-1">
                          <Label className="text-xs">{t.common.type}</Label>
                          <Select
                            value={comp.type}
                            onValueChange={(v) => {
                              const type = v as SalaryComponent;
                              updateComponent(index, {
                                type,
                                name: salaryComponentLabels[type].en,
                                nameAr: salaryComponentLabels[type].ar
                              });
                            }}
                            disabled={comp.type === "basic"}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(salaryComponentLabels).map(([key, label]) => (
                                <SelectItem
                                  key={key}
                                  value={key}
                                  disabled={key === "basic" && comp.type !== "basic"}>
                                  {label.ar}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {comp.type !== "basic" && (
                          <>
                            <div className="space-y-1">
                              <Label className="text-xs">{t.salaryStructures.value}</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={comp.value}
                                  onChange={(e) =>
                                    updateComponent(index, { value: Number(e.target.value) })
                                  }
                                  className="flex-1"
                                />
                                <span className="text-muted-foreground text-sm">
                                  {comp.isPercentage ? "%" : t.salaryStructures.sar}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">{t.salaryStructures.valueType}</Label>
                              <Select
                                value={comp.isPercentage ? "percentage" : "fixed"}
                                onValueChange={(v) =>
                                  updateComponent(index, { isPercentage: v === "percentage" })
                                }>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="percentage">
                                    {t.salaryStructures.percentOfBasic}
                                  </SelectItem>
                                  <SelectItem value="fixed">
                                    {t.salaryStructures.fixedAmount}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}

                        <div className="space-y-2">
                          <Label className="text-xs">{t.salaryStructures.subjectTo}</Label>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`gosi-${index}`}
                                checked={comp.isGOSIApplicable}
                                onCheckedChange={(checked) =>
                                  updateComponent(index, { isGOSIApplicable: !!checked })
                                }
                              />
                              <label htmlFor={`gosi-${index}`} className="text-xs">
                                {t.salaryStructures.pInsurance}
                              </label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`tax-${index}`}
                                checked={comp.isTaxable}
                                onCheckedChange={(checked) =>
                                  updateComponent(index, { isTaxable: !!checked })
                                }
                              />
                              <label htmlFor={`tax-${index}`} className="text-xs">
                                {t.salaryStructures.pTax}
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                {t.common.cancel}
              </Button>
              <Button onClick={handleSubmit} disabled={!formName || !formNameAr || isSaving}>
                {editingStructure ? t.common.saveChanges : t.salaryStructures.createStructure}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Structures Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t.salaryStructures.structuresTitle}</CardTitle>
          <CardDescription>{t.salaryStructures.structuresDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.salaryStructures.structure}</TableHead>
                <TableHead>{t.salaryStructures.components}</TableHead>
                <TableHead>{t.common.status}</TableHead>
                <TableHead>{t.common.draft}</TableHead>
                <TableHead className="text-start">{t.common.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center">
                    <p className="text-muted-foreground">{t.common.loading}</p>
                  </TableCell>
                </TableRow>
              ) : filteredStructures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center">
                    <IconBuildingBank className="text-muted-foreground mx-auto mb-2 h-12 w-12" />
                    <p className="text-muted-foreground">{t.salaryStructures.noStructures}</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStructures.map((structure) => (
                  <TableRow key={structure.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{structure.nameAr}</p>
                        <p className="text-muted-foreground text-sm">{structure.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {structure.components.slice(0, 3).map((comp) => (
                          <Badge key={comp.id} variant="outline" className="text-xs">
                            {comp.nameAr}
                            {comp.type !== "basic" && (
                              <span className="me-1">
                                ({comp.isPercentage ? `${comp.value}%` : formatCurrency(comp.value)}
                                )
                              </span>
                            )}
                          </Badge>
                        ))}
                        {structure.components.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{structure.components.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={structure.isActive ? "default" : "secondary"}>
                        {structure.isActive ? t.common.active : t.common.inactive}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {structure.isDefault && (
                        <Badge variant="outline" className="text-blue-600">
                          <IconCheck className="ms-1 h-3 w-3" />
                          {t.salaryStructures.pDefault}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t.common.view}
                          onClick={() => setSelectedStructure(structure)}>
                          <IconCurrencyRiyal className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t.common.edit}
                          onClick={() => openEditForm(structure)}>
                          <IconEdit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t.salaryStructures.copyLabel}
                          onClick={() => handleDuplicate(structure)}>
                          <IconCopy className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t.common.delete}
                              className="text-destructive"
                              disabled={structure.isDefault}>
                              <IconTrash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t.salaryStructures.deleteStructure}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t.salaryStructures.pAreYouSureYouWantToDelete} &quot;
                                {structure.nameAr}&quot;?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(structure.id)}
                                className="bg-destructive">
                                {t.common.delete}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!selectedStructure} onOpenChange={() => setSelectedStructure(null)}>
        <DialogContent className="w-full sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t.salaryStructures.preview}</DialogTitle>
            <DialogDescription>{selectedStructure?.nameAr}</DialogDescription>
          </DialogHeader>
          {selectedStructure && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-muted-foreground mb-2 text-sm">
                  {t.salaryStructures.exampleSalary}
                </p>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">{t.common.basicSalary}</TableCell>
                      <TableCell className="text-start">{formatCurrency(10000)}</TableCell>
                    </TableRow>
                    {selectedStructure.components
                      .filter((c) => c.type !== "basic")
                      .map((comp) => (
                        <TableRow key={comp.id}>
                          <TableCell>{comp.nameAr}</TableCell>
                          <TableCell className="text-start">
                            {comp.isPercentage
                              ? formatCurrency((10000 * comp.value) / 100)
                              : formatCurrency(comp.value)}
                          </TableCell>
                        </TableRow>
                      ))}
                    <TableRow className="border-t-2 font-bold">
                      <TableCell>{t.common.total}</TableCell>
                      <TableCell className="text-start">
                        {formatCurrency(
                          10000 +
                            selectedStructure.components
                              .filter((c) => c.type !== "basic")
                              .reduce(
                                (sum, c) =>
                                  sum + (c.isPercentage ? (10000 * c.value) / 100 : c.value),
                                0
                              )
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
