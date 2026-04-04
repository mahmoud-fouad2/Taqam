"use client";

import * as React from "react";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconCopy,
  IconCheck,
  IconDots,
  IconClipboardList,
  IconScale,
  IconStarFilled,
  IconLoader,
} from "@tabler/icons-react";
import { toast } from "sonner";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { evaluationTemplatesApi } from "@/lib/api/performance";
import {
  type EvaluationTemplate,
  type EvaluationSection,
  type EvaluationCriterion,
  type RatingScale,
  ratingScaleLabels,
} from "@/lib/types/performance";

type TemplateFormState = Partial<EvaluationTemplate>;

type SectionFormState = {
  name: string;
  description: string;
  weight: number;
};

type CriterionFormState = {
  name: string;
  description: string;
  weight: number;
  isRequired: boolean;
};

const EMPTY_FORM: TemplateFormState = {
  name: "",
  nameEn: "",
  description: "",
  ratingScale: "numeric_5",
  sections: [],
  isActive: true,
  isDefault: false,
};

const EMPTY_SECTION_FORM: SectionFormState = {
  name: "",
  description: "",
  weight: 0,
};

const EMPTY_CRITERION_FORM: CriterionFormState = {
  name: "",
  description: "",
  weight: 0,
  isRequired: true,
};

const SUPPORTED_RATING_SCALES: RatingScale[] = ["numeric_5", "numeric_10"];

function getScaleIcon(scale: RatingScale) {
  switch (scale) {
    case "numeric_10":
      return <IconScale className="h-4 w-4" />;
    case "numeric_5":
    default:
      return <IconStarFilled className="h-4 w-4" />;
  }
}

