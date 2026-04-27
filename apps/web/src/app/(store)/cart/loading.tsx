import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Skeleton className="h-9 w-32" />
      <Skeleton className="mt-1 h-4 w-16" />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        {/* Items */}
        <ul className="divide-y divide-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex gap-4 py-6">
              <Skeleton className="h-28 w-20 flex-shrink-0 rounded-none" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="mt-2 h-8 w-28" />
              </div>
              <Skeleton className="h-4 w-16" />
            </li>
          ))}
        </ul>

        {/* Summary */}
        <div className="h-fit border border-border bg-card p-6">
          <Skeleton className="h-4 w-32" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-6 h-12 w-full" />
          <Skeleton className="mx-auto mt-4 h-3 w-28" />
        </div>
      </div>
    </div>
  );
}
