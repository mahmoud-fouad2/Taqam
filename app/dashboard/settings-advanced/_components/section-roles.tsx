"use client";

import { Plus, Users, Edit } from 'lucide-react';

import type { Role } from '@/lib/types/settings';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
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
            <Plus className="h-4 w-4 ms-2" />
            {t.generalSettings.pNewRole}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {roles.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">{t.generalSettings.pNoRolesFound}</div>
          ) : (
            roles.map((role) => (
              <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{role.name}</h4>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">{role.usersCount} {t.generalSettings.pUser}</Badge>
                  {role.isSystem && <Badge variant="outline">{t.generalSettings.pSystem}</Badge>}
                  <Button variant="outline" size="sm" disabled>
                    <Edit className="h-4 w-4 ms-1" />{t.common.edit}</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
