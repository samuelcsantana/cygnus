import { Skeleton } from '@/components/ui/skeleton'

export function MilestoneTimelineSkeleton() {
  return (
    <div className="relative ml-4 max-w-3xl sm:ml-8" aria-hidden="true">
      <div className="absolute top-6 bottom-6 left-6 w-1 rounded-full bg-muted" />

      <div className="space-y-10">
        {[0, 1, 2].map((index) => (
          <div key={index} className="relative flex items-start">
            <Skeleton className="absolute left-6 z-10 -ml-[1.65rem] h-14 w-14 rounded-2xl" />
            <div className="ml-20 w-full space-y-3 rounded-[2rem] border border-border bg-card p-8 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-6 w-24 rounded-lg" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
