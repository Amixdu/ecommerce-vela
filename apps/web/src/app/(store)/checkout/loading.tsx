import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Skeleton className="h-9 w-36" />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
        {/* Shipping + payment */}
        <div className="space-y-6">
          <Skeleton className="h-7 w-52" />

          {/* Email */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* First / last name */}
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* City / postal code */}
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>

          {/* Payment element */}
          <div className="space-y-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-36 w-full" />
          </div>

          <Skeleton className="h-12 w-full" />
        </div>

        {/* Order summary */}
        <div>
          <Skeleton className="h-7 w-40" />
          <div className="mt-4 divide-y divide-border">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between py-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-border pt-4">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}
