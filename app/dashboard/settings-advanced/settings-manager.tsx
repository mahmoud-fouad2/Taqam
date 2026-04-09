
'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  type SystemSettings,
  type Role,
  type LeaveTypeConfig,
  type ApprovalWorkflow,
} from '@/lib/types/settings';
import { toast } from 'sonner';

import { SettingsHeader } from './_components/settings-header';
import {
  SettingsSidebar,
  type SettingsSectionId,
} from './_components/settings-sidebar';
import { BackupSection } from './_components/section-backup';
import { GeneralSettingsSection } from './_components/section-general';
import { IntegrationsSection } from './_components/section-integrations';
import { LeaveTypesSection } from './_components/section-leaves';
import { LocalizationSection } from './_components/section-localization';
import { NotificationsSection } from './_components/section-notifications';
import { RolesSection } from './_components/section-roles';
import { SecuritySettingsSection } from './_components/section-security';
import { WorkflowsSection } from './_components/section-workflows';
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

type LeaveTypesApiResponse = { data?: any[]; error?: string };

function mapLeaveTypeConfigFromApi(t: any): LeaveTypeConfig {
  const applicable = Array.isArray(t.applicableGenders) ? t.applicableGenders.map(String) : [];
  const applicableGenders: Array<'male' | 'female'> = [];
  if (applicable.includes('MALE')) applicableGenders.push('male');
  if (applicable.includes('FEMALE')) applicableGenders.push('female');

  const annualEntitlement = t.maxDays != null ? Number(t.maxDays) : t.defaultDays != null ? Number(t.defaultDays) : 0;

  return {
    id: String(t.id),
    name: String(t.nameAr ?? t.name ?? ''),
    nameEn: String(t.name ?? ''),
    code: String(t.code ?? ''),
    annualEntitlement,
    isPaid: Boolean(t.isPaid),
    requiresApproval: Boolean(t.requiresApproval),
    requiresAttachment: Boolean(t.requiresAttachment),
    maxDaysPerRequest: t.maxDays != null ? Number(t.maxDays) : undefined,
    minNoticeDays: 0,
    applicableGenders,
    isActive: Boolean(t.isActive),
  };
}

