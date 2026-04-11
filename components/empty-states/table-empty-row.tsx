import * as React from "react";

import { TableCell, TableRow } from "@/components/ui/table";
import { TableEmptyState } from "@/components/empty-states/table-empty-state";

export function TableEmptyRow({
  colSpan,
  title,
  description,
  icon,
  actionLabel,
  onAction
}: {
  colSpan: number;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-10">
        <TableEmptyState
          title={title}
          description={description}
          icon={icon}
          actionLabel={actionLabel}
          onAction={onAction}
        />
      </TableCell>
    </TableRow>
  );
}
