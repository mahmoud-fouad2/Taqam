"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import type { Employee } from "@/lib/types/core-hr";
import { getEmployeeFullName } from "@/lib/types/core-hr";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function EmployeeDeleteDialog({
  open,
  onOpenChange,
  employee,
  onConfirm
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onConfirm: () => void;
}) {
  const locale = useClientLocale();
  const t = getText(locale);
  const isTerminated = employee?.status === "terminated";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.common.areYouSure}</AlertDialogTitle>
          <AlertDialogDescription>
            {isTerminated ? (
              <>
                {t.employees.pTheEmployeeWillBeDeleted} &quot;
                {employee ? getEmployeeFullName(employee, "ar") : ""}&quot;{" "}
                {t.employees.pPermanently}
                {t.employees.pThisActionCannotBeUndone}
              </>
            ) : (
              <>
                {t.employees.pTheEmployeeServiceWillBeTermin} &quot;
                {employee ? getEmployeeFullName(employee, "ar") : ""}&quot;.
                {t.employees.pYouCanPressDeleteAgainLaterFor}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground"
            disabled={!employee}>
            {isTerminated ? t.employees.permanentDelete : t.employees.terminateService}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