export default function SettingsManager() {
  const locale = useClientLocale();
  const t = getText(locale);
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      companyName: '',
      companyNameEn: '',
      timezone: 'Asia/Riyadh',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '12h',
      currency: 'SAR',
      fiscalYearStart: '01-01',
      weekStartDay: 0,
    },
    localization: {
      defaultLanguage: 'ar',
      supportedLanguages: ['ar', 'en'],
      direction: 'rtl',
      numberFormat: 'ar-SA',
      calendarType: 'both',
    },
    security: {
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        expiryDays: 90,
        preventReuse: 3,
      },
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      twoFactorAuth: 'optional',
      ipWhitelist: [],
      auditLogging: true,
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: false,
      defaultChannels: ['email', 'in-app'],
      digestFrequency: 'immediate',
    },
    integrations: {
      gosi: { enabled: false, autoSync: false },
      mol: { enabled: false, autoSync: false },
      muqeem: { enabled: false, autoSync: false },
      mudad: { enabled: false, autoSync: false },
      erpIntegrations: [],
    },
    backup: {
      autoBackup: false,
      frequency: 'daily',
      retentionDays: 30,
      includeAttachments: true,
    },
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeConfig[]>([]);
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('general');

  const [isBootLoading, setIsBootLoading] = useState(true);
  const [isSavingAll, setIsSavingAll] = useState(false);

  const [isLeaveTypesLoading, setIsLeaveTypesLoading] = useState(true);
  const [leaveTypesError, setLeaveTypesError] = useState<string | null>(null);

  const loadLeaveTypes = useCallback(async () => {
    setIsLeaveTypesLoading(true);
    setLeaveTypesError(null);

    try {
      const res = await fetch('/api/leave-types', { cache: 'no-store' });
      const json = (await res.json()) as LeaveTypesApiResponse;
      if (!res.ok) {
        throw new Error(json.error || t.generalSettings.pFailedToLoadLeaveTypes);
      }

      const mapped = Array.isArray(json.data) ? json.data.map(mapLeaveTypeConfigFromApi) : [];
      setLeaveTypes(mapped);
    } catch (err) {
      setLeaveTypesError(err instanceof Error ? err.message : t.generalSettings.pFailedToLoadLeaveTypes);
    } finally {
      setIsLeaveTypesLoading(false);
    }
  }, [t.generalSettings.pFailedToLoadLeaveTypes]);

  const loadSettingsBundle = useCallback(async () => {
    setIsBootLoading(true);

    try {
      const [settingsRes, rolesRes, workflowsRes] = await Promise.all([
        fetch('/api/settings/system', { cache: 'no-store' }),
        fetch('/api/settings/roles', { cache: 'no-store' }),
        fetch('/api/settings/workflows', { cache: 'no-store' }),
      ]);

      const settingsJson = (await settingsRes.json()) as { data?: SystemSettings; error?: string };
      if (!settingsRes.ok) throw new Error(settingsJson.error || t.platformSettings.loadFailed);
      if (settingsJson.data) setSettings(settingsJson.data);

      const rolesJson = (await rolesRes.json()) as { data?: Role[]; error?: string };
      if (!rolesRes.ok) throw new Error(rolesJson.error || t.generalSettings.pFailedToLoadRoles);
      setRoles(Array.isArray(rolesJson.data) ? rolesJson.data : []);

      const workflowsJson = (await workflowsRes.json()) as { data?: ApprovalWorkflow[]; error?: string };
      if (!workflowsRes.ok) throw new Error(workflowsJson.error || t.generalSettings.pFailedToLoadWorkflows);
      setWorkflows(Array.isArray(workflowsJson.data) ? workflowsJson.data : []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.platformSettings.loadFailed);
    } finally {
      setIsBootLoading(false);
    }
  }, [
    t.generalSettings.pFailedToLoadRoles,
    t.generalSettings.pFailedToLoadWorkflows,
    t.platformSettings.loadFailed,
  ]);

  useEffect(() => {
    void loadSettingsBundle();
    void loadLeaveTypes();
  }, [loadLeaveTypes, loadSettingsBundle]);

  const saveAllChanges = async () => {
    setIsSavingAll(true);

    try {
      const res = await fetch('/api/settings/system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const json = (await res.json()) as { data?: SystemSettings; error?: string };
      if (!res.ok) throw new Error(json.error || t.platformSettings.saveFailed);
      if (json.data) setSettings(json.data);
      toast.success(t.platformSettings.savedSuccess);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.platformSettings.saveFailed);
    } finally {
      setIsSavingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <SettingsHeader onSave={saveAllChanges} disabled={isBootLoading || isSavingAll} />

      <div className="grid gap-6 lg:grid-cols-4">
        <SettingsSidebar activeSection={activeSection} onChange={setActiveSection} />

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeSection === 'general' && (
            <GeneralSettingsSection settings={settings} setSettings={setSettings} />
          )}

          {activeSection === 'security' && (
            <SecuritySettingsSection settings={settings} setSettings={setSettings} />
          )}

          {activeSection === 'integrations' && (
            <IntegrationsSection settings={settings} setSettings={setSettings} />
          )}

          {/* Roles & Permissions */}
          {activeSection === 'roles' && (
            <RolesSection roles={roles} />
          )}

          {/* Leave Types */}
          {activeSection === 'leaves' && (
            <LeaveTypesSection
              leaveTypes={leaveTypes}
              setLeaveTypes={setLeaveTypes}
              isLoading={isLeaveTypesLoading}
              error={leaveTypesError}
            />
          )}

          {/* Workflows */}
          {activeSection === 'workflows' && (
            <WorkflowsSection workflows={workflows} />
          )}

          {/* Backup Settings */}
          {activeSection === 'backup' && (
            <BackupSection settings={settings} setSettings={setSettings} />
          )}

          {/* Notifications Settings */}
          {activeSection === 'notifications' && (
            <NotificationsSection settings={settings} setSettings={setSettings} />
          )}

          {/* Localization Settings */}
          {activeSection === 'localization' && (
            <LocalizationSection settings={settings} setSettings={setSettings} />
          )}
        </div>
      </div>
    </div>
  );
}
