"use client";

export function TableSkeleton({ rowCount = 8, columnCount = 15 }: { rowCount?: number; columnCount?: number }) {
  return (
    <div className="w-full space-y-2 px-4 py-4">
      {/* Header skeleton */}
      <div className="flex gap-4 mb-4">
        {Array.from({ length: columnCount }).map((_, i) => (
          <div key={`header-${i}`} className="h-5 w-24 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-pulse" />
        ))}
      </div>

      {/* Rows skeleton */}
      {Array.from({ length: rowCount }).map((_, rowIdx) => (
        <div key={`row-${rowIdx}`} className="flex gap-4 py-3 border-b border-slate-100 last:border-b-0">
          {Array.from({ length: columnCount }).map((_, colIdx) => (
            <div
              key={`cell-${rowIdx}-${colIdx}`}
              className="h-4 flex-1 bg-gradient-to-r from-slate-100 to-slate-50 rounded animate-pulse"
              style={{
                width: colIdx === 0 ? "150px" : "auto",
                animation: `pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
                animationDelay: `${rowIdx * 50 + colIdx * 30}ms`,
              }}
            />
          ))}
        </div>
      ))}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

export function TableSkeletonWithSpinner() {
  return (
    <div className="w-full">
     
      {/* Skeleton rows below */}
      <TableSkeleton rowCount={6} columnCount={12} />
    </div>
  );
}
