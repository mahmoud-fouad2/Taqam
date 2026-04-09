import { Badge } from "@/components/ui/badge";
import type { EmployeeStatus } from "@/lib/types/core-hr";

import { statusOptions } from "./employee-constants";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  const opt = statusOptions.find((s) => s.value === status);
  if (!opt) return <Badge variant="outline">{status}</Badge>;
  return <Badge className={opt.color}>{opt.label}</Badge>;
}
