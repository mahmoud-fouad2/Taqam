"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { PlatformSiteContent } from "@/lib/marketing/site-content";

const emptyState: PlatformSiteContent = {
  siteNameAr: "",
  siteNameEn: "",
  defaultDescriptionAr: "",
  defaultDescriptionEn: "",
  defaultKeywordsAr: [],
  defaultKeywordsEn: [],
  home: {
    badge: { ar: "", en: "" },
    title: { ar: "", en: "" },
    description: { ar: "", en: "" },
    primaryCtaLabel: { ar: "", en: "" },
    primaryCtaHref: ""
  },
  pricing: {
    badge: { ar: "", en: "" },
    title: { ar: "", en: "" },
    description: { ar: "", en: "" }
  },
  careers: {
    badge: { ar: "", en: "" },
    title: { ar: "", en: "" },
    description: { ar: "", en: "" }
  },
  requestDemo: {
    badge: { ar: "", en: "" },
    title: { ar: "", en: "" },
    description: { ar: "", en: "" },
    formTitle: { ar: "", en: "" },
    formDescription: { ar: "", en: "" },
    sideTitle: { ar: "", en: "" },
    sideDescription: { ar: "", en: "" },
    secondaryCtaTitle: { ar: "", en: "" },
    secondaryCtaDescription: { ar: "", en: "" },
    secondaryCtaLabel: { ar: "", en: "" },
    highlights: [
      {
        title: { ar: "", en: "" },
        description: { ar: "", en: "" }
      },
      {
        title: { ar: "", en: "" },
        description: { ar: "", en: "" }
      },
      {
        title: { ar: "", en: "" },
        description: { ar: "", en: "" }
      }
    ]
  }
};

type SectionKey = "home" | "pricing" | "careers";
type LocalizedFieldKey = "badge" | "title" | "description" | "primaryCtaLabel";
type RequestDemoFieldKey = Exclude<keyof PlatformSiteContent["requestDemo"], "highlights">;
type LocalizedFieldValue = { ar: string; en: string };
type LocalizedSection = {
  badge: LocalizedFieldValue;
  title: LocalizedFieldValue;
  description: LocalizedFieldValue;
  primaryCtaLabel?: LocalizedFieldValue;
};

function toCsv(value: string[]) {
  return value.join(", ");
}

function fromCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function SiteContentManager({ locale }: { locale: "ar" | "en" }) {
  const isAr = locale === "ar";
  const [form, setForm] = useState<PlatformSiteContent>(emptyState);
  const [keywordsAr, setKeywordsAr] = useState("");
  const [keywordsEn, setKeywordsEn] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const [lastPublishedAt, setLastPublishedAt] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setMessage("");
      try {
        const response = await fetch("/api/super-admin/site-content", { cache: "no-store" });
        const json = await response.json();

        if (!active) {
          return;
        }

        if (!response.ok || !json.data) {
          setMessage(isAr ? "تعذر تحميل المحتوى الحالي." : "Unable to load current content.");
          setLoading(false);
          return;
        }

        setForm(json.data);
        setKeywordsAr(toCsv(json.data.defaultKeywordsAr));
        setKeywordsEn(toCsv(json.data.defaultKeywordsEn));
        setHasUnpublishedChanges(Boolean(json.hasUnpublishedChanges));
        setLastDraftSavedAt(
          typeof json.lastDraftSavedAt === "string" ? json.lastDraftSavedAt : null
        );
        setLastPublishedAt(typeof json.lastPublishedAt === "string" ? json.lastPublishedAt : null);
        setLoading(false);
      } catch {
        if (!active) {
          return;
        }

        setMessage(
          isAr ? "حدث خطأ أثناء تحميل المحتوى." : "An error occurred while loading content."
        );
        setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [isAr]);

  function updateField<K extends keyof PlatformSiteContent>(key: K, value: PlatformSiteContent[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateLocalizedSection(
    section: SectionKey,
    field: LocalizedFieldKey,
    lang: "ar" | "en",
    value: string
  ) {
    setForm((current) => {
      const currentSection = current[section] as LocalizedSection;
      const currentField = currentSection[field];

      if (!currentField) {
        return current;
      }

      return {
        ...current,
        [section]: {
          ...currentSection,
          [field]: {
            ...currentField,
            [lang]: value
          }
        }
      };
    });
  }

  function updateRequestDemoField(field: RequestDemoFieldKey, lang: "ar" | "en", value: string) {
    setForm((current) => ({
      ...current,
      requestDemo: {
        ...current.requestDemo,
        [field]: {
          ...current.requestDemo[field],
          [lang]: value
        }
      }
    }));
  }

  function updateRequestDemoHighlight(
    index: number,
    field: "title" | "description",
    lang: "ar" | "en",
    value: string
  ) {
    setForm((current) => ({
      ...current,
      requestDemo: {
        ...current.requestDemo,
        highlights: current.requestDemo.highlights.map((highlight, highlightIndex) =>
          highlightIndex === index
            ? {
                ...highlight,
                [field]: {
                  ...highlight[field],
                  [lang]: value
                }
              }
            : highlight
        )
      }
    }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");

    const payload: PlatformSiteContent = {
      ...form,
      defaultKeywordsAr: fromCsv(keywordsAr),
      defaultKeywordsEn: fromCsv(keywordsEn)
    };

    try {
      const response = await fetch("/api/super-admin/site-content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const json = await response.json();

      if (!response.ok || !json.data) {
        setSaving(false);
        setMessage(json.error ?? (isAr ? "تعذر حفظ التعديلات." : "Unable to save changes."));
        return;
      }

      setForm(json.data);
      setKeywordsAr(toCsv(json.data.defaultKeywordsAr));
      setKeywordsEn(toCsv(json.data.defaultKeywordsEn));
      setHasUnpublishedChanges(Boolean(json.hasUnpublishedChanges));
      setLastDraftSavedAt(typeof json.lastDraftSavedAt === "string" ? json.lastDraftSavedAt : null);
      setLastPublishedAt(typeof json.lastPublishedAt === "string" ? json.lastPublishedAt : null);
      setSaving(false);
      setMessage(isAr ? "تم حفظ المسودة بنجاح." : "Draft saved successfully.");
    } catch {
      setSaving(false);
      setMessage(isAr ? "حدث خطأ أثناء حفظ التعديلات." : "An error occurred while saving changes.");
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setMessage("");

    try {
      const response = await fetch("/api/super-admin/site-content/publish", {
        method: "POST"
      });
      const json = await response.json();

      if (!response.ok || !json.data) {
        setPublishing(false);
        setMessage(json.error ?? (isAr ? "تعذر نشر التعديلات." : "Unable to publish changes."));
        return;
      }

      setForm(json.data);
      setKeywordsAr(toCsv(json.data.defaultKeywordsAr));
      setKeywordsEn(toCsv(json.data.defaultKeywordsEn));
      setHasUnpublishedChanges(Boolean(json.hasUnpublishedChanges));
      setLastDraftSavedAt(typeof json.lastDraftSavedAt === "string" ? json.lastDraftSavedAt : null);
      setLastPublishedAt(typeof json.lastPublishedAt === "string" ? json.lastPublishedAt : null);
      setPublishing(false);
      setMessage(isAr ? "تم نشر المحتوى العام بنجاح." : "Public content published successfully.");
    } catch {
      setPublishing(false);
      setMessage(
        isAr ? "حدث خطأ أثناء نشر التعديلات." : "An error occurred while publishing changes."
      );
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="text-muted-foreground p-6 text-sm">
          {isAr ? "جاري تحميل المحتوى..." : "Loading content..."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "إدارة النصوص والهوية" : "Copy and identity controls"}</CardTitle>
          <CardDescription>
            {isAr
              ? "حدّث النصوص العربية والإنجليزية لكل قسم، ثم احفظ لتنعكس على الصفحات العامة والميتاداتا."
              : "Update Arabic and English copy per section, then save to reflect it across public pages and metadata."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="siteNameAr">
                {isAr ? "اسم المنصة بالعربية" : "Arabic site name"}
              </Label>
              <Input
                id="siteNameAr"
                value={form.siteNameAr}
                onChange={(event) => updateField("siteNameAr", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteNameEn">
                {isAr ? "اسم المنصة بالإنجليزية" : "English site name"}
              </Label>
              <Input
                id="siteNameEn"
                value={form.siteNameEn}
                onChange={(event) => updateField("siteNameEn", event.target.value)}
              />
            </div>
          </div>

          <Tabs defaultValue="home" className="w-full">
            <TabsList className="flex h-auto flex-wrap justify-start">
              <TabsTrigger value="home">{isAr ? "الرئيسية" : "Home"}</TabsTrigger>
              <TabsTrigger value="pricing">{isAr ? "الأسعار" : "Pricing"}</TabsTrigger>
              <TabsTrigger value="careers">{isAr ? "الوظائف" : "Careers"}</TabsTrigger>
              <TabsTrigger value="request-demo">{isAr ? "طلب العرض" : "Request demo"}</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="home" className="space-y-4 pt-4">
              <LocalizedField
                labelAr="شارة القسم"
                labelEn="Badge"
                valueAr={form.home.badge.ar}
                valueEn={form.home.badge.en}
                onChangeAr={(value) => updateLocalizedSection("home", "badge", "ar", value)}
                onChangeEn={(value) => updateLocalizedSection("home", "badge", "en", value)}
              />
              <LocalizedField
                labelAr="العنوان الرئيسي"
                labelEn="Hero title"
                valueAr={form.home.title.ar}
                valueEn={form.home.title.en}
                onChangeAr={(value) => updateLocalizedSection("home", "title", "ar", value)}
                onChangeEn={(value) => updateLocalizedSection("home", "title", "en", value)}
                textarea
              />
              <LocalizedField
                labelAr="الوصف"
                labelEn="Description"
                valueAr={form.home.description.ar}
                valueEn={form.home.description.en}
                onChangeAr={(value) => updateLocalizedSection("home", "description", "ar", value)}
                onChangeEn={(value) => updateLocalizedSection("home", "description", "en", value)}
                textarea
              />
              <LocalizedField
                labelAr="نص الزر الأساسي"
                labelEn="Primary CTA label"
                valueAr={form.home.primaryCtaLabel.ar}
                valueEn={form.home.primaryCtaLabel.en}
                onChangeAr={(value) =>
                  updateLocalizedSection("home", "primaryCtaLabel", "ar", value)
                }
                onChangeEn={(value) =>
                  updateLocalizedSection("home", "primaryCtaLabel", "en", value)
                }
              />
              <div className="space-y-2">
                <Label htmlFor="homeCtaHref">
                  {isAr ? "رابط الزر الأساسي" : "Primary CTA href"}
                </Label>
                <Input
                  id="homeCtaHref"
                  value={form.home.primaryCtaHref}
                  onChange={(event) =>
                    updateField("home", { ...form.home, primaryCtaHref: event.target.value })
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 pt-4">
              <LocalizedField
                labelAr="شارة القسم"
                labelEn="Badge"
                valueAr={form.pricing.badge.ar}
                valueEn={form.pricing.badge.en}
                onChangeAr={(value) => updateLocalizedSection("pricing", "badge", "ar", value)}
                onChangeEn={(value) => updateLocalizedSection("pricing", "badge", "en", value)}
              />
              <LocalizedField
                labelAr="العنوان"
                labelEn="Title"
                valueAr={form.pricing.title.ar}
                valueEn={form.pricing.title.en}
                onChangeAr={(value) => updateLocalizedSection("pricing", "title", "ar", value)}
                onChangeEn={(value) => updateLocalizedSection("pricing", "title", "en", value)}
              />
              <LocalizedField
                labelAr="الوصف"
                labelEn="Description"
                valueAr={form.pricing.description.ar}
                valueEn={form.pricing.description.en}
                onChangeAr={(value) =>
                  updateLocalizedSection("pricing", "description", "ar", value)
                }
                onChangeEn={(value) =>
                  updateLocalizedSection("pricing", "description", "en", value)
                }
                textarea
              />
            </TabsContent>

            <TabsContent value="careers" className="space-y-4 pt-4">
              <LocalizedField
                labelAr="شارة القسم"
                labelEn="Badge"
                valueAr={form.careers.badge.ar}
                valueEn={form.careers.badge.en}
                onChangeAr={(value) => updateLocalizedSection("careers", "badge", "ar", value)}
                onChangeEn={(value) => updateLocalizedSection("careers", "badge", "en", value)}
              />
              <LocalizedField
                labelAr="العنوان"
                labelEn="Title"
                valueAr={form.careers.title.ar}
                valueEn={form.careers.title.en}
                onChangeAr={(value) => updateLocalizedSection("careers", "title", "ar", value)}
                onChangeEn={(value) => updateLocalizedSection("careers", "title", "en", value)}
              />
              <LocalizedField
                labelAr="الوصف"
                labelEn="Description"
                valueAr={form.careers.description.ar}
                valueEn={form.careers.description.en}
                onChangeAr={(value) =>
                  updateLocalizedSection("careers", "description", "ar", value)
                }
                onChangeEn={(value) =>
                  updateLocalizedSection("careers", "description", "en", value)
                }
                textarea
              />
            </TabsContent>

            <TabsContent value="request-demo" className="space-y-4 pt-4">
              <LocalizedField
                labelAr="شارة القسم"
                labelEn="Badge"
                valueAr={form.requestDemo.badge.ar}
                valueEn={form.requestDemo.badge.en}
                onChangeAr={(value) => updateRequestDemoField("badge", "ar", value)}
                onChangeEn={(value) => updateRequestDemoField("badge", "en", value)}
              />
              <LocalizedField
                labelAr="العنوان"
                labelEn="Title"
                valueAr={form.requestDemo.title.ar}
                valueEn={form.requestDemo.title.en}
                onChangeAr={(value) => updateRequestDemoField("title", "ar", value)}
                onChangeEn={(value) => updateRequestDemoField("title", "en", value)}
                textarea
              />
              <LocalizedField
                labelAr="الوصف"
                labelEn="Description"
                valueAr={form.requestDemo.description.ar}
                valueEn={form.requestDemo.description.en}
                onChangeAr={(value) => updateRequestDemoField("description", "ar", value)}
                onChangeEn={(value) => updateRequestDemoField("description", "en", value)}
                textarea
              />
              <LocalizedField
                labelAr="عنوان النموذج"
                labelEn="Form title"
                valueAr={form.requestDemo.formTitle.ar}
                valueEn={form.requestDemo.formTitle.en}
                onChangeAr={(value) => updateRequestDemoField("formTitle", "ar", value)}
                onChangeEn={(value) => updateRequestDemoField("formTitle", "en", value)}
              />
              <LocalizedField
                labelAr="وصف النموذج"
                labelEn="Form description"
                valueAr={form.requestDemo.formDescription.ar}
                valueEn={form.requestDemo.formDescription.en}
                onChangeAr={(value) => updateRequestDemoField("formDescription", "ar", value)}
                onChangeEn={(value) => updateRequestDemoField("formDescription", "en", value)}
                textarea
              />
              <LocalizedField
                labelAr="عنوان العمود الجانبي"
                labelEn="Sidebar title"
                valueAr={form.requestDemo.sideTitle.ar}
                valueEn={form.requestDemo.sideTitle.en}
                onChangeAr={(value) => updateRequestDemoField("sideTitle", "ar", value)}
                onChangeEn={(value) => updateRequestDemoField("sideTitle", "en", value)}
              />
              <LocalizedField
                labelAr="وصف العمود الجانبي"
                labelEn="Sidebar description"
                valueAr={form.requestDemo.sideDescription.ar}
                valueEn={form.requestDemo.sideDescription.en}
                onChangeAr={(value) => updateRequestDemoField("sideDescription", "ar", value)}
                onChangeEn={(value) => updateRequestDemoField("sideDescription", "en", value)}
                textarea
              />
              <LocalizedField
                labelAr="عنوان الدعوة الثانوية"
                labelEn="Secondary CTA title"
                valueAr={form.requestDemo.secondaryCtaTitle.ar}
                valueEn={form.requestDemo.secondaryCtaTitle.en}
                onChangeAr={(value) => updateRequestDemoField("secondaryCtaTitle", "ar", value)}
                onChangeEn={(value) => updateRequestDemoField("secondaryCtaTitle", "en", value)}
              />
              <LocalizedField
                labelAr="وصف الدعوة الثانوية"
                labelEn="Secondary CTA description"
                valueAr={form.requestDemo.secondaryCtaDescription.ar}
                valueEn={form.requestDemo.secondaryCtaDescription.en}
                onChangeAr={(value) =>
                  updateRequestDemoField("secondaryCtaDescription", "ar", value)
                }
                onChangeEn={(value) =>
                  updateRequestDemoField("secondaryCtaDescription", "en", value)
                }
                textarea
              />
              <LocalizedField
                labelAr="نص زر الدعوة الثانوية"
                labelEn="Secondary CTA label"
                valueAr={form.requestDemo.secondaryCtaLabel.ar}
                valueEn={form.requestDemo.secondaryCtaLabel.en}
                onChangeAr={(value) => updateRequestDemoField("secondaryCtaLabel", "ar", value)}
                onChangeEn={(value) => updateRequestDemoField("secondaryCtaLabel", "en", value)}
              />
              <div className="space-y-4 rounded-2xl border border-dashed p-4">
                <div>
                  <h3 className="text-sm font-semibold">
                    {isAr ? "نقاط الثقة السريعة" : "Quick trust highlights"}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {isAr
                      ? "ثلاث نقاط مختصرة تظهر بجوار نموذج طلب العرض."
                      : "Three concise points shown alongside the request-demo form."}
                  </p>
                </div>
                {form.requestDemo.highlights.map((highlight, index) => (
                  <div key={index} className="space-y-3 rounded-xl border p-4">
                    <LocalizedField
                      labelAr={`عنوان النقطة ${index + 1}`}
                      labelEn={`Highlight ${index + 1} title`}
                      valueAr={highlight.title.ar}
                      valueEn={highlight.title.en}
                      onChangeAr={(value) =>
                        updateRequestDemoHighlight(index, "title", "ar", value)
                      }
                      onChangeEn={(value) =>
                        updateRequestDemoHighlight(index, "title", "en", value)
                      }
                    />
                    <LocalizedField
                      labelAr={`وصف النقطة ${index + 1}`}
                      labelEn={`Highlight ${index + 1} description`}
                      valueAr={highlight.description.ar}
                      valueEn={highlight.description.en}
                      onChangeAr={(value) =>
                        updateRequestDemoHighlight(index, "description", "ar", value)
                      }
                      onChangeEn={(value) =>
                        updateRequestDemoHighlight(index, "description", "en", value)
                      }
                      textarea
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4 pt-4">
              <LocalizedField
                labelAr="الوصف الافتراضي"
                labelEn="Default description"
                valueAr={form.defaultDescriptionAr}
                valueEn={form.defaultDescriptionEn}
                onChangeAr={(value) => updateField("defaultDescriptionAr", value)}
                onChangeEn={(value) => updateField("defaultDescriptionEn", value)}
                textarea
              />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="keywordsAr">
                    {isAr ? "كلمات مفتاحية عربية" : "Arabic keywords"}
                  </Label>
                  <Textarea
                    id="keywordsAr"
                    value={keywordsAr}
                    onChange={(event) => setKeywordsAr(event.target.value)}
                    rows={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keywordsEn">
                    {isAr ? "كلمات مفتاحية إنجليزية" : "English keywords"}
                  </Label>
                  <Textarea
                    id="keywordsEn"
                    value={keywordsEn}
                    onChange={(event) => setKeywordsEn(event.target.value)}
                    rows={5}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 text-sm">
              <p className="font-medium">
                {message ||
                  (hasUnpublishedChanges
                    ? isAr
                      ? "هناك مسودة غير منشورة."
                      : "There are unpublished draft changes."
                    : isAr
                      ? "النسخة المنشورة متطابقة مع المسودة الحالية."
                      : "The published version matches the current draft.")}
              </p>
              <p className="text-muted-foreground">
                {isAr ? "آخر حفظ للمسودة:" : "Last draft save:"}{" "}
                {lastDraftSavedAt ?? (isAr ? "غير متوفر" : "Not available")}
              </p>
              <p className="text-muted-foreground">
                {isAr ? "آخر نشر:" : "Last published:"}{" "}
                {lastPublishedAt ?? (isAr ? "غير متوفر" : "Not available")}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={handleSave} disabled={saving || publishing} variant="outline">
                {saving
                  ? isAr
                    ? "جاري حفظ المسودة..."
                    : "Saving draft..."
                  : isAr
                    ? "حفظ كمسودة"
                    : "Save draft"}
              </Button>
              <Button
                onClick={handlePublish}
                disabled={saving || publishing || !hasUnpublishedChanges}>
                {publishing
                  ? isAr
                    ? "جارٍ النشر..."
                    : "Publishing..."
                  : isAr
                    ? "نشر التعديلات"
                    : "Publish changes"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "معاينة سريعة" : "Quick preview"}</CardTitle>
          <CardDescription>
            {isAr
              ? "لقطة تقريبية لما سيظهر في الصفحات العامة."
              : "A rough glance at what will appear across public pages."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <PreviewBlock
            title={isAr ? "الرئيسية" : "Home"}
            badge={locale === "ar" ? form.home.badge.ar : form.home.badge.en}
            heading={locale === "ar" ? form.home.title.ar : form.home.title.en}
            description={locale === "ar" ? form.home.description.ar : form.home.description.en}
          />
          <PreviewBlock
            title={isAr ? "الأسعار" : "Pricing"}
            badge={locale === "ar" ? form.pricing.badge.ar : form.pricing.badge.en}
            heading={locale === "ar" ? form.pricing.title.ar : form.pricing.title.en}
            description={
              locale === "ar" ? form.pricing.description.ar : form.pricing.description.en
            }
          />
          <PreviewBlock
            title={isAr ? "الوظائف" : "Careers"}
            badge={locale === "ar" ? form.careers.badge.ar : form.careers.badge.en}
            heading={locale === "ar" ? form.careers.title.ar : form.careers.title.en}
            description={
              locale === "ar" ? form.careers.description.ar : form.careers.description.en
            }
          />
          <PreviewBlock
            title={isAr ? "طلب العرض" : "Request demo"}
            badge={locale === "ar" ? form.requestDemo.badge.ar : form.requestDemo.badge.en}
            heading={locale === "ar" ? form.requestDemo.title.ar : form.requestDemo.title.en}
            description={
              locale === "ar" ? form.requestDemo.description.ar : form.requestDemo.description.en
            }
          />
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
          <Textarea value={valueAr} onChange={(event) => onChangeAr(event.target.value)} />
        ) : (
          <Input value={valueAr} onChange={(event) => onChangeAr(event.target.value)} />
        )}
      </div>
      <div className="space-y-2">
        <Label>{labelEn}</Label>
        {textarea ? (
          <Textarea value={valueEn} onChange={(event) => onChangeEn(event.target.value)} />
        ) : (
          <Input value={valueEn} onChange={(event) => onChangeEn(event.target.value)} />
        )}
      </div>
    </div>
  );
}

function PreviewBlock({
  title,
  badge,
  heading,
  description
}: {
  title: string;
  badge: string;
  heading: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border p-4">
      <p className="text-muted-foreground mb-2 text-xs tracking-[0.2em] uppercase">{title}</p>
      <p className="text-primary text-xs font-semibold">{badge}</p>
      <h3 className="mt-2 font-semibold">{heading}</h3>
      <p className="text-muted-foreground mt-2 text-sm leading-6">{description}</p>
    </div>
  );
}
