import { Skeleton } from '@/components/ui/skeleton'

export function MilestoneTimelineSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-8">
      {[0, 1].map((index) => (
        <div key={index} className="grid gap-3 lg:grid-cols-[140px_minmax(0,1fr)] lg:gap-6">
          <Skeleton className="mt-2 h-6 w-32" />
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-11 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}
