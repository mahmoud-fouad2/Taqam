"use client";

import { Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function SettingsHeader({
  onSave,
  disabled,
}: {
  onSave: () => void;
  disabled: boolean;
}) {
  const locale = useClientLocale();
  const t = getText(locale);
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold">{t.common.options}</h1>
        <p className="text-muted-foreground">{t.generalSettings.pSystemSettingsAndConfiguration}</p>
      </div>
      <Button onClick={onSave} disabled={disabled}>
        <Save className="h-4 w-4 ms-2" />
        {t.generalSettings.pSaveAllChanges}
      </Button>
    </div>
  );
}
