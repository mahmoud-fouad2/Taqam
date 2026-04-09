"use client";

import * as React from "react";
import { toast } from "sonner";
import dynamic from "next/dynamic";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const LocationPickerMap = dynamic(() => import("@/components/maps/location-picker-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[280px] w-full rounded-md border bg-muted/30" />
  ),
});

type Locale = "ar" | "en";

type Policy = {
  tenantId: string;
  enforceGeofence: boolean;
  allowCheckInWithoutLocation: boolean;
  maxAccuracyMeters: number;
};

type WorkLocation = {
  id: string;
  name: string;
  nameAr: string | null;
  address: string | null;
  lat: string; // Prisma Decimal serialized
  lng: string; // Prisma Decimal serialized
  radiusMeters: number;
  isActive: boolean;
  createdAt: string;
};

function pickText(locale: Locale, ar: string, en: string) {
  return locale === "ar" ? ar : en;
}

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

export default function AttendanceSettingsClient({ locale: _locale }: { locale: Locale }) {
  const locale = useClientLocale();
  const t = getText(locale);
  const [loading, setLoading] = React.useState(true);
  const [savingPolicy, setSavingPolicy] = React.useState(false);
  const [policy, setPolicy] = React.useState<Policy | null>(null);
  const [locations, setLocations] = React.useState<WorkLocation[]>([]);

  const [openCreate, setOpenCreate] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [locationToDelete, setLocationToDelete] = React.useState<WorkLocation | null>(null);

  const [form, setForm] = React.useState({
    name: "",
    nameAr: "",
    address: "",
    lat: "",
    lng: "",
    radiusMeters: "150",
    isActive: true,
  });

  const loadAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, lRes] = await Promise.all([
        fetch("/api/attendance/policy", { cache: "no-store" }),
        fetch("/api/attendance/locations", { cache: "no-store" }),
      ]);

      const pJson = await pRes.json().catch(() => null);
      const lJson = await lRes.json().catch(() => null);

      if (pRes.ok) {
        setPolicy(pJson?.data ?? null);
      } else {
        toast.error(pJson?.error ?? pickText(locale, t.attendance.loadPolicyFailed, "Failed to load policy."));
      }

      if (lRes.ok) {
        setLocations(lJson?.data?.items ?? []);
      } else {
        toast.error(lJson?.error ?? pickText(locale, t.attendance.loadLocationsFailed, "Failed to load locations."));
      }
    } finally {
      setLoading(false);
    }
  }, [locale, t.attendance.loadLocationsFailed, t.attendance.loadPolicyFailed]);

  React.useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function savePolicy() {
    if (!policy) return;
    setSavingPolicy(true);
    try {
      const res = await fetch("/api/attendance/policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enforceGeofence: policy.enforceGeofence,
          allowCheckInWithoutLocation: policy.allowCheckInWithoutLocation,
          maxAccuracyMeters: policy.maxAccuracyMeters,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        toast.error(
          json?.error ??
            pickText(locale, t.attendance.savePolicyFailed, "Failed to save policy.")
        );
        return;
      }

      await loadAll();
      toast.success(pickText(locale, "تم حفظ السياسة بنجاح.", "Policy saved."));
    } finally {
      setSavingPolicy(false);
    }
  }

  async function createLocation() {
    setCreating(true);
    try {
      const res = await fetch("/api/attendance/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          nameAr: form.nameAr || undefined,
          address: form.address || undefined,
          lat: form.lat,
          lng: form.lng,
          radiusMeters: form.radiusMeters,
          isActive: form.isActive,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(
          json?.error ??
            pickText(locale, "تعذر إنشاء الموقع.", "Failed to create location.")
        );
        return;
      }

      setOpenCreate(false);
      setForm({
        name: "",
        nameAr: "",
        address: "",
        lat: "",
        lng: "",
        radiusMeters: "150",
        isActive: true,
      });
      await loadAll();
      toast.success(pickText(locale, t.attendance.locationCreated, "Location created."));
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch(`/api/attendance/locations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      toast.error(
        json?.error ?? pickText(locale, t.attendance.updateFailed, "Failed to update.")
      );
      return;
    }
    await loadAll();
    toast.success(
      current
        ? pickText(locale, t.attendance.locationDisabled, "Location disabled.")
        : pickText(locale, t.attendance.locationEnabled, "Location enabled.")
    );
  }

  async function deleteLocation(id: string) {
    setLocationToDelete(locations.find((l) => l.id === id) ?? null);
  }

  async function handleDeleteConfirmed() {
    if (!locationToDelete) return;
    const id = locationToDelete.id;
    setLocationToDelete(null);
    const res = await fetch(`/api/attendance/locations/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      toast.error(json?.error ?? pickText(locale, t.attendance.deleteFailed, "Failed to delete."));
      return;
    }
    await loadAll();
    toast.success(pickText(locale, t.attendance.locationDeleted, "Location deleted."));
  }

  const isRtl = locale === "ar";

  return (
    <>
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-start">
          {pickText(locale, "الحضور والموقع", "Attendance & Location")}
        </h3>
        <p className="text-sm text-muted-foreground text-start">
          {pickText(
            locale,
            "حدد أماكن العمل المسموح بها للبصمة (Geofence) وسياسات دقة الموقع.",
            "Configure allowed work locations (geofence) and location accuracy policies."
          )}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-start">
            {pickText(locale, "سياسة الحضور", "Attendance Policy")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading || !policy ? (
            <div className="text-sm text-muted-foreground">
              {pickText(locale, t.common.loading, "Loading...")}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rtl:lg:flex-row-reverse">
                <div className="space-y-1">
                  <div className="font-medium text-start">
                    {pickText(locale, "تفعيل التحقق من المكان", "Enforce Geofence")}
                  </div>
                  <div className="text-sm text-muted-foreground text-start">
                    {pickText(
                      locale,
                      "لن يسمح بتسجيل الحضور إلا من داخل المواقع المحددة.",
                      "Attendance will be allowed only inside configured locations."
                    )}
                  </div>
                </div>
                <Switch
                  checked={policy.enforceGeofence}
                  onCheckedChange={(v) =>
                    setPolicy((p) => (p ? { ...p, enforceGeofence: v } : p))
                  }
                />
              </div>

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rtl:lg:flex-row-reverse">
                <div className="space-y-1">
                  <div className="font-medium text-start">
                    {pickText(locale, "السماح بدون موقع", "Allow Without Location")}
                  </div>
                  <div className="text-sm text-muted-foreground text-start">
                    {pickText(
                      locale,
                      "يسمح بتسجيل الحضور حتى لو لم يرسل الجهاز GPS (مفيد للويب).",
                      "Allow attendance even if no GPS is provided (useful for web)."
                    )}
                  </div>
                </div>
                <Switch
                  checked={policy.allowCheckInWithoutLocation}
                  onCheckedChange={(v) =>
                    setPolicy((p) =>
                      p ? { ...p, allowCheckInWithoutLocation: v } : p
                    )
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-start">
                  {pickText(locale, "الحد الأقصى لدقة الموقع (متر)", "Max Location Accuracy (meters)")}
                </Label>
                <Input
                  inputMode="numeric"
                  value={policy.maxAccuracyMeters}
                  onChange={(e) =>
                    setPolicy((p) =>
                      p
                        ? {
                            ...p,
                            maxAccuracyMeters: Number(e.target.value || 0),
                          }
                        : p
                    )
                  }
                />
              </div>

              <div className="flex justify-end rtl:justify-start">
                <Button onClick={savePolicy} disabled={savingPolicy}>
                  {savingPolicy
                    ? pickText(locale, t.common.saving, "Saving...")
                    : pickText(locale, "حفظ السياسة", "Save Policy")}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between rtl:lg:flex-row-reverse">
          <CardTitle className="text-start">
            {pickText(locale, "مواقع العمل المسموح بها", "Allowed Work Locations")}
          </CardTitle>

          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button variant="default">
                {pickText(locale, "إضافة موقع", "Add Location")}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full sm:max-w-[560px]">
              <DialogHeader>
                <DialogTitle>
                  {pickText(locale, "إضافة موقع عمل", "Add Work Location")}
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label className="text-start">{pickText(locale, t.common.name, "Name")}</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                    placeholder={pickText(locale, t.attendance.hqExample, "e.g. HQ")}
                    dir={isRtl ? "rtl" : "ltr"}
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-start">
                    {pickText(locale, "الاسم بالعربية (اختياري)", "Arabic Name (optional)")}
                  </Label>
                  <Input
                    value={form.nameAr}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, nameAr: e.target.value }))
                    }
                    placeholder={pickText(locale, "المقر الرئيسي", "")}
                    dir="rtl"
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-start">
                    {pickText(locale, "العنوان (اختياري)", "Address (optional)")}
                  </Label>
                  <Input
                    value={form.address}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, address: e.target.value }))
                    }
                    placeholder={pickText(locale, t.attendance.addressExample, "Riyadh - ...")}
                    dir={isRtl ? "rtl" : "ltr"}
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-2 rtl:flex-row-reverse">
                    <Label className="text-start">{pickText(locale, "حدد الموقع من الخريطة", "Pick on map")}</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!("geolocation" in navigator)) {
                          toast.error(pickText(locale, t.attendance.geolocationNotSupported, "Geolocation is not supported."));
                          return;
                        }
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            const lat = pos.coords.latitude;
                            const lng = pos.coords.longitude;
                            setForm((s) => ({
                              ...s,
                              lat: lat.toFixed(6),
                              lng: lng.toFixed(6),
                            }));
                          },
                          () => {
                            toast.error(pickText(locale, t.attendance.failedGetLocation, "Failed to get your location."));
                          },
                          { enableHighAccuracy: true, timeout: 10000 }
                        );
                      }}
                    >
                      {pickText(locale, "استخدم موقعي", "Use my location")}
                    </Button>
                  </div>

                  <LocationPickerMap
                    locale={locale}
                    lat={toNullableNumber(form.lat)}
                    lng={toNullableNumber(form.lng)}
                    radiusMeters={Number(form.radiusMeters || 0)}
                    onChange={(lat, lng) =>
                      setForm((s) => ({
                        ...s,
                        lat: lat.toFixed(6),
                        lng: lng.toFixed(6),
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="grid gap-2">
                    <Label className="text-start">{pickText(locale, "خط العرض (lat)", "Latitude")}</Label>
                    <Input
                      inputMode="decimal"
                      value={form.lat}
                      onChange={(e) => setForm((s) => ({ ...s, lat: e.target.value }))}
                      placeholder="24.7136"
                      dir="ltr"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-start">{pickText(locale, "خط الطول (lng)", "Longitude")}</Label>
                    <Input
                      inputMode="decimal"
                      value={form.lng}
                      onChange={(e) => setForm((s) => ({ ...s, lng: e.target.value }))}
                      placeholder="46.6753"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="grid gap-2">
                    <Label className="text-start">
                      {pickText(locale, "نصف القطر (متر)", "Radius (meters)")}
                    </Label>
                    <Input
                      inputMode="numeric"
                      value={form.radiusMeters}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, radiusMeters: e.target.value }))
                      }
                      dir="ltr"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-md border p-3 rtl:flex-row-reverse">
                    <div className="space-y-1">
                      <div className="font-medium text-start">
                        {pickText(locale, t.common.enabled, "Active")}
                      </div>
                      <div className="text-xs text-muted-foreground text-start">
                        {pickText(locale, "يمكن استخدامه للتحقق", "Used for validation")}
                      </div>
                    </div>
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={(v) => setForm((s) => ({ ...s, isActive: v }))}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setOpenCreate(false)}
                  disabled={creating}
                >
                  {pickText(locale, t.common.cancel, "Cancel")}
                </Button>
                <Button onClick={createLocation} disabled={creating}>
                  {creating
                    ? pickText(locale, "جاري الإضافة...", "Creating...")
                    : pickText(locale, t.common.add, "Create")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">
              {pickText(locale, t.common.loading, "Loading...")}
            </div>
          ) : locations.length === 0 ? (
            <div className="text-sm text-muted-foreground text-start">
              {pickText(
                locale,
                "لا توجد مواقع بعد. أضف موقعًا ثم فعّل التحقق من المكان.",
                "No locations yet. Add a location then enable geofence enforcement."
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">
                      {pickText(locale, "الموقع", "Location")}
                    </TableHead>
                    <TableHead className="text-start">{pickText(locale, "الإحداثيات", "Coordinates")}</TableHead>
                    <TableHead className="text-start">{pickText(locale, "نصف القطر", "Radius")}</TableHead>
                    <TableHead className="text-start">{pickText(locale, t.common.status, "Status")}</TableHead>
                    <TableHead className="text-start">{pickText(locale, t.common.actions, "Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((loc) => (
                    <TableRow key={loc.id}>
                      <TableCell className="text-start">
                        <div className="font-medium">
                          {locale === "ar" ? loc.nameAr || loc.name : loc.name}
                        </div>
                        {loc.address ? (
                          <div className="text-xs text-muted-foreground">
                            {loc.address}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-start" dir="ltr">
                        {loc.lat}, {loc.lng}
                      </TableCell>
                      <TableCell className="text-start">{loc.radiusMeters}m</TableCell>
                      <TableCell className="text-start">
                        {loc.isActive ? (
                          <Badge variant="default">{pickText(locale, t.common.enabled, "Active")}</Badge>
                        ) : (
                          <Badge variant="secondary">{pickText(locale, "غير مفعل", "Inactive")}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-start">
                        <div className="flex flex-wrap items-center gap-2 rtl:flex-row-reverse">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleActive(loc.id, loc.isActive)}
                          >
                            {loc.isActive
                              ? pickText(locale, "تعطيل", "Disable")
                              : pickText(locale, "تفعيل", "Enable")}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteLocation(loc.id)}
                          >
                            {pickText(locale, t.common.delete, "Delete")}
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
    </div>

    <AlertDialog open={!!locationToDelete} onOpenChange={(open) => { if (!open) setLocationToDelete(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{pickText(locale, t.common.confirmDeleteTitle, "Confirm Deletion")}</AlertDialogTitle>
          <AlertDialogDescription>
            {pickText(locale, `هل أنت متأكد من حذف موقع «${locationToDelete?.nameAr ?? locationToDelete?.name}»؟`, `Are you sure you want to delete «${locationToDelete?.name}»?`)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{pickText(locale, t.common.cancel, "Cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={() => void handleDeleteConfirmed()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {pickText(locale, t.common.delete, "Delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
}

