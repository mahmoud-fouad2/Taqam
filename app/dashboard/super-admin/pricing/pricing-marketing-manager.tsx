"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type {
  LocalizedMarketingText,
  PricingMarketingContent,
  PricingMarketingContentAdminState
} from "@/lib/marketing/pricing";

type PricingPageLocalizedKey =
  | "heroPrimaryCtaLabel"
  | "heroSecondaryCtaLabel"
  | "plansSectionTitle"
  | "plansSectionDescription"
  | "comparisonSectionTitle"
  | "comparisonSectionDescription"
  | "comparisonFootnote"
  | "customCtaTitle"
  | "customCtaDescription"
  | "customCtaPrimaryLabel"
  | "customCtaSecondaryLabel"
  | "popularBadge"
  | "planCardPrimaryCtaLabel";

type PlansPageLocalizedKey =
  | "heroBadge"
  | "heroTitle"
  | "heroDescription"
  | "heroPrimaryCtaLabel"
  | "heroSecondaryCtaLabel"
  | "breakdownSectionTitle"
  | "breakdownSectionDescription"
  | "addonsSectionTitle"
  | "addonsSectionDescription"
  | "recommendationCtaTitle"
  | "recommendationCtaDescription"
  | "recommendationCtaPrimaryLabel"
  | "recommendationCtaSecondaryLabel"
  | "popularBadge"
  | "planCardPrimaryCtaLabel";

type TaglineKey = keyof PricingMarketingContent["plansPage"]["taglines"];

const emptyLocalizedText: LocalizedMarketingText = { ar: "", en: "" };

const emptyState: PricingMarketingContent = {
  pricingPage: {
    heroPrimaryCtaLabel: emptyLocalizedText,
    heroSecondaryCtaLabel: emptyLocalizedText,
    plansSectionTitle: emptyLocalizedText,
    plansSectionDescription: emptyLocalizedText,
    comparisonSectionTitle: emptyLocalizedText,
    comparisonSectionDescription: emptyLocalizedText,
    comparisonFootnote: emptyLocalizedText,
    customCtaTitle: emptyLocalizedText,
    customCtaDescription: emptyLocalizedText,
    customCtaPrimaryLabel: emptyLocalizedText,
    customCtaSecondaryLabel: emptyLocalizedText,
    popularBadge: emptyLocalizedText,
    planCardPrimaryCtaLabel: emptyLocalizedText
  },
  plansPage: {
    heroBadge: emptyLocalizedText,
    heroTitle: emptyLocalizedText,
    heroDescription: emptyLocalizedText,
    heroPrimaryCtaLabel: emptyLocalizedText,
    heroSecondaryCtaLabel: emptyLocalizedText,
    breakdownSectionTitle: emptyLocalizedText,
    breakdownSectionDescription: emptyLocalizedText,
    addonsSectionTitle: emptyLocalizedText,
    addonsSectionDescription: emptyLocalizedText,
    recommendationCtaTitle: emptyLocalizedText,
    recommendationCtaDescription: emptyLocalizedText,
    recommendationCtaPrimaryLabel: emptyLocalizedText,
    recommendationCtaSecondaryLabel: emptyLocalizedText,
    popularBadge: emptyLocalizedText,
    planCardPrimaryCtaLabel: emptyLocalizedText,
    taglines: {
      basic: emptyLocalizedText,
      professional: emptyLocalizedText,
      enterprise: emptyLocalizedText,
      popular: emptyLocalizedText
    }
  },
  addons: [emptyLocalizedText]
};

