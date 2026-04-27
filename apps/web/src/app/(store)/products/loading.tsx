import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <div className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Skeleton className="h-2.5 w-8" />
          <Skeleton className="mt-2 h-9 w-40" />
          <Skeleton className="mt-2 h-4 w-16" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <ul className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="bg-background">
              <div>
                <Skeleton className="aspect-[3/4] rounded-none" />
                <div className="p-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-1/4" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
