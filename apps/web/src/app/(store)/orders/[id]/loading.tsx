import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      {/* Header (mirrors the "thank you" confirmed state) */}
      <div className="mb-8 flex flex-col items-center text-center">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="mt-4 h-7 w-64" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      <div className="space-y-6">
        {/* Order meta */}
        <Skeleton className="h-14 w-full" />

        {/* Items */}
        <div className="border border-border bg-card">
          <div className="border-b border-border px-5 py-3">
            <Skeleton className="h-4 w-10" />
          </div>
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-border px-5 py-4 last:border-0"
            >
              <Skeleton className="h-16 w-16 flex-shrink-0 rounded-none" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/5" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border border-border bg-card px-5 py-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>

        {/* Shipping address */}
        <div className="border border-border bg-card px-5 py-4 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-8 flex gap-4">
        <Skeleton className="h-12 flex-1" />
        <Skeleton className="h-12 flex-1" />
      </div>
    </div>
  );
}
