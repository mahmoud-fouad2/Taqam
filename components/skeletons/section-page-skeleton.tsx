import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";

export function SectionPageSkeleton({
  withSubtitle = true,
  tableColumns = 6,
  tableRows = 6
}: {
  withSubtitle?: boolean;
  tableColumns?: number;
  tableRows?: number;
}) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          {withSubtitle ? <Skeleton className="h-4 w-72" /> : null}
        </div>
      </div>
      <TableSkeleton columns={tableColumns} rows={tableRows} />
    </div>
  );
}
