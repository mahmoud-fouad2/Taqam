"use client";

import * as React from "react";
import { Loader2, Shield, UserCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
};

export function TenantAdminCredentialsCard({ tenantId }: { tenantId: string }) {
  const [admins, setAdmins] = React.useState<AdminUser[]>([]);
  const [selectedUserId, setSelectedUserId] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [savingEmail, setSavingEmail] = React.useState(false);
  const [savingPassword, setSavingPassword] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const selectedAdmin = React.useMemo(
    () => admins.find((a) => a.id === selectedUserId) ?? null,
    [admins, selectedUserId]
  );

  async function loadAdmins() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/admins`, { credentials: "include" });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "تعذر تحميل مدير الشركة");
      }
      const list = (json.data ?? []) as AdminUser[];
      setAdmins(list);
      const defaultId = list[0]?.id ?? "";
      setSelectedUserId((prev) => prev || defaultId);
      setNewEmail(list[0]?.email ?? "");
    } catch (e) {
      setAdmins([]);
      setSelectedUserId("");
      setNewEmail("");
      setError(e instanceof Error ? e.message : "تعذر تحميل مدير الشركة");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void loadAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  React.useEffect(() => {
    if (selectedAdmin) setNewEmail(selectedAdmin.email);
  }, [selectedAdmin]);

  async function updateAdmin(payload: { newEmail?: string; newPassword?: string }) {
    const res = await fetch(`/api/admin/tenants/${tenantId}/admins`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId: selectedUserId, ...payload }),
    });

    const json = (await res.json()) as any;

    if (!res.ok || !json?.success) {
      throw new Error(json?.error || "فشل تنفيذ العملية");
    }

    setSuccess(json?.message || "تم الحفظ");
  }

  async function onChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!selectedUserId) {
      setError("اختر مدير الشركة أولًا");
      return;
    }

    setSavingEmail(true);
    try {
      await updateAdmin({ newEmail });
      await loadAdmins();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل تغيير البريد");
    } finally {
      setSavingEmail(false);
    }
  }

  async function onResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!selectedUserId) {
      setError("اختر مدير الشركة أولًا");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("تأكيد كلمة المرور غير مطابق");
      return;
    }

    setSavingPassword(true);
    try {
      await updateAdmin({ newPassword });
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل تعيين كلمة المرور");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          إدارة حساب مدير الشركة
        </CardTitle>
        <CardDescription>
          تعديل بيانات دخول مدير الشركة (TENANT_ADMIN) لهذه الشركة.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            جاري تحميل البيانات...
          </div>
        ) : admins.length === 0 ? (
          <div className="rounded-lg border p-4 text-sm text-muted-foreground">
            لا يوجد مستخدم بصلاحية TENANT_ADMIN لهذه الشركة.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>مدير الشركة</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر مدير الشركة" />
                </SelectTrigger>
                <SelectContent>
                  {admins.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.firstName} {admin.lastName} — {admin.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                الدور: TENANT_ADMIN — الحالة: {selectedAdmin?.status ?? "—"}
              </p>
            </div>

            <Separator />

            {error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200">
                {success}
              </div>
            ) : null}

            <form onSubmit={onChangeEmail} className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">تغيير البريد الإلكتروني</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-email">البريد الإلكتروني الجديد</Label>
                  <Input
                    id="new-email"
                    type="email"
                    dir="ltr"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="admin@company.com"
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={savingEmail} className="w-full sm:w-auto">
                    {savingEmail ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                    حفظ البريد
                  </Button>
                </div>
              </div>
            </form>

            <Separator />

            <form onSubmit={onResetPassword} className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">تعيين كلمة مرور جديدة</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    dir="ltr"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="********"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    dir="ltr"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="********"
                  />
                </div>
              </div>
              <Button type="submit" variant="destructive" disabled={savingPassword}>
                {savingPassword ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                تعيين كلمة المرور
              </Button>
              <p className="text-xs text-muted-foreground">
                سيتم تسجيل خروج المستخدم من بعض الأجهزة عند تغيير كلمة المرور.
              </p>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
