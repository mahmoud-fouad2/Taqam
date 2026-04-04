import { TableSkeleton } from "@/components/skeletons/table-skeleton";

export default function NotificationsLoading() {
  return (
    <div className="space-y-6 p-1">
      <TableSkeleton columns={3} rows={8} />
    </div>
  );
}
