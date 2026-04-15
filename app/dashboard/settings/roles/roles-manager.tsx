"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Shield, ShieldCheck, Users, Pencil, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PERMISSION_GROUPS, ALL_PERMISSIONS } from "@/lib/rbac";
import type { Permission } from "@/lib/rbac";

type CustomRole = {
  id: string;
  name: string;
  nameAr: string | null;
  description: string | null;
  permissions: string[];
  isBuiltin: boolean;
  _count: { users: number };
};

async function fetchRoles(): Promise<CustomRole[]> {
  const res = await fetch("/api/roles");
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Failed to load roles");
  return json.data ?? [];
}

async function seedRoles(): Promise<void> {
  const res = await fetch("/api/roles/seed", { method: "POST" });
  if (!res.ok) throw new Error("Seed failed");
}

async function saveRole(id: string, permissions: string[]) {
  const res = await fetch(`/api/roles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ permissions })
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Save failed");
  return json.data;
}

async function createRole(data: {
  name: string;
  nameAr?: string;
  description?: string;
  permissions: string[];
}) {
  const res = await fetch("/api/roles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Create failed");
  return json.data;
}

async function deleteRole(id: string) {
  const res = await fetch(`/api/roles/${id}`, { method: "DELETE" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Delete failed");
}

export function RolesManager() {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null);
  const [editedPermissions, setEditedPermissions] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleNameAr, setNewRoleNameAr] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchRoles();
      setRoles(data);
      if (data.length === 0) {
        await seedRoles();
        const seeded = await fetchRoles();
        setRoles(seeded);
      }
    } catch {
      toast.error("فشل في تحميل الأدوار");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectRole = (role: CustomRole) => {
    setSelectedRole(role);
    setEditedPermissions(new Set(role.permissions));
  };

  const togglePermission = (perm: Permission) => {
    setEditedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return next;
    });
  };

  const toggleGroup = (perms: Permission[]) => {
    const allOn = perms.every((p) => editedPermissions.has(p));
    setEditedPermissions((prev) => {
      const next = new Set(prev);
      if (allOn) perms.forEach((p) => next.delete(p));
      else perms.forEach((p) => next.add(p));
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    try {
      await saveRole(selectedRole.id, [...editedPermissions]);
      setRoles((prev) =>
        prev.map((r) =>
          r.id === selectedRole.id ? { ...r, permissions: [...editedPermissions] } : r
        )
      );
      toast.success("تم حفظ الصلاحيات بنجاح");
    } catch (e: any) {
      toast.error(e.message || "فشل الحفظ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newRoleName.trim()) return;
    setIsCreating(true);
    try {
      const created = await createRole({
        name: newRoleName.trim(),
        nameAr: newRoleNameAr.trim() || undefined,
        permissions: []
      });
      setRoles((prev) => [...prev, { ...created, _count: { users: 0 } }]);
      setIsCreateOpen(false);
      setNewRoleName("");
      setNewRoleNameAr("");
      toast.success("تم إنشاء الدور بنجاح");
    } catch (e: any) {
      toast.error(e.message || "فشل الإنشاء");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (role: CustomRole) => {
    if (role.isBuiltin) return;
    if (!confirm(`حذف دور "${role.nameAr || role.name}"؟`)) return;
    try {
      await deleteRole(role.id);
      setRoles((prev) => prev.filter((r) => r.id !== role.id));
      if (selectedRole?.id === role.id) setSelectedRole(null);
      toast.success("تم حذف الدور");
    } catch (e: any) {
      toast.error(e.message || "فشل الحذف");
    }
  };

  const isEdited =
    selectedRole &&
    (editedPermissions.size !== selectedRole.permissions.length ||
      [...editedPermissions].some((p) => !selectedRole.permissions.includes(p)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة الأدوار والصلاحيات</h2>
          <p className="text-muted-foreground text-sm">أنشئ أدواراً مخصصة وحدد صلاحياتها بدقة</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="ms-2 h-4 w-4" />
            دور جديد
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Roles list */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">الأدوار</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              </div>
            ) : (
              <ul className="divide-y">
                {roles.map((role) => (
                  <li
                    key={role.id}
                    onClick={() => selectRole(role)}
                    className={`hover:bg-muted/50 flex cursor-pointer items-center justify-between px-4 py-3 transition-colors ${
                      selectedRole?.id === role.id ? "bg-muted" : ""
                    }`}>
                    <div className="flex min-w-0 items-center gap-2">
                      {role.isBuiltin ? (
                        <ShieldCheck className="text-primary h-4 w-4 shrink-0" />
                      ) : (
                        <Shield className="text-muted-foreground h-4 w-4 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{role.nameAr || role.name}</p>
                        <p className="text-muted-foreground flex items-center gap-1 text-xs">
                          <Users className="h-3 w-3" />
                          {role._count.users}
                          &nbsp;· {role.permissions.length} صلاحية
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {role.isBuiltin && (
                        <Badge variant="secondary" className="text-xs">
                          افتراضي
                        </Badge>
                      )}
                      {!role.isBuiltin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDelete(role);
                          }}>
                          <Trash2 className="text-muted-foreground h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Permissions matrix */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {selectedRole ? selectedRole.nameAr || selectedRole.name : "اختر دوراً"}
                </CardTitle>
                {selectedRole && (
                  <CardDescription>
                    {editedPermissions.size} / {ALL_PERMISSIONS.length} صلاحية محددة
                  </CardDescription>
                )}
              </div>
              {selectedRole && isEdited && (
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="ms-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Pencil className="ms-2 h-4 w-4" />
                  )}
                  حفظ
                </Button>
              )}
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {!selectedRole ? (
              <div className="text-muted-foreground flex flex-col items-center justify-center py-16">
                <Shield className="mb-3 h-10 w-10 opacity-30" />
                <p>اختر دوراً من القائمة لتعديل صلاحياته</p>
              </div>
            ) : (
              <ScrollArea className="h-[480px]">
                <div className="divide-y">
                  {PERMISSION_GROUPS.map((group) => {
                    const allOn = group.permissions.every((p) => editedPermissions.has(p));
                    const someOn =
                      !allOn && group.permissions.some((p) => editedPermissions.has(p));
                    return (
                      <div key={group.groupEn} className="px-4 py-3">
                        <div className="mb-2 flex items-center gap-2">
                          <Checkbox
                            checked={allOn}
                            data-state={someOn ? "indeterminate" : allOn ? "checked" : "unchecked"}
                            onCheckedChange={() => toggleGroup(group.permissions)}
                          />
                          <span className="text-sm font-semibold">{group.groupAr}</span>
                          <span className="text-muted-foreground text-xs">
                            ({group.permissions.filter((p) => editedPermissions.has(p)).length}/
                            {group.permissions.length})
                          </span>
                        </div>
                        <div className="ms-6 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                          {group.permissions.map((perm) => (
                            <label key={perm} className="flex cursor-pointer items-center gap-1.5">
                              <Checkbox
                                checked={editedPermissions.has(perm)}
                                onCheckedChange={() => togglePermission(perm as Permission)}
                              />
                              <span className="text-muted-foreground font-mono text-xs">
                                {perm}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Role Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إنشاء دور جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>اسم الدور (EN)</Label>
              <Input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g. Finance Manager"
              />
            </div>
            <div className="space-y-1">
              <Label>اسم الدور (AR)</Label>
              <Input
                value={newRoleNameAr}
                onChange={(e) => setNewRoleNameAr(e.target.value)}
                placeholder="مدير المالية"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreate} disabled={isCreating || !newRoleName.trim()}>
              {isCreating && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
              إنشاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