export function PricingMarketingManager({
  initialState,
  locale
}: {
  initialState: PricingMarketingContentAdminState;
  locale: "ar" | "en";
}) {
  const isAr = locale === "ar";
  const [form, setForm] = useState<PricingMarketingContent>(initialState.draft);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(initialState.hasUnpublishedChanges);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(initialState.lastDraftSavedAt);
  const [lastPublishedAt, setLastPublishedAt] = useState<string | null>(initialState.lastPublishedAt);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setForm(initialState.draft ?? emptyState);
    setHasUnpublishedChanges(initialState.hasUnpublishedChanges);
    setLastDraftSavedAt(initialState.lastDraftSavedAt);
    setLastPublishedAt(initialState.lastPublishedAt);
  }, [initialState]);

  function updatePricingPageField(field: PricingPageLocalizedKey, lang: "ar" | "en", value: string) {
    setForm((current) => ({
      ...current,
      pricingPage: {
        ...current.pricingPage,
        [field]: {
          ...current.pricingPage[field],
          [lang]: value
        }
      }
    }));
  }

  function updatePlansPageField(field: PlansPageLocalizedKey, lang: "ar" | "en", value: string) {
    setForm((current) => ({
      ...current,
      plansPage: {
        ...current.plansPage,
        [field]: {
          ...current.plansPage[field],
          [lang]: value
        }
      }
    }));
  }

  function updateTagline(field: TaglineKey, lang: "ar" | "en", value: string) {
    setForm((current) => ({
      ...current,
      plansPage: {
        ...current.plansPage,
        taglines: {
          ...current.plansPage.taglines,
          [field]: {
            ...current.plansPage.taglines[field],
            [lang]: value
          }
        }
      }
    }));
  }

  function updateAddon(index: number, lang: "ar" | "en", value: string) {
    setForm((current) => ({
      ...current,
      addons: current.addons.map((addon, addonIndex) =>
        addonIndex === index
          ? {
              ...addon,
              [lang]: value
            }
          : addon
      )
    }));
  }

  function addAddon() {
    setForm((current) => ({
      ...current,
      addons: [...current.addons, { ar: "", en: "" }]
    }));
  }

  function removeAddon(index: number) {
    setForm((current) => ({
      ...current,
      addons: current.addons.filter((_, addonIndex) => addonIndex !== index)
    }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/super-admin/pricing-marketing", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      const json = await response.json().catch(() => null);

      if (!response.ok || !json?.data) {
        toast.error(json?.error ?? (isAr ? "تعذر حفظ محتوى التسعير." : "Unable to save pricing content."));
        return;
      }

      setForm(json.data);
      setHasUnpublishedChanges(Boolean(json.hasUnpublishedChanges));
      setLastDraftSavedAt(typeof json.lastDraftSavedAt === "string" ? json.lastDraftSavedAt : null);
      setLastPublishedAt(typeof json.lastPublishedAt === "string" ? json.lastPublishedAt : null);
      setMessage(isAr ? "تم حفظ مسودة محتوى التسعير." : "Pricing content draft saved.");
      toast.success(isAr ? "تم حفظ مسودة محتوى التسعير." : "Pricing content draft saved.");
    } catch {
      toast.error(isAr ? "حدث خطأ أثناء حفظ محتوى التسعير." : "An error occurred while saving pricing content.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setMessage("");

    try {
      const response = await fetch("/api/super-admin/pricing-marketing/publish", {
        method: "POST"
      });
      const json = await response.json().catch(() => null);

      if (!response.ok || !json?.data) {
        toast.error(json?.error ?? (isAr ? "تعذر نشر محتوى التسعير." : "Unable to publish pricing content."));
        return;
      }

      setForm(json.data);
      setHasUnpublishedChanges(Boolean(json.hasUnpublishedChanges));
      setLastDraftSavedAt(typeof json.lastDraftSavedAt === "string" ? json.lastDraftSavedAt : null);
      setLastPublishedAt(typeof json.lastPublishedAt === "string" ? json.lastPublishedAt : null);
      setMessage(isAr ? "تم نشر محتوى التسعير للعامة." : "Pricing content published to the live site.");
      toast.success(isAr ? "تم نشر محتوى التسعير للعامة." : "Pricing content published successfully.");
    } catch {
      toast.error(isAr ? "حدث خطأ أثناء نشر محتوى التسعير." : "An error occurred while publishing pricing content.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>
              {isAr ? "إدارة badges وCTA للتسعير" : "Pricing badges and CTA controls"}
            </CardTitle>
            <CardDescription>
              {isAr
                ? "تحكم في نصوص صفحات الأسعار والباقات: badges، CTA، taglines، ونصوص المقاطع الأساسية من نفس شاشة السوبر أدمن."
                : "Manage pricing-page and plans-page badges, CTAs, taglines, and key section copy from one super-admin screen."}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => void handleSave()} disabled={saving || publishing} variant="outline">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isAr ? "حفظ كمسودة" : "Save draft"}
            </Button>
            <Button onClick={() => void handlePublish()} disabled={saving || publishing || !hasUnpublishedChanges}>
              {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isAr ? "نشر التعديلات" : "Publish changes"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 rounded-2xl border p-4 text-sm">
            <p className="font-medium">
              {message || (hasUnpublishedChanges ? (isAr ? "هناك مسودة غير منشورة لمحتوى التسعير." : "There is an unpublished pricing content draft.") : (isAr ? "النسخة المنشورة مطابقة للمسودة الحالية." : "The published version matches the current draft."))}
            </p>
            <div className="text-muted-foreground mt-2 space-y-1">
              <p>{isAr ? "آخر حفظ للمسودة:" : "Last draft save:"} {lastDraftSavedAt ?? (isAr ? "غير متوفر" : "Not available")}</p>
              <p>{isAr ? "آخر نشر:" : "Last published:"} {lastPublishedAt ?? (isAr ? "غير متوفر" : "Not available")}</p>
            </div>
          </div>

          <Tabs defaultValue="pricing-page" className="w-full">
            <TabsList className="flex h-auto flex-wrap justify-start">
              <TabsTrigger value="pricing-page">{isAr ? "صفحة الأسعار" : "Pricing page"}</TabsTrigger>
              <TabsTrigger value="plans-page">{isAr ? "صفحة الباقات" : "Plans page"}</TabsTrigger>
              <TabsTrigger value="taglines-addons">{isAr ? "الوسوم والإضافات" : "Taglines and add-ons"}</TabsTrigger>
            </TabsList>

            <TabsContent value="pricing-page" className="space-y-4 pt-4">
              <LocalizedField
                labelAr="زر الهيرو الأساسي"
                labelEn="Hero primary CTA"
                valueAr={form.pricingPage.heroPrimaryCtaLabel.ar}
                valueEn={form.pricingPage.heroPrimaryCtaLabel.en}
                onChangeAr={(value) => updatePricingPageField("heroPrimaryCtaLabel", "ar", value)}
                onChangeEn={(value) => updatePricingPageField("heroPrimaryCtaLabel", "en", value)}
              />
              <LocalizedField
                labelAr="زر الهيرو الثانوي"
                labelEn="Hero secondary CTA"
                valueAr={form.pricingPage.heroSecondaryCtaLabel.ar}
                valueEn={form.pricingPage.heroSecondaryCtaLabel.en}
                onChangeAr={(value) => updatePricingPageField("heroSecondaryCtaLabel", "ar", value)}
                onChangeEn={(value) => updatePricingPageField("heroSecondaryCtaLabel", "en", value)}
              />
              <LocalizedField
                labelAr="عنوان قسم الباقات"
                labelEn="Plans section title"
                valueAr={form.pricingPage.plansSectionTitle.ar}
                valueEn={form.pricingPage.plansSectionTitle.en}
                onChangeAr={(value) => updatePricingPageField("plansSectionTitle", "ar", value)}
                onChangeEn={(value) => updatePricingPageField("plansSectionTitle", "en", value)}
              />
              <LocalizedField
                labelAr="وصف قسم الباقات"
                labelEn="Plans section description"
                valueAr={form.pricingPage.plansSectionDescription.ar}
                valueEn={form.pricingPage.plansSectionDescription.en}
                onChangeAr={(value) => updatePricingPageField("plansSectionDescription", "ar", value)}
                onChangeEn={(value) => updatePricingPageField("plansSectionDescription", "en", value)}
                textarea
              />
              <LocalizedField
                labelAr="عنوان المقارنة"
                labelEn="Comparison title"
                valueAr={form.pricingPage.comparisonSectionTitle.ar}
                valueEn={form.pricingPage.comparisonSectionTitle.en}
                onChangeAr={(value) => updatePricingPageField("comparisonSectionTitle", "ar", value)}
                onChangeEn={(value) => updatePricingPageField("comparisonSectionTitle", "en", value)}
              />
              <LocalizedField
                labelAr="وصف المقارنة"
                labelEn="Comparison description"
                valueAr={form.pricingPage.comparisonSectionDescription.ar}
                valueEn={form.pricingPage.comparisonSectionDescription.en}
                onChangeAr={(value) => updatePricingPageField("comparisonSectionDescription", "ar", value)}
                onChangeEn={(value) => updatePricingPageField("comparisonSectionDescription", "en", value)}
                textarea
              />
              <LocalizedField
                labelAr="ملاحظة المقارنة"
                labelEn="Comparison footnote"
                valueAr={form.pricingPage.comparisonFootnote.ar}
                valueEn={form.pricingPage.comparisonFootnote.en}
                onChangeAr={(value) => updatePricingPageField("comparisonFootnote", "ar", value)}
                onChangeEn={(value) => updatePricingPageField("comparisonFootnote", "en", value)}
              />
              <LocalizedField
                labelAr="عنوان CTA المخصص"
                labelEn="Custom CTA title"
                valueAr={form.pricingPage.customCtaTitle.ar}
                valueEn={form.pricingPage.customCtaTitle.en}
                onChangeAr={(value) => updatePricingPageField("customCtaTitle", "ar", value)}
                onChangeEn={(value) => updatePricingPageField("customCtaTitle", "en", value)}
              />
              <LocalizedField
                labelAr="وصف CTA المخصص"
                labelEn="Custom CTA description"
                valueAr={form.pricingPage.customCtaDescription.ar}
                valueEn={form.pricingPage.customCtaDescription.en}
                onChangeAr={(value) => updatePricingPageField("customCtaDescription", "ar", value)}
                onChangeEn={(value) => updatePricingPageField("customCtaDescription", "en", value)}
                textarea
              />
              <LocalizedField
                labelAr="نص زر CTA الأساسي"
                labelEn="Primary CTA label"
                valueAr={form.pricingPage.customCtaPrimaryLabel.ar}
                valueEn={form.pricingPage.customCtaPrimaryLabel.en}
                onChangeAr={(value) => updatePricingPageField("customCtaPrimaryLabel", "ar", value)}
                onChangeEn={(value) => updatePricingPageField("customCtaPrimaryLabel", "en", value)}
              />
              <LocalizedField
                labelAr="نص زر CTA الثانوي"
                labelEn="Secondary CTA label"
                valueAr={form.pricingPage.customCtaSecondaryLabel.ar}
                valueEn={form.pricingPage.customCtaSecondaryLabel.en}
                onChangeAr={(value) => updatePricingPageField("customCtaSecondaryLabel", "ar", value)}
                onChangeEn={(value) => updatePricingPageField("customCtaSecondaryLabel", "en", value)}
              />
              <LocalizedField
                labelAr="Badge الباقة الأكثر طلبًا"
                labelEn="Most popular badge"
                valueAr={form.pricingPage.popularBadge.ar}
                valueEn={form.pricingPage.popularBadge.en}
                onChangeAr={(value) => updatePricingPageField("popularBadge", "ar", value)}
                onChangeEn={(value) => updatePricingPageField("popularBadge", "en", value)}
              />
              <LocalizedField
                labelAr="نص زر بطاقة الباقة"
                labelEn="Plan card CTA label"
                valueAr={form.pricingPage.planCardPrimaryCtaLabel.ar}
                valueEn={form.pricingPage.planCardPrimaryCtaLabel.en}
                onChangeAr={(value) => updatePricingPageField("planCardPrimaryCtaLabel", "ar", value)}
                onChangeEn={(value) => updatePricingPageField("planCardPrimaryCtaLabel", "en", value)}
              />
            </TabsContent>

            <TabsContent value="plans-page" className="space-y-4 pt-4">
            <LocalizedField
              labelAr="Badge الهيرو"
              labelEn="Hero badge"
              valueAr={form.plansPage.heroBadge.ar}
              valueEn={form.plansPage.heroBadge.en}
              onChangeAr={(value) => updatePlansPageField("heroBadge", "ar", value)}
              onChangeEn={(value) => updatePlansPageField("heroBadge", "en", value)}
            />
            <LocalizedField
              labelAr="عنوان الهيرو"
              labelEn="Hero title"
              valueAr={form.plansPage.heroTitle.ar}
              valueEn={form.plansPage.heroTitle.en}
              onChangeAr={(value) => updatePlansPageField("heroTitle", "ar", value)}
              onChangeEn={(value) => updatePlansPageField("heroTitle", "en", value)}
              textarea
            />
            <LocalizedField
              labelAr="وصف الهيرو"
              labelEn="Hero description"
              valueAr={form.plansPage.heroDescription.ar}
              valueEn={form.plansPage.heroDescription.en}
              onChangeAr={(value) => updatePlansPageField("heroDescription", "ar", value)}
              onChangeEn={(value) => updatePlansPageField("heroDescription", "en", value)}
              textarea
            />
            <LocalizedField
              labelAr="زر الهيرو الأساسي"
              labelEn="Hero primary CTA"
              valueAr={form.plansPage.heroPrimaryCtaLabel.ar}
              valueEn={form.plansPage.heroPrimaryCtaLabel.en}
              onChangeAr={(value) => updatePlansPageField("heroPrimaryCtaLabel", "ar", value)}
              onChangeEn={(value) => updatePlansPageField("heroPrimaryCtaLabel", "en", value)}
            />
            <LocalizedField
              labelAr="زر الهيرو الثانوي"
              labelEn="Hero secondary CTA"
              valueAr={form.plansPage.heroSecondaryCtaLabel.ar}
              valueEn={form.plansPage.heroSecondaryCtaLabel.en}
              onChangeAr={(value) => updatePlansPageField("heroSecondaryCtaLabel", "ar", value)}
              onChangeEn={(value) => updatePlansPageField("heroSecondaryCtaLabel", "en", value)}
            />
            <LocalizedField
              labelAr="عنوان تفاصيل الباقات"
              labelEn="Breakdown section title"
              valueAr={form.plansPage.breakdownSectionTitle.ar}
              valueEn={form.plansPage.breakdownSectionTitle.en}
              onChangeAr={(value) => updatePlansPageField("breakdownSectionTitle", "ar", value)}
              onChangeEn={(value) => updatePlansPageField("breakdownSectionTitle", "en", value)}
            />
            <LocalizedField
              labelAr="وصف تفاصيل الباقات"
              labelEn="Breakdown section description"
              valueAr={form.plansPage.breakdownSectionDescription.ar}
              valueEn={form.plansPage.breakdownSectionDescription.en}
              onChangeAr={(value) => updatePlansPageField("breakdownSectionDescription", "ar", value)}
              onChangeEn={(value) => updatePlansPageField("breakdownSectionDescription", "en", value)}
              textarea
            />
            <LocalizedField
              labelAr="عنوان الإضافات"
              labelEn="Add-ons section title"
              valueAr={form.plansPage.addonsSectionTitle.ar}
              valueEn={form.plansPage.addonsSectionTitle.en}
              onChangeAr={(value) => updatePlansPageField("addonsSectionTitle", "ar", value)}
              onChangeEn={(value) => updatePlansPageField("addonsSectionTitle", "en", value)}
            />
            <LocalizedField
              labelAr="وصف الإضافات"
              labelEn="Add-ons section description"
              valueAr={form.plansPage.addonsSectionDescription.ar}
              valueEn={form.plansPage.addonsSectionDescription.en}
              onChangeAr={(value) => updatePlansPageField("addonsSectionDescription", "ar", value)}
              onChangeEn={(value) => updatePlansPageField("addonsSectionDescription", "en", value)}
              textarea
            />
            <LocalizedField
              labelAr="عنوان CTA التوصية"
              labelEn="Recommendation CTA title"
              valueAr={form.plansPage.recommendationCtaTitle.ar}
              valueEn={form.plansPage.recommendationCtaTitle.en}
              onChangeAr={(value) => updatePlansPageField("recommendationCtaTitle", "ar", value)}
              onChangeEn={(value) => updatePlansPageField("recommendationCtaTitle", "en", value)}
            />
            <LocalizedField
              labelAr="وصف CTA التوصية"
              labelEn="Recommendation CTA description"
              valueAr={form.plansPage.recommendationCtaDescription.ar}
              valueEn={form.plansPage.recommendationCtaDescription.en}
              onChangeAr={(value) => updatePlansPageField("recommendationCtaDescription", "ar", value)}
              onChangeEn={(value) => updatePlansPageField("recommendationCtaDescription", "en", value)}
              textarea
            />
            <LocalizedField
              labelAr="زر CTA التوصية الأساسي"
              labelEn="Recommendation primary CTA"
              valueAr={form.plansPage.recommendationCtaPrimaryLabel.ar}
              valueEn={form.plansPage.recommendationCtaPrimaryLabel.en}
              onChangeAr={(value) => updatePlansPageField("recommendationCtaPrimaryLabel", "ar", value)}
              onChangeEn={(value) => updatePlansPageField("recommendationCtaPrimaryLabel", "en", value)}
            />
            <LocalizedField
              labelAr="زر CTA التوصية الثانوي"
              labelEn="Recommendation secondary CTA"
              valueAr={form.plansPage.recommendationCtaSecondaryLabel.ar}
              valueEn={form.plansPage.recommendationCtaSecondaryLabel.en}
              onChangeAr={(value) => updatePlansPageField("recommendationCtaSecondaryLabel", "ar", value)}
              onChangeEn={(value) => updatePlansPageField("recommendationCtaSecondaryLabel", "en", value)}
            />
            <LocalizedField
              labelAr="Badge الباقة الأكثر طلبًا"
              labelEn="Most popular badge"
              valueAr={form.plansPage.popularBadge.ar}
              valueEn={form.plansPage.popularBadge.en}
              onChangeAr={(value) => updatePlansPageField("popularBadge", "ar", value)}
              onChangeEn={(value) => updatePlansPageField("popularBadge", "en", value)}
            />
            <LocalizedField
              labelAr="نص زر بطاقة الباقة"
              labelEn="Plan card CTA label"
              valueAr={form.plansPage.planCardPrimaryCtaLabel.ar}
              valueEn={form.plansPage.planCardPrimaryCtaLabel.en}
              onChangeAr={(value) => updatePlansPageField("planCardPrimaryCtaLabel", "ar", value)}
              onChangeEn={(value) => updatePlansPageField("planCardPrimaryCtaLabel", "en", value)}
            />
            </TabsContent>

            <TabsContent value="taglines-addons" className="space-y-6 pt-4">
              <div className="space-y-4">
                <LocalizedField
                  labelAr="Tagline الباقة الأساسية"
                  labelEn="Starter tagline"
                  valueAr={form.plansPage.taglines.basic.ar}
                  valueEn={form.plansPage.taglines.basic.en}
                  onChangeAr={(value) => updateTagline("basic", "ar", value)}
                  onChangeEn={(value) => updateTagline("basic", "en", value)}
                  textarea
                />
                <LocalizedField
                  labelAr="Tagline باقة الأعمال"
                  labelEn="Business tagline"
                  valueAr={form.plansPage.taglines.professional.ar}
                  valueEn={form.plansPage.taglines.professional.en}
                  onChangeAr={(value) => updateTagline("professional", "ar", value)}
                  onChangeEn={(value) => updateTagline("professional", "en", value)}
                  textarea
                />
                <LocalizedField
                  labelAr="Tagline باقة المؤسسات"
                  labelEn="Enterprise tagline"
                  valueAr={form.plansPage.taglines.enterprise.ar}
                  valueEn={form.plansPage.taglines.enterprise.en}
                  onChangeAr={(value) => updateTagline("enterprise", "ar", value)}
                  onChangeEn={(value) => updateTagline("enterprise", "en", value)}
                  textarea
                />
                <LocalizedField
                  labelAr="Tagline الباقة الأكثر طلبًا"
                  labelEn="Most popular tagline"
                  valueAr={form.plansPage.taglines.popular.ar}
                  valueEn={form.plansPage.taglines.popular.en}
                  onChangeAr={(value) => updateTagline("popular", "ar", value)}
                  onChangeEn={(value) => updateTagline("popular", "en", value)}
                  textarea
                />
              </div>

              <div className="space-y-4 rounded-2xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{isAr ? "الإضافات الاختيارية" : "Optional add-ons"}</h3>
                    <p className="text-sm text-muted-foreground">
                      {isAr
                        ? "أضف العناصر التي تظهر في قسم add-ons داخل صفحة الباقات."
                        : "Manage the add-on items shown on the plans page."}
                    </p>
                  </div>
                  <Button variant="outline" onClick={addAddon}>
                    <Plus className="mr-2 h-4 w-4" />
                    {isAr ? "إضافة عنصر" : "Add item"}
                  </Button>
                </div>

                <div className="space-y-4">
                  {form.addons.map((addon, index) => (
                    <div key={`addon-${index}`} className="rounded-2xl border p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h4 className="font-medium">
                          {isAr ? `إضافة رقم ${index + 1}` : `Add-on ${index + 1}`}
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={isAr ? "حذف الإضافة" : "Remove add-on"}
                          onClick={() => removeAddon(index)}
                          disabled={form.addons.length === 1}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <LocalizedField
                        labelAr="نص الإضافة"
                        labelEn="Add-on label"
                        valueAr={addon.ar}
                        valueEn={addon.en}
                        onChangeAr={(value) => updateAddon(index, "ar", value)}
                        onChangeEn={(value) => updateAddon(index, "en", value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "معاينة قبل الحفظ" : "Preview before saving"}</CardTitle>
          <CardDescription>
            {isAr
              ? "معاينة مباشرة للنصوص والـ badges والـ CTA كما ستظهر تقريباً في صفحات الأسعار والباقات بعد الحفظ."
              : "A live approximation of how badges, CTA labels, and pricing copy will look after saving."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pricing-preview" className="w-full">
            <TabsList className="flex h-auto flex-wrap justify-start">
              <TabsTrigger value="pricing-preview">{isAr ? "معاينة الأسعار" : "Pricing preview"}</TabsTrigger>
              <TabsTrigger value="plans-preview">{isAr ? "معاينة الباقات" : "Plans preview"}</TabsTrigger>
            </TabsList>

            <TabsContent value="pricing-preview" className="space-y-4 pt-4">
              <PreviewSection
                eyebrow={isAr ? "أزرار الهيرو" : "Hero actions"}
                title={isAr ? "المدخل السريع لصفحة الأسعار" : "Pricing page entry point"}
                description={isAr
                  ? "هذه هي أزرار الـ hero التي ستقود الزائر إلى المقارنة أو طلب العرض."
                  : "These hero actions drive the visitor to plan details or the demo flow."}>
                <div className="flex flex-wrap gap-3">
                  <Button>{isAr ? form.pricingPage.heroPrimaryCtaLabel.ar : form.pricingPage.heroPrimaryCtaLabel.en}</Button>
                  <Button variant="outline">
                    {isAr ? form.pricingPage.heroSecondaryCtaLabel.ar : form.pricingPage.heroSecondaryCtaLabel.en}
                  </Button>
                </div>
              </PreviewSection>

              <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                <PreviewSection
                  eyebrow={isAr ? "قسم الباقات" : "Plans section"}
                  title={isAr ? form.pricingPage.plansSectionTitle.ar : form.pricingPage.plansSectionTitle.en}
                  description={isAr ? form.pricingPage.plansSectionDescription.ar : form.pricingPage.plansSectionDescription.en}
                />
                <SamplePlanCard
                  title={isAr ? "الأعمال" : "Business"}
                  subtitle={isAr ? "باقة نمو واضحة" : "Growth-ready plan"}
                  badge={isAr ? form.pricingPage.popularBadge.ar : form.pricingPage.popularBadge.en}
                  ctaLabel={isAr ? form.pricingPage.planCardPrimaryCtaLabel.ar : form.pricingPage.planCardPrimaryCtaLabel.en}
                  highlights={isAr
                    ? ["الحضور والانصراف", "الرواتب", "التوظيف"]
                    : ["Attendance", "Payroll", "Recruitment"]}
                />
              </div>

              <PreviewSection
                eyebrow={isAr ? "المقارنة" : "Comparison"}
                title={isAr ? form.pricingPage.comparisonSectionTitle.ar : form.pricingPage.comparisonSectionTitle.en}
                description={isAr ? form.pricingPage.comparisonSectionDescription.ar : form.pricingPage.comparisonSectionDescription.en}>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {isAr ? form.pricingPage.comparisonFootnote.ar : form.pricingPage.comparisonFootnote.en}
                  </Badge>
                </div>
              </PreviewSection>

              <PreviewCtaBlock
                title={isAr ? form.pricingPage.customCtaTitle.ar : form.pricingPage.customCtaTitle.en}
                description={isAr ? form.pricingPage.customCtaDescription.ar : form.pricingPage.customCtaDescription.en}
                primaryLabel={isAr ? form.pricingPage.customCtaPrimaryLabel.ar : form.pricingPage.customCtaPrimaryLabel.en}
                secondaryLabel={isAr ? form.pricingPage.customCtaSecondaryLabel.ar : form.pricingPage.customCtaSecondaryLabel.en}
              />
            </TabsContent>

            <TabsContent value="plans-preview" className="space-y-4 pt-4">
              <PreviewSection
                eyebrow={isAr ? form.plansPage.heroBadge.ar : form.plansPage.heroBadge.en}
                title={isAr ? form.plansPage.heroTitle.ar : form.plansPage.heroTitle.en}
                description={isAr ? form.plansPage.heroDescription.ar : form.plansPage.heroDescription.en}>
                <div className="flex flex-wrap gap-3">
                  <Button>{isAr ? form.plansPage.heroPrimaryCtaLabel.ar : form.plansPage.heroPrimaryCtaLabel.en}</Button>
                  <Button variant="outline">
                    {isAr ? form.plansPage.heroSecondaryCtaLabel.ar : form.plansPage.heroSecondaryCtaLabel.en}
                  </Button>
                </div>
              </PreviewSection>

              <PreviewSection
                eyebrow={isAr ? "تفاصيل الباقات" : "Plan breakdown"}
                title={isAr ? form.plansPage.breakdownSectionTitle.ar : form.plansPage.breakdownSectionTitle.en}
                description={isAr ? form.plansPage.breakdownSectionDescription.ar : form.plansPage.breakdownSectionDescription.en}
              />

              <div className="grid gap-4 lg:grid-cols-3">
                <SamplePlanCard
                  title={isAr ? "الأساسية" : "Starter"}
                  subtitle={isAr ? form.plansPage.taglines.basic.ar : form.plansPage.taglines.basic.en}
                  ctaLabel={isAr ? form.plansPage.planCardPrimaryCtaLabel.ar : form.plansPage.planCardPrimaryCtaLabel.en}
                  highlights={isAr
                    ? ["ملفات الموظفين", "الإجازات", "التقارير الأساسية"]
                    : ["Employee profiles", "Leave management", "Core reports"]}
                />
                <SamplePlanCard
                  title={isAr ? "الأعمال" : "Business"}
                  subtitle={isAr ? form.plansPage.taglines.popular.ar : form.plansPage.taglines.popular.en}
                  badge={isAr ? form.plansPage.popularBadge.ar : form.plansPage.popularBadge.en}
                  ctaLabel={isAr ? form.plansPage.planCardPrimaryCtaLabel.ar : form.plansPage.planCardPrimaryCtaLabel.en}
                  highlights={isAr
                    ? ["الرواتب", "WPS", "التوظيف"]
                    : ["Payroll", "WPS", "Recruitment"]}
                />
                <SamplePlanCard
                  title={isAr ? "المؤسسات" : "Enterprise"}
                  subtitle={isAr ? form.plansPage.taglines.enterprise.ar : form.plansPage.taglines.enterprise.en}
                  ctaLabel={isAr ? form.plansPage.planCardPrimaryCtaLabel.ar : form.plansPage.planCardPrimaryCtaLabel.en}
                  highlights={isAr
                    ? ["التكاملات الخاصة", "API", "SLA"]
                    : ["Custom integrations", "API access", "SLA"]}
                />
              </div>

              <PreviewSection
                eyebrow={isAr ? "الإضافات" : "Add-ons"}
                title={isAr ? form.plansPage.addonsSectionTitle.ar : form.plansPage.addonsSectionTitle.en}
                description={isAr ? form.plansPage.addonsSectionDescription.ar : form.plansPage.addonsSectionDescription.en}>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {form.addons.map((addon, index) => (
                    <div key={`preview-addon-${index}`} className="rounded-2xl border bg-background p-4 text-sm">
                      {isAr ? addon.ar : addon.en}
                    </div>
                  ))}
                </div>
              </PreviewSection>

              <PreviewCtaBlock
                title={isAr ? form.plansPage.recommendationCtaTitle.ar : form.plansPage.recommendationCtaTitle.en}
                description={isAr ? form.plansPage.recommendationCtaDescription.ar : form.plansPage.recommendationCtaDescription.en}
                primaryLabel={isAr ? form.plansPage.recommendationCtaPrimaryLabel.ar : form.plansPage.recommendationCtaPrimaryLabel.en}
                secondaryLabel={isAr ? form.plansPage.recommendationCtaSecondaryLabel.ar : form.plansPage.recommendationCtaSecondaryLabel.en}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function LocalizedField({
  labelAr,
  labelEn,
  valueAr,
  valueEn,
  onChangeAr,
  onChangeEn,
  textarea = false
}: {
  labelAr: string;
  labelEn: string;
  valueAr: string;
  valueEn: string;
  onChangeAr: (value: string) => void;
  onChangeEn: (value: string) => void;
  textarea?: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label>{labelAr}</Label>
        {textarea ? (
          <Textarea value={valueAr} onChange={(event) => onChangeAr(event.target.value)} rows={4} />
        ) : (
          <Input value={valueAr} onChange={(event) => onChangeAr(event.target.value)} />
        )}
      </div>
      <div className="space-y-2">
        <Label>{labelEn}</Label>
        {textarea ? (
          <Textarea value={valueEn} onChange={(event) => onChangeEn(event.target.value)} rows={4} />
        ) : (
          <Input value={valueEn} onChange={(event) => onChangeEn(event.target.value)} />
        )}
      </div>
    </div>
  );
}

function PreviewSection({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border bg-muted/20 p-5">
      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">{eyebrow}</p>
      <h3 className="mt-3 text-xl font-semibold leading-tight">{title}</h3>
      <p className="text-muted-foreground mt-2 text-sm leading-6">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

function SamplePlanCard({
  title,
  subtitle,
  badge,
  ctaLabel,
  highlights
}: {
  title: string;
  subtitle: string;
  badge?: string;
  ctaLabel: string;
  highlights: string[];
}) {
  return (
    <div className="relative rounded-3xl border bg-background p-5 shadow-sm">
      {badge ? (
        <div className="absolute end-5 top-5">
          <Badge>{badge}</Badge>
        </div>
      ) : null}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-primary mt-2 text-sm font-medium">{subtitle}</p>
      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
        {highlights.map((highlight) => (
          <li key={highlight}>• {highlight}</li>
        ))}
      </ul>
      <Button className="mt-5 w-full">{ctaLabel}</Button>
    </div>
  );
}

function PreviewCtaBlock({
  title,
  description,
  primaryLabel,
  secondaryLabel
}: {
  title: string;
  description: string;
  primaryLabel: string;
  secondaryLabel: string;
}) {
  return (
    <div className="rounded-[2rem] border bg-card/90 p-6 text-center shadow-sm">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-3 text-sm leading-6">{description}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button>{primaryLabel}</Button>
        <Button variant="outline">{secondaryLabel}</Button>
      </div>
    </div>
  );
}