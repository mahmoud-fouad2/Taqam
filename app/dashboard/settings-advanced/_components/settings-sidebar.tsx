"use client";

import {
  Bell,
  Building2,
  Calendar,
  Database,
  Globe,
  Link,
  Settings,
  Shield,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export type SettingsSectionId =
  | 'general'
  | 'localization'
  | 'security'
  | 'notifications'
  | 'integrations'
  | 'backup'
  | 'roles'
  | 'leaves'
  | 'workflows';

const SECTIONS: Array<{ id: SettingsSectionId; label: string; icon: LucideIcon }> = [
  { id: 'general', label: t.generalSettings.pGeneralSettings, icon: Building2 },
  { id: 'localization', label: t.generalSettings.pLanguageFormatting, icon: Globe },
  { id: 'security', label: t.generalSettings.pSecurity, icon: Shield },
  { id: 'notifications', label: t.generalSettings.pNotifications, icon: Bell },
  { id: 'integrations', label: t.generalSettings.pIntegrations, icon: Link },
  { id: 'backup', label: t.generalSettings.pBackup, icon: Database },
  { id: 'roles', label: t.generalSettings.pRolesPermissions, icon: Users },
  { id: 'leaves', label: t.generalSettings.pLeaveTypes, icon: Calendar },
  { id: 'workflows', label: t.generalSettings.pWorkflows, icon: Settings },
];

export function SettingsSidebar({
  activeSection,
  onChange,
}: {
  activeSection: SettingsSectionId;
  onChange: (section: SettingsSectionId) => void;
}) {
  const locale = useClientLocale();
  const t = getText(locale);
  return (
    <Card className="lg:col-span-1">
      <CardContent className="p-2">
        <nav className="space-y-1">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => onChange(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeSection === section.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{section.label}</span>
              </button>
            );
          })}
        </nav>
      </CardContent>
    </Card>
  );
}
