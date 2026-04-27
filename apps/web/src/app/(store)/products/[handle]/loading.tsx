import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-8 flex items-center gap-2">
        <Skeleton className="h-3 w-20" />
        <span className="text-muted-foreground">/</span>
        <Skeleton className="h-3 w-36" />
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Image */}
        <Skeleton className="aspect-[3/4] rounded-none" />

        {/* Details */}
        <div className="flex flex-col justify-center lg:py-8">
          <Skeleton className="h-2.5 w-8" />
          <Skeleton className="mt-4 h-9 w-2/3" />
          <Skeleton className="mt-5 h-6 w-24" />

          <div className="mt-6 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <div className="mt-10 border-t border-border pt-8">
            <Skeleton className="h-12 w-full" />
          </div>

          <div className="mt-8 space-y-2">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>
      </div>
    </div>
  );
}