export function EvaluationTemplatesManager() {
  const [templates, setTemplates] = React.useState<EvaluationTemplate[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<EvaluationTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState<TemplateFormState>(EMPTY_FORM);
  const [sectionForm, setSectionForm] = React.useState<SectionFormState>(EMPTY_SECTION_FORM);
  const [criterionTargetSectionId, setCriterionTargetSectionId] = React.useState<string | null>(null);
  const [criterionForm, setCriterionForm] = React.useState<CriterionFormState>(EMPTY_CRITERION_FORM);
  const [busyTemplateId, setBusyTemplateId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadTemplates = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await evaluationTemplatesApi.getAll();
      if (!response.success || !response.data) {
        setTemplates([]);
        setError(response.error || "فشل تحميل نماذج التقييم");
        return;
      }

      setTemplates(response.data);
    } catch (loadError) {
      setTemplates([]);
      setError(loadError instanceof Error ? loadError.message : "فشل تحميل نماذج التقييم");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const totalWeight = React.useMemo(
    () => formData.sections?.reduce((sum, section) => sum + section.weight, 0) || 0,
    [formData.sections]
  );

  function resetDialogState() {
    setSelectedTemplate(null);
    setIsEditing(false);
    setFormData(EMPTY_FORM);
    setSectionForm(EMPTY_SECTION_FORM);
    setCriterionTargetSectionId(null);
    setCriterionForm(EMPTY_CRITERION_FORM);
  }

  function openCreateDialog() {
    resetDialogState();
    setIsDialogOpen(true);
  }

  function openEditDialog(template: EvaluationTemplate) {
    setSelectedTemplate(template);
    setIsEditing(true);
    setFormData({ ...template, sections: template.sections.map((section) => ({ ...section, criteria: [...section.criteria] })) });
    setSectionForm(EMPTY_SECTION_FORM);
    setCriterionTargetSectionId(null);
    setCriterionForm(EMPTY_CRITERION_FORM);
    setIsDialogOpen(true);
  }

  function updateForm<K extends keyof TemplateFormState>(key: K, value: TemplateFormState[K]) {
    setFormData((current) => ({ ...current, [key]: value }));
  }

  function handleAddSection() {
    if (!sectionForm.name.trim() || sectionForm.weight <= 0) {
      return;
    }

    const newSection: EvaluationSection = {
      id: `section-${Date.now()}`,
      name: sectionForm.name.trim(),
      description: sectionForm.description.trim() || undefined,
      weight: sectionForm.weight,
      order: (formData.sections?.length || 0) + 1,
      criteria: [],
    };

    setFormData((current) => ({
      ...current,
      sections: [...(current.sections || []), newSection],
    }));
    setSectionForm(EMPTY_SECTION_FORM);
  }

  function handleRemoveSection(sectionId: string) {
    setFormData((current) => ({
      ...current,
      sections: (current.sections || []).filter((section) => section.id !== sectionId),
    }));
  }

  function handleAddCriterion(sectionId: string) {
    if (!criterionForm.name.trim() || criterionForm.weight <= 0) {
      return;
    }

    const newCriterion: EvaluationCriterion = {
      id: `criterion-${Date.now()}`,
      name: criterionForm.name.trim(),
      description: criterionForm.description.trim() || undefined,
      weight: criterionForm.weight,
      order: 1,
      isRequired: criterionForm.isRequired,
    };

    setFormData((current) => ({
      ...current,
      sections: (current.sections || []).map((section) =>
        section.id === sectionId
          ? {
              ...section,
              criteria: [...section.criteria, { ...newCriterion, order: section.criteria.length + 1 }],
            }
          : section
      ),
    }));
    setCriterionTargetSectionId(null);
    setCriterionForm(EMPTY_CRITERION_FORM);
  }

  function handleRemoveCriterion(sectionId: string, criterionId: string) {
    setFormData((current) => ({
      ...current,
      sections: (current.sections || []).map((section) =>
        section.id === sectionId
          ? {
              ...section,
              criteria: section.criteria.filter((criterion) => criterion.id !== criterionId),
            }
          : section
      ),
    }));
  }

  async function handleSave() {
    if (!formData.name?.trim() || !formData.nameEn?.trim()) {
      toast.error("يرجى إدخال اسم النموذج بالعربية والإنجليزية");
      return;
    }

    if ((formData.sections?.length || 0) === 0) {
      toast.error("أضف قسمًا واحدًا على الأقل قبل الحفظ");
      return;
    }

    if (totalWeight !== 100) {
      toast.error("يجب أن يساوي الوزن الإجمالي 100%");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        name: formData.name.trim(),
        nameEn: formData.nameEn.trim(),
        description: formData.description?.trim() || undefined,
        ratingScale: formData.ratingScale || "numeric_5",
        sections: formData.sections || [],
        totalWeight,
        isActive: formData.isActive ?? true,
        isDefault: formData.isDefault ?? false,
        includesSelfReview: true,
        includesManagerReview: true,
        includes360Review: false,
        requiresCalibration: true,
      } as Omit<EvaluationTemplate, "id" | "tenantId" | "createdAt" | "updatedAt">;

      const response = isEditing && selectedTemplate
        ? await evaluationTemplatesApi.update(selectedTemplate.id, payload)
        : await evaluationTemplatesApi.create(payload);

      if (!response.success || !response.data) {
        toast.error(response.error || "تعذر حفظ النموذج");
        return;
      }

      toast.success(isEditing ? "تم تحديث النموذج" : "تم إنشاء النموذج");
      setIsDialogOpen(false);
      resetDialogState();
      await loadTemplates();
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "تعذر حفظ النموذج");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDuplicate(template: EvaluationTemplate) {
    setBusyTemplateId(template.id);
    try {
      const response = await evaluationTemplatesApi.duplicate(template.id, `${template.name} (نسخة)`);
      if (!response.success) {
        toast.error(response.error || "تعذر نسخ النموذج");
        return;
      }

      toast.success("تم إنشاء نسخة من النموذج");
      await loadTemplates();
    } catch (duplicateError) {
      toast.error(duplicateError instanceof Error ? duplicateError.message : "تعذر نسخ النموذج");
    } finally {
      setBusyTemplateId(null);
    }
  }

  async function handleSetDefault(template: EvaluationTemplate) {
    setBusyTemplateId(template.id);
    try {
      const response = await evaluationTemplatesApi.setDefault(template.id);
      if (!response.success) {
        toast.error(response.error || "تعذر تعيين النموذج كافتراضي");
        return;
      }

      toast.success("تم تعيين النموذج كافتراضي");
      await loadTemplates();
    } catch (defaultError) {
      toast.error(defaultError instanceof Error ? defaultError.message : "تعذر تعيين النموذج كافتراضي");
    } finally {
      setBusyTemplateId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyTemplateId(id);
    try {
      const response = await evaluationTemplatesApi.delete(id);
      if (!response.success) {
        toast.error(response.error || "تعذر حذف النموذج");
        return;
      }

      toast.success("تم حذف النموذج");
      await loadTemplates();
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "تعذر حذف النموذج");
    } finally {
      setBusyTemplateId(null);
    }
  }

  const stats = React.useMemo(() => ({
    total: templates.length,
    active: templates.filter((template) => template.isActive).length,
    defaults: templates.filter((template) => template.isDefault).length,
    criteria: templates.reduce(
      (sum, template) => sum + template.sections.reduce((sectionSum, section) => sectionSum + section.criteria.length, 0),
      0
    ),
  }), [templates]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">نماذج التقييم</h2>
          <p className="text-muted-foreground">إدارة نماذج ومعايير تقييم الأداء</p>
        </div>
        <Button onClick={openCreateDialog}>
          <IconPlus className="ms-2 h-4 w-4" />
          إضافة نموذج
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>إجمالي النماذج</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>نماذج نشطة</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>نماذج افتراضية</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.defaults}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>إجمالي المعايير</CardDescription>
            <CardTitle className="text-3xl text-purple-600">{stats.criteria}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <IconLoader className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className={!template.isActive ? "opacity-70" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {template.name}
                      {template.isDefault && <Badge variant="secondary">افتراضي</Badge>}
                    </CardTitle>
                    <CardDescription>{template.nameEn}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="خيارات" disabled={busyTemplateId === template.id}>
                        <IconDots className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(template)}>
                        <IconEdit className="ms-2 h-4 w-4" />
                        تعديل
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void handleDuplicate(template)}>
                        <IconCopy className="ms-2 h-4 w-4" />
                        نسخ
                      </DropdownMenuItem>
                      {!template.isDefault && (
                        <DropdownMenuItem onClick={() => void handleSetDefault(template)}>
                          <IconCheck className="ms-2 h-4 w-4" />
                          تعيين كافتراضي
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => void handleDelete(template.id)} disabled={template.isDefault}>
                        <IconTrash className="ms-2 h-4 w-4" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {template.description && <p className="text-sm text-muted-foreground">{template.description}</p>}

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getScaleIcon(template.ratingScale)}
                    {ratingScaleLabels[template.ratingScale]}
                  </Badge>
                  <Badge variant="outline">{template.sections.length} أقسام</Badge>
                  <Badge variant="outline">
                    {template.sections.reduce((sum, section) => sum + section.criteria.length, 0)} معيار
                  </Badge>
                </div>

                <div className="border-t pt-3">
                  <p className="mb-2 text-sm font-medium">الأقسام:</p>
                  <div className="space-y-1">
                    {template.sections.map((section) => (
                      <div key={section.id} className="flex items-center justify-between text-sm">
                        <span>{section.name}</span>
                        <Badge variant="secondary">{section.weight}%</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            resetDialogState();
          }
        }}
      >
        <DialogContent className="w-full max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "تعديل نموذج التقييم" : "إضافة نموذج تقييم جديد"}</DialogTitle>
            <DialogDescription>تحديد معلومات النموذج، الأقسام، والمعايير.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h4 className="font-medium">المعلومات الأساسية</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>الاسم بالعربية *</Label>
                  <Input value={formData.name || ""} onChange={(event) => updateForm("name", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>الاسم بالإنجليزية *</Label>
                  <Input value={formData.nameEn || ""} onChange={(event) => updateForm("nameEn", event.target.value)} dir="ltr" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea value={formData.description || ""} onChange={(event) => updateForm("description", event.target.value)} rows={2} />
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">إعدادات مدعومة</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>مقياس التقييم</Label>
                  <Select value={formData.ratingScale} onValueChange={(value: RatingScale) => updateForm("ratingScale", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_RATING_SCALES.map((scale) => (
                        <SelectItem key={scale} value={scale}>
                          {ratingScaleLabels[scale]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <Switch checked={formData.isActive ?? true} onCheckedChange={(checked) => updateForm("isActive", checked)} />
                  <Label>نموذج نشط</Label>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">أقسام التقييم</h4>
                <Badge variant={totalWeight === 100 ? "default" : "destructive"}>الوزن الإجمالي: {totalWeight}%</Badge>
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-sm font-medium">إضافة قسم جديد</p>
                <div className="grid gap-3 md:grid-cols-4">
                  <Input placeholder="اسم القسم" value={sectionForm.name} onChange={(event) => setSectionForm((current) => ({ ...current, name: event.target.value }))} />
                  <Input placeholder="الوصف" value={sectionForm.description} onChange={(event) => setSectionForm((current) => ({ ...current, description: event.target.value }))} />
                  <Input type="number" placeholder="الوزن %" value={sectionForm.weight || ""} onChange={(event) => setSectionForm((current) => ({ ...current, weight: Number(event.target.value) }))} min={1} max={100} />
                  <Button onClick={handleAddSection} disabled={!sectionForm.name.trim() || sectionForm.weight <= 0}>
                    <IconPlus className="ms-2 h-4 w-4" />
                    إضافة
                  </Button>
                </div>
              </div>

              <Accordion type="multiple" className="space-y-2">
                {(formData.sections || []).map((section) => (
                  <AccordionItem key={section.id} value={section.id} className="rounded-lg border">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="ms-2 flex w-full items-center justify-between">
                        <span className="font-medium">{section.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{section.weight}%</Badge>
                          <Badge variant="secondary">{section.criteria.length} معيار</Badge>
                          <Button variant="ghost" size="icon" aria-label="حذف القسم" className="h-6 w-6" onClick={(event) => {
                            event.stopPropagation();
                            handleRemoveSection(section.id);
                          }}>
                            <IconTrash className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-3">
                        <div className="space-y-2 rounded-lg bg-muted p-3">
                          <p className="text-sm">إضافة معيار</p>
                          <div className="grid gap-2 md:grid-cols-5">
                            <Input
                              placeholder="اسم المعيار"
                              value={criterionTargetSectionId === section.id ? criterionForm.name : ""}
                              onFocus={() => setCriterionTargetSectionId(section.id)}
                              onChange={(event) => {
                                setCriterionTargetSectionId(section.id);
                                setCriterionForm((current) => ({ ...current, name: event.target.value }));
                              }}
                            />
                            <Input
                              placeholder="الوصف"
                              value={criterionTargetSectionId === section.id ? criterionForm.description : ""}
                              onFocus={() => setCriterionTargetSectionId(section.id)}
                              onChange={(event) => setCriterionForm((current) => ({ ...current, description: event.target.value }))}
                            />
                            <Input
                              type="number"
                              placeholder="الوزن %"
                              value={criterionTargetSectionId === section.id ? criterionForm.weight || "" : ""}
                              onFocus={() => setCriterionTargetSectionId(section.id)}
                              onChange={(event) => setCriterionForm((current) => ({ ...current, weight: Number(event.target.value) }))}
                              min={1}
                            />
                            <div className="flex items-center gap-2">
                              <Switch checked={criterionForm.isRequired} onCheckedChange={(checked) => setCriterionForm((current) => ({ ...current, isRequired: checked }))} />
                              <span className="text-sm">مطلوب</span>
                            </div>
                            <Button size="sm" onClick={() => handleAddCriterion(section.id)} disabled={criterionTargetSectionId !== section.id || !criterionForm.name.trim() || criterionForm.weight <= 0}>
                              إضافة
                            </Button>
                          </div>
                        </div>

                        {section.criteria.length > 0 && (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>المعيار</TableHead>
                                <TableHead>الوصف</TableHead>
                                <TableHead className="w-[80px]">الوزن</TableHead>
                                <TableHead className="w-[80px]">مطلوب</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {section.criteria.map((criterion) => (
                                <TableRow key={criterion.id}>
                                  <TableCell className="font-medium">{criterion.name}</TableCell>
                                  <TableCell className="text-muted-foreground">{criterion.description || "-"}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{criterion.weight}%</Badge>
                                  </TableCell>
                                  <TableCell>{criterion.isRequired ? <IconCheck className="h-4 w-4 text-green-600" /> : "-"}</TableCell>
                                  <TableCell>
                                    <Button variant="ghost" size="icon" aria-label="حذف المعيار" className="h-6 w-6" onClick={() => handleRemoveCriterion(section.id, criterion.id)}>
                                      <IconTrash className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={() => void handleSave()} disabled={isSaving}>
              <IconCheck className="ms-2 h-4 w-4" />
              {isEditing ? "حفظ التعديلات" : "إضافة النموذج"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
