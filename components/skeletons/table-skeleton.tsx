import { Skeleton } from "@/components/ui/skeleton";

const gridColsClass: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  7: "grid-cols-7",
  8: "grid-cols-8",
  9: "grid-cols-9",
  10: "grid-cols-10",
  11: "grid-cols-11",
  12: "grid-cols-12"
};

export function TableSkeleton({
  rows = 6,
  columns = 6,
  showHeader = true
}: {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}) {
  const colsClass = gridColsClass[Math.min(12, Math.max(1, Math.floor(columns)))] ?? "grid-cols-6";

  return (
    <div className="w-full overflow-hidden rounded-lg border">
      {showHeader ? (
        <div className="bg-muted/30 border-b px-4 py-3">
          <Skeleton className="h-4 w-40" />
        </div>
      ) : null}

      <div className="p-4">
        <div className="space-y-3" role="status" aria-label="Loading">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className={`grid gap-3 ${colsClass}`}>
              {Array.from({ length: columns }).map((__, c) => (
                <Skeleton key={c} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
