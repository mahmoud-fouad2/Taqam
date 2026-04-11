"use client";

import { Plus, Users, Edit } from "lucide-react";

import type { Role } from "@/lib/types/settings";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function RolesSection({ roles }: { roles: Role[] }) {
  const locale = useClientLocale();
  const t = getText(locale);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t.generalSettings.pRolesPermissions}
            </CardTitle>
            <CardDescription>{t.generalSettings.pManageUserRolesAndPermissions}</CardDescription>
          </div>
          <Button disabled onClick={() => toast.message(t.common.notAvailable)}>
            <Plus className="ms-2 h-4 w-4" />
            {t.generalSettings.pNewRole}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {roles.length === 0 ? (
            <div className="text-muted-foreground py-10 text-center">
              {t.generalSettings.pNoRolesFound}
            </div>
          ) : (
            roles.map((role) => (
              <div
                key={role.id}
                className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{role.name}</h4>
                    <p className="text-muted-foreground text-sm">{role.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">
                    {role.usersCount} {t.generalSettings.pUser}
                  </Badge>
                  {role.isSystem && <Badge variant="outline">{t.generalSettings.pSystem}</Badge>}
                  <Button variant="outline" size="sm" disabled>
                    <Edit className="ms-1 h-4 w-4" />
                    {t.common.edit}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
